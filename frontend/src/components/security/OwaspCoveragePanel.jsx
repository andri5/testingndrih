import { Shield } from 'lucide-react'
import { OWASP_TOP_10_2021, matchOwaspCategory } from '../../constants/owaspTop10'

/**
 * OWASP Top 10:2021 coverage matrix.
 * @param {'findings'|'catalog'} mode — findings maps scan results; catalog shows scanner coverage
 */
export default function OwaspCoveragePanel({
  findings = [],
  categoryCounts = null,
  mode = 'findings',
  title = 'OWASP Top 10:2021',
}) {
  const counts = Object.fromEntries(OWASP_TOP_10_2021.map((item) => [item.id, 0]))

  if (categoryCounts) {
    for (const item of OWASP_TOP_10_2021) {
      counts[item.id] = Number(categoryCounts[item.id] || 0)
    }
  } else {
    for (const finding of findings) {
      const match =
        matchOwaspCategory(finding.owasp10Category) ||
        OWASP_TOP_10_2021.find((item) =>
          (item.scanTypes || []).includes(String(finding.type || '').toUpperCase())
        )
      if (match) counts[match.id] += 1
    }
  }

  const covered = OWASP_TOP_10_2021.filter((item) => counts[item.id] > 0).length
  const isCatalog = mode === 'catalog'

  return (
    <div className="rounded-xl border border-[#2D2D2F] bg-[#1A1A1C] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-red-500 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-[#E0E0E2]">{title}</h3>
            <p className="text-xs text-[#8A8A8F] mt-0.5">
              {isCatalog
                ? 'Kategori yang dicakup scanner Security Test (A01–A10)'
                : findings.length || categoryCounts
                  ? `${covered}/10 kategori punya finding`
                  : 'Jalankan scan untuk melihat mapping finding → OWASP'}
            </p>
          </div>
        </div>
        <a
          href="https://owasp.org/Top10/"
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-medium text-[#0F766E] hover:underline"
        >
          Referensi OWASP ↗
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OWASP_TOP_10_2021.map((item) => {
          const n = counts[item.id]
          const hit = n > 0
          const scannable = (item.scanTypes || []).length > 0
          return (
            <div
              key={item.id}
              className={`rounded-lg border px-3 py-2.5 ${
                isCatalog
                  ? scannable
                    ? 'border-[#0F766E]/40 bg-[#0F766E]/10'
                    : 'border-[#2D2D2F] bg-[#0F0E11]'
                  : hit
                    ? 'border-red-500/40 bg-red-500/10'
                    : 'border-[#2D2D2F] bg-[#0F0E11]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-semibold text-[#A0A0A4]">
                  {item.code}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase ${
                    isCatalog
                      ? scannable
                        ? 'text-[#0F766E]'
                        : 'text-[#555]'
                      : hit
                        ? 'text-red-400'
                        : 'text-[#555]'
                  }`}
                >
                  {isCatalog
                    ? scannable
                      ? 'covered'
                      : 'manual'
                    : hit
                      ? `${n} finding`
                      : 'clear'}
                </span>
              </div>
              <p className="text-xs text-[#E0E0E2] mt-1 leading-snug">{item.title}</p>
              {isCatalog && scannable ? (
                <p className="text-[10px] text-[#666] mt-1 truncate">
                  {item.scanTypes.slice(0, 3).join(', ')}
                  {item.scanTypes.length > 3 ? '…' : ''}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
