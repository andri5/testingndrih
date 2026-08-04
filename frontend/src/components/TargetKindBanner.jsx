import { useState } from 'react'
import { Globe, ShieldAlert, ChevronDown, ChevronUp, CheckCircle2, XCircle, Info } from 'lucide-react'

/**
 * Prominent public vs internal/VPN target explanation for scenario URLs.
 */
export default function TargetKindBanner({
  targetKind,
  executionBlocked = false,
  isProbing = false,
  message = '',
  addresses = [],
  url = '',
  labels = {},
}) {
  const [expanded, setExpanded] = useState(targetKind === 'internal')

  if (isProbing) {
    return (
      <div className="rounded-xl border border-slate-600/40 bg-slate-800/40 px-4 py-3 text-sm text-slate-300 flex items-center gap-2">
        <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
        {labels.probing || 'Mendeteksi jenis URL target…'}
      </div>
    )
  }

  if (!targetKind) return null

  const isInternal = targetKind === 'internal'
  const shell = isInternal
    ? 'border-amber-500/50 bg-gradient-to-br from-amber-950/50 to-amber-900/20'
    : 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 to-emerald-900/15'
  const badge = isInternal
    ? 'bg-amber-500 text-amber-950'
    : 'bg-emerald-500 text-emerald-950'
  const Icon = isInternal ? ShieldAlert : Globe

  return (
    <div className={`rounded-xl border-2 ${shell} px-4 py-3.5 shadow-sm`}>
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
              isInternal ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide ${badge}`}>
                {isInternal ? labels.badgeInternal || 'Internal / VPN' : labels.badgePublic || 'Publik (external)'}
              </span>
              {isInternal && executionBlocked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
                  <XCircle size={12} />
                  {labels.cloudRunBlocked || 'Cloud Run diblokir'}
                </span>
              )}
              {!isInternal && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                  <CheckCircle2 size={12} />
                  {labels.cloudRunOk || 'Cloud Run tersedia'}
                </span>
              )}
            </div>
            <p className={`text-sm font-medium ${isInternal ? 'text-amber-100' : 'text-emerald-100'}`}>
              {isInternal
                ? labels.summaryInternal ||
                  'URL ini mengarah ke jaringan privat/VPN — berbeda dari situs publik di internet.'
                : labels.summaryPublic ||
                  'URL ini tampak publik (external) — bisa dijangkau dari server cloud production.'}
            </p>
            {(message || url) && (
              <p className="text-xs text-slate-400 mt-1 break-all">
                {url && <span className="font-mono text-slate-300">{url}</span>}
                {url && message ? ' — ' : ''}
                {message}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border ${
            isInternal
              ? 'border-amber-500/40 text-amber-200 hover:bg-amber-500/10'
              : 'border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10'
          }`}
        >
          <Info size={13} />
          {expanded ? labels.hideDetails || 'Sembunyikan' : labels.showDetails || 'Penjelasan lengkap'}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className={`mt-3 pt-3 border-t ${isInternal ? 'border-amber-500/25' : 'border-emerald-500/25'}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-1.5">
            <Info size={12} />
            {labels.detailsTitle || 'Apa bedanya Publik vs Internal?'}
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-black/20 border border-white/5 p-3">
              <p className="font-semibold text-emerald-300 mb-1.5">
                {labels.publicTitle || 'Publik (external)'}
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                {(labels.publicBullets || []).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-black/20 border border-white/5 p-3">
              <p className="font-semibold text-amber-300 mb-1.5">
                {labels.internalTitle || 'Internal / VPN'}
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                {(labels.internalBullets || []).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </div>

          {isInternal && (
            <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/25 p-3">
              <p className="text-xs font-semibold text-amber-200 mb-1.5">
                {labels.whatYouCanDo || 'Yang bisa Anda lakukan untuk URL internal'}
              </p>
              <ul className="space-y-1.5 text-xs text-amber-100/90 list-disc pl-4">
                {(labels.internalActions || []).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(addresses) && addresses.length > 0 && (
            <p className="text-[11px] text-slate-500 mt-2 font-mono">
              {labels.resolvedIps || 'Resolved IP'}: {addresses.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export const defaultTargetKindLabels = {
  probing: 'Mendeteksi jenis URL target (publik vs internal)…',
  badgePublic: 'Publik (external)',
  badgeInternal: 'Internal / VPN',
  cloudRunOk: 'Cloud Run tersedia',
  cloudRunBlocked: 'Cloud Run diblokir',
  summaryPublic:
    'URL eksternal yang bisa dijangkau dari internet — server cloud Test Sambil Ngopi bisa Record (proxy) & Run ke sini.',
  summaryInternal:
    'URL berada di LAN/VPN (mis. 10.x, 192.168.x, 172.16–31.x, localhost). Server cloud TIDAK bisa membuka halaman ini dari VPS publik.',
  showDetails: 'Penjelasan lengkap',
  hideDetails: 'Sembunyikan',
  detailsTitle: 'Apa bedanya Publik vs Internal?',
  publicTitle: 'Publik (external)',
  internalTitle: 'Internal / VPN',
  publicBullets: [
    'DNS resolve ke IP publik di internet (bukan rentang privat RFC1918).',
    'Record & Run dari production (testsambilngopi.com) biasanya berhasil.',
    'Cocok untuk staging/demo yang sudah diekspos ke internet (HTTP/HTTPS publik).',
    'Live Browser Runner di cloud memakai Playwright di VPS yang sama.',
  ],
  internalBullets: [
    'Termasuk IP privat: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.1, localhost.',
    'Hanya bisa dibuka dari PC yang terhubung VPN/LAN yang sama dengan staging Anda.',
    'Cloud Run di production akan diblokir lebih dulu (bukan timeout 30 detik yang membingungkan).',
    'Proxy recording dari VPS juga tidak bisa — mode dikunci ke “situs asli” di browser Anda.',
  ],
  whatYouCanDo: 'Yang bisa Anda lakukan untuk URL internal',
  internalActions: [
    'Record: tetap bisa — recorder jalan di browser PC Anda (client-direct) saat VPN aktif.',
    'Run opsi A: jalankan backend/app lokal di mesin yang sama jaringan dengan staging.',
    'Run opsi B: Queue local agent di PC VPN (Settings → API Tokens + scripts/local-agent).',
    'Atau ekspos staging lewat URL publik/tunnel jika ingin Run penuh di cloud.',
  ],
  resolvedIps: 'Resolved IP',
}
