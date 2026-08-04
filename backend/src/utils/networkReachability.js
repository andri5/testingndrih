import dns from 'dns/promises'
import net from 'net'

/**
 * True for RFC1918 / loopback / link-local addresses that a public VPS cannot reach.
 */
export function isPrivateIp(ip) {
  if (!ip || typeof ip !== 'string') return false
  const v = ip.trim().toLowerCase()
  if (v === '::1' || v === '0:0:0:0:0:0:0:1') return true
  if (v.startsWith('fe80:') || v.startsWith('fc') || v.startsWith('fd')) return true

  if (net.isIP(v) === 4) {
    const parts = v.split('.').map(Number)
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false
    const [a, b] = parts
    if (a === 10) return true
    if (a === 127) return true
    if (a === 192 && b === 168) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 169 && b === 254) return true
    return false
  }
  return false
}

/**
 * In production, cloud Playwright cannot reach private/VPN hosts.
 * Override with ALLOW_PRIVATE_NETWORK_EXECUTION=true (on-prem runner on the same LAN).
 */
export function isPrivateNetworkExecutionBlocked() {
  if (process.env.ALLOW_PRIVATE_NETWORK_EXECUTION === 'true') return false
  return process.env.NODE_ENV === 'production'
}

/**
 * Resolve hostname and detect if any address is private / unreachable from public internet.
 */
export async function analyzeTargetReachability(rawUrl) {
  let hostname
  try {
    hostname = new URL(rawUrl).hostname
  } catch {
    return { ok: false, reason: 'invalid_url', privateNetwork: false, addresses: [] }
  }

  // Literal private IP — no DNS needed
  if (net.isIP(hostname) && isPrivateIp(hostname)) {
    return {
      ok: false,
      reason: 'private_network',
      privateNetwork: true,
      addresses: [hostname],
      message:
        `URL mengarah ke jaringan internal (${hostname}). ` +
        'Server production di internet tidak bisa membuka halaman ini.',
    }
  }

  if (hostname === 'localhost' || hostname.endsWith('.local')) {
    return {
      ok: false,
      reason: 'private_network',
      privateNetwork: true,
      addresses: ['127.0.0.1'],
      message: 'URL mengarah ke localhost — server production tidak bisa mengaksesnya.',
    }
  }

  try {
    const results = await dns.lookup(hostname, { all: true, verbatim: true })
    const addresses = results.map((r) => r.address)
    const privateHit = addresses.find((ip) => isPrivateIp(ip))
    if (privateHit) {
      return {
        ok: false,
        reason: 'private_network',
        privateNetwork: true,
        addresses,
        message:
          `URL mengarah ke jaringan internal (${privateHit}). ` +
          'Server production di internet tidak bisa membuka halaman ini — pakai mode rekam di browser Anda.',
      }
    }
    return { ok: true, reason: null, privateNetwork: false, addresses }
  } catch (err) {
    return {
      ok: false,
      reason: 'dns_failed',
      privateNetwork: false,
      addresses: [],
      message: `DNS gagal untuk ${hostname}: ${err.message}`,
    }
  }
}

export function formatFetchNetworkError(err) {
  const cause = err?.cause
  const code = cause?.code || err?.code || ''
  const detail = cause?.message || err?.message || 'fetch failed'
  if (code === 'ENOTFOUND') return `DNS tidak menemukan host (${detail})`
  if (code === 'ECONNREFUSED') return `Koneksi ditolak oleh host (${detail})`
  if (code === 'ETIMEDOUT' || code === 'UND_ERR_CONNECT_TIMEOUT') return `Timeout menghubungi host (${detail})`
  if (code === 'ECONNRESET') return `Koneksi diputus host (${detail})`
  if (code === 'ENETUNREACH' || code === 'EHOSTUNREACH') {
    return `Host tidak terjangkau dari server (kemungkinan jaringan internal/VPN) (${detail})`
  }
  if (String(detail).toLowerCase().includes('certificate')) {
    return `Sertifikat TLS bermasalah (${detail})`
  }
  return detail
}

/**
 * Turn Playwright navigation failures into actionable Indonesian messages.
 */
export function formatPlaywrightNavigationError(err, targetUrl = '') {
  const raw = err?.message || String(err || 'Navigation failed')
  const urlHint = targetUrl ? ` (${targetUrl})` : ''
  const lower = raw.toLowerCase()

  if (lower.includes('timeout') || lower.includes('exceeded')) {
    return (
      `Timeout membuka halaman${urlHint}. ` +
      'Jika URL berada di jaringan internal/VPN (mis. 10.x), server production tidak bisa menjangkaunya — ' +
      'rekam dari PC Anda boleh, tapi Run cloud akan gagal. Jalankan backend di jaringan yang sama atau gunakan URL publik.'
    )
  }
  if (lower.includes('net::err_connection_refused') || lower.includes('connection refused')) {
    return `Koneksi ditolak saat membuka${urlHint}. Pastikan layanan target berjalan dan dapat diakses dari server.`
  }
  if (lower.includes('net::err_name_not_resolved') || lower.includes('enotfound')) {
    return `DNS tidak menemukan host${urlHint}. Periksa ejaan URL atau DNS server.`
  }
  if (
    lower.includes('net::err_connection_timed_out') ||
    lower.includes('net::err_address_unreachable') ||
    lower.includes('err_network_access_denied')
  ) {
    return (
      `Host tidak terjangkau dari server${urlHint}. ` +
      'Kemungkinan jaringan internal/VPN — Run di cloud production tidak mendukung target privat.'
    )
  }
  if (lower.includes('ssl') || lower.includes('certificate')) {
    return `Masalah sertifikat TLS saat membuka${urlHint}: ${raw}`
  }
  return raw
}

/**
 * Collect unique http(s) URLs that execution will try to open.
 */
export function collectExecutionTargetUrls(scenario, steps = []) {
  const urls = []
  const push = (v) => {
    const s = String(v || '').trim()
    if (!s) return
    try {
      const u = new URL(s)
      if (u.protocol === 'http:' || u.protocol === 'https:') urls.push(u.href)
    } catch { /* ignore */ }
  }

  push(scenario?.url)
  for (const step of steps) {
    if (step?.type === 'NAVIGATE') push(step.value)
  }
  return [...new Set(urls)]
}

/**
 * Preflight before cloud Run. Blocks private targets in production (unless overridden).
 */
export async function preflightExecutionTargets(urls = []) {
  const unique = [...new Set((urls || []).filter(Boolean))]
  const blockPrivate = isPrivateNetworkExecutionBlocked()

  for (const url of unique) {
    const reach = await analyzeTargetReachability(url)
    if (!reach.privateNetwork) continue

    const message = blockPrivate
      ? `Target "${url}" berada di jaringan internal/VPN. ` +
        'Run di server production tidak bisa membuka URL ini (akan timeout). ' +
        'Rekam dari browser Anda tetap bisa; untuk playback, jalankan backend di jaringan yang sama ' +
        'atau set ALLOW_PRIVATE_NETWORK_EXECUTION=true pada runner on-prem.'
      : `Peringatan: "${url}" tampak internal/VPN. Lanjutkan hanya jika runner berada di jaringan yang sama.`

    return {
      privateNetwork: true,
      blocked: blockPrivate,
      url,
      code: 'PRIVATE_NETWORK',
      message,
      ...summarizeTargetReachability(reach),
    }
  }

  return {
    privateNetwork: false,
    blocked: false,
    targetKind: 'public',
    code: null,
    message: null,
  }
}

/**
 * UI/API summary: public vs internal (private IP / localhost).
 */
export function summarizeTargetReachability(reach) {
  const privateNetwork = Boolean(reach?.privateNetwork)
  const executionBlocked = privateNetwork && isPrivateNetworkExecutionBlocked()
  return {
    targetKind: privateNetwork ? 'internal' : 'public',
    executionBlocked,
    reachability: {
      privateNetwork,
      ok: reach?.ok !== false && !privateNetwork,
      reason: reach?.reason || null,
      addresses: Array.isArray(reach?.addresses) ? reach.addresses : [],
      message:
        reach?.message ||
        (privateNetwork
          ? 'Target berada di jaringan internal/VPN — server production tidak bisa mem-proxy / Run cloud ke halaman ini.'
          : 'Target tampak publik (DNS bukan IP privat).'),
    },
  }
}
