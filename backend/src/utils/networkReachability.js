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
 * Resolve hostname and detect if any address is private / unreachable from public internet.
 */
export async function analyzeTargetReachability(rawUrl) {
  let hostname
  try {
    hostname = new URL(rawUrl).hostname
  } catch {
    return { ok: false, reason: 'invalid_url', privateNetwork: false, addresses: [] }
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
