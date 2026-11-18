import { useState } from 'react'
import { Globe, ShieldAlert, ChevronDown, ChevronUp, CheckCircle2, XCircle, Info } from 'lucide-react'

/**
 * Prominent public vs internal/VPN target explanation for scenario URLs.
 * Block layout (not nested flex min-w-0) so long URLs never collapse to 1-char width.
 */
export default function TargetKindBanner({
  targetKind,
  executionBlocked = false,
  isProbing = false,
  message = '',
  addresses = [],
  url = '',
  labels = {},
  variant = 'full', // 'full' | 'compact'
}) {
  const [expanded, setExpanded] = useState(false)

  if (isProbing) {
    return (
      <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 flex items-center gap-2">
        <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-slate-500 border-t-transparent animate-spin shrink-0" />
        <span>{labels.probing || 'Mendeteksi jenis URL target…'}</span>
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
  const oneLiner = isInternal
    ? (labels.compactInternal ||
      'Target internal — rekam di browser PC Anda; jalankan lewat PC di jaringan yang sama.')
    : (labels.compactPublic ||
      'Target publik — rekam & jalankan langsung dari cloud.')

  if (variant === 'compact' && !expanded) {
    return (
      <div className={`w-full max-w-full rounded-lg border px-3 py-2.5 flex flex-wrap items-center gap-2 justify-between ${shell}`}>
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide ${badge}`}>
            <Icon size={12} />
            {isInternal ? labels.badgeInternal || 'Internal' : labels.badgePublic || 'Publik'}
          </span>
          <p className={`text-xs font-medium leading-snug ${isInternal ? 'text-amber-950' : 'text-emerald-950'}`}>
            {oneLiner}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md border whitespace-nowrap ${
            isInternal
              ? 'border-amber-300 text-amber-900 bg-white/80 hover:bg-amber-100'
              : 'border-emerald-300 text-emerald-900 bg-white/80 hover:bg-emerald-100'
          }`}
        >
          <Info size={12} />
          {labels.showDetails || 'Pelajari lebih lanjut'}
        </button>
      </div>
    )
  }

  return (
    <div className={`w-full max-w-full box-border rounded-xl border-2 ${shell} px-4 py-3.5 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
              isInternal ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            <Icon size={20} />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide ${badge}`}>
                {isInternal ? labels.badgeInternal || 'Internal' : labels.badgePublic || 'Publik'}
              </span>
              {isInternal && executionBlocked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                  <XCircle size={12} />
                  {labels.cloudRunBlocked || 'Cloud Run tidak tersedia'}
                </span>
              )}
              {!isInternal && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 size={12} />
                  {labels.cloudRunOk || 'Cloud Run tersedia'}
                </span>
              )}
            </div>
            <p
              className={`text-sm font-semibold leading-relaxed ${
                isInternal ? 'text-amber-950' : 'text-emerald-950'
              }`}
            >
              {isInternal
                ? labels.summaryInternal ||
                  'URL ini mengarah ke jaringan privat/VPN — berbeda dari situs publik di internet.'
                : labels.summaryPublic ||
                  'URL ini tampak publik (external) — bisa dijangkau dari server cloud production.'}
            </p>
            {message && (
              <p className={`text-xs mt-1.5 leading-relaxed font-medium ${
                isInternal ? 'text-amber-950' : 'text-slate-800'
              }`}>
                {message}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={`shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border whitespace-nowrap ${
            isInternal
              ? 'border-amber-300 text-amber-900 bg-white/70 hover:bg-amber-100'
              : 'border-emerald-300 text-emerald-900 bg-white/70 hover:bg-emerald-100'
          }`}
        >
          <Info size={13} />
          <span className="hidden sm:inline">
            {expanded ? labels.hideDetails || 'Sembunyikan' : labels.showDetails || 'Pelajari lebih lanjut'}
          </span>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {url && (
        <div className="mt-3 rounded-lg bg-white/80 border border-slate-200 px-3 py-2 overflow-x-auto">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">URL</p>
          <p className="text-xs font-mono text-slate-900 whitespace-nowrap">{url}</p>
        </div>
      )}

      {expanded && (
        <div className={`mt-3 pt-3 border-t ${isInternal ? 'border-amber-200' : 'border-emerald-200'}`}>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-800 mb-2 flex items-center gap-1.5">
            <Info size={12} className="text-slate-600 shrink-0" />
            {labels.detailsTitle || 'Apa bedanya Publik vs Internal?'}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
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
            <p className="text-[11px] text-slate-600 mt-2 font-mono overflow-x-auto whitespace-nowrap">
              {labels.resolvedIps || 'Resolved IP'}: {addresses.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export const defaultTargetKindLabels = {
  probing: 'Mendeteksi jenis URL target…',
  badgePublic: 'Publik',
  badgeInternal: 'Internal',
  cloudRunOk: 'Cloud Run tersedia',
  cloudRunBlocked: 'Cloud Run tidak tersedia',
  compactPublic: 'Target publik — rekam & jalankan langsung dari cloud.',
  compactInternal:
    'Target internal — rekam di browser PC Anda; jalankan lewat PC di jaringan yang sama.',
  summaryPublic:
    'URL eksternal yang bisa dijangkau dari internet — server cloud Test Sambil Ngopi bisa Record & Run ke sini.',
  summaryInternal:
    'URL berada di LAN/VPN (mis. 10.x, 192.168.x, 172.16–31.x, localhost). Server cloud TIDAK bisa membuka halaman ini dari VPS publik.',
  showDetails: 'Pelajari lebih lanjut',
  hideDetails: 'Sembunyikan',
  detailsTitle: 'Apa bedanya Publik vs Internal?',
  publicTitle: 'Publik',
  internalTitle: 'Internal',
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
    'Run opsi B: Manual Run (checklist Pass/Fail) atau Jalankan di PC ini (shared VPN runner).',
    'Atau ekspos staging lewat URL publik/tunnel jika ingin Run penuh di cloud.',
  ],
  resolvedIps: 'Resolved IP',
}
