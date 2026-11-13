import { useState } from 'react'
import { Globe, ShieldAlert, ChevronDown, ChevronUp, CheckCircle2, XCircle, Info } from 'lucide-react'

/**
 * Prominent public vs internal/VPN target explanation for scenario URLs.
 * Light-surface contrast: dark body text on soft tinted backgrounds.
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
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 flex items-center gap-2">
        <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-slate-500 border-t-transparent animate-spin" />
        {labels.probing || 'Mendeteksi jenis URL target…'}
      </div>
    )
  }

  if (!targetKind) return null

  const isInternal = targetKind === 'internal'
  const shell = isInternal
    ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50'
    : 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50'
  const badge = isInternal
    ? 'bg-amber-600 text-white'
    : 'bg-emerald-600 text-white'
  const Icon = isInternal ? ShieldAlert : Globe

  return (
    <div className={`rounded-xl border-2 ${shell} px-4 py-3.5 shadow-sm`}>
      <div className="flex flex-wrap items-start gap-3 justify-between">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
              isInternal ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                  <XCircle size={12} />
                  {labels.cloudRunBlocked || 'Cloud Run diblokir'}
                </span>
              )}
              {!isInternal && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 size={12} />
                  {labels.cloudRunOk || 'Cloud Run tersedia'}
                </span>
              )}
            </div>
            <p className={`text-sm font-semibold ${isInternal ? 'text-amber-950' : 'text-emerald-950'}`}>
              {isInternal
                ? labels.summaryInternal ||
                  'URL ini mengarah ke jaringan privat/VPN — berbeda dari situs publik di internet.'
                : labels.summaryPublic ||
                  'URL ini tampak publik (external) — bisa dijangkau dari server cloud production.'}
            </p>
            {(message || url) && (
              <p className="text-xs text-slate-700 mt-1 break-all">
                {url && <span className="font-mono font-medium text-slate-900">{url}</span>}
                {url && message ? ' — ' : ''}
                {message}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${
            isInternal
              ? 'border-amber-300 text-amber-900 bg-white/70 hover:bg-amber-100'
              : 'border-emerald-300 text-emerald-900 bg-white/70 hover:bg-emerald-100'
          }`}
        >
          <Info size={13} />
          {expanded ? labels.hideDetails || 'Sembunyikan' : labels.showDetails || 'Penjelasan lengkap'}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className={`mt-3 pt-3 border-t ${isInternal ? 'border-amber-200' : 'border-emerald-200'}`}>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-800 mb-2 flex items-center gap-1.5">
            <Info size={12} className="text-slate-600" />
            {labels.detailsTitle || 'Apa bedanya Publik vs Internal?'}
          </p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-white border border-emerald-200 p-3 shadow-sm">
              <p className="font-bold text-emerald-800 mb-1.5">
                {labels.publicTitle || 'Publik (external)'}
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4 leading-relaxed">
                {(labels.publicBullets || []).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg bg-white border border-amber-200 p-3 shadow-sm">
              <p className="font-bold text-amber-800 mb-1.5">
                {labels.internalTitle || 'Internal / VPN'}
              </p>
              <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-4 leading-relaxed">
                {(labels.internalBullets || []).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </div>

          {isInternal && (
            <div className="mt-3 rounded-lg bg-amber-100 border border-amber-300 p-3">
              <p className="text-xs font-bold text-amber-950 mb-1.5">
                {labels.whatYouCanDo || 'Yang bisa Anda lakukan untuk URL internal'}
              </p>
              <ul className="space-y-1.5 text-xs text-amber-950 list-disc pl-4 leading-relaxed">
                {(labels.internalActions || []).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {Array.isArray(addresses) && addresses.length > 0 && (
            <p className="text-[11px] text-slate-600 mt-2 font-mono">
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
    'Record & Run dari production (testsambilngopi.my.id) biasanya berhasil.',
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
