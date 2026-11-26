import {
  normalizeSeverity,
  severityBadgeClass,
  severityDotClass,
} from '../constants/severity'

/**
 * Compact severity / priority chip — Lab QA cool.
 */
export default function SeverityBadge({
  priority,
  severity,
  className = '',
  showDot = true,
}) {
  const level = normalizeSeverity(priority ?? severity)
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border ${severityBadgeClass(level)} ${className}`}
      title={`Severity: ${level}`}
    >
      {showDot ? (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${severityDotClass(level)}`} aria-hidden />
      ) : null}
      {level}
    </span>
  )
}
