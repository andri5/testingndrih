import { Download } from 'lucide-react'

export const SOFT_VARIANT_STYLES = {
  json: 'bg-[#5E6AD2]/10 hover:bg-[#5E6AD2]/20 text-[#9BA3F0] html.theme-light:text-[#5E6AD2]',
  csv: 'bg-[#4EC9B0]/10 hover:bg-[#4EC9B0]/20 text-[#4EC9B0]',
  html: 'bg-[#FBBF24]/10 hover:bg-[#FBBF24]/20 text-[#FBBF24] html.theme-light:text-[#B45309]',
  pdf: 'bg-[#F87171]/10 hover:bg-[#F87171]/20 text-[#F87171] html.theme-light:text-[#DC2626]',
  primary: 'bg-[#5E6AD2]/10 hover:bg-[#5E6AD2]/20 text-[#9BA3F0] html.theme-light:text-[#5E6AD2]',
}

const BASE_CLASS =
  'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

export default function ExportFormatButton({
  format = 'csv',
  icon: Icon = Download,
  children,
  onClick,
  disabled = false,
  className = '',
  title,
  iconSize = 14,
  trailing,
  ...props
}) {
  const variant = format === 'primary' ? 'primary' : format

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${BASE_CLASS} ${SOFT_VARIANT_STYLES[variant] ?? SOFT_VARIANT_STYLES.csv} ${className}`}
      {...props}
    >
      {Icon ? <Icon size={iconSize} /> : null}
      {children}
      {trailing}
    </button>
  )
}

export function SoftIconBadge({ variant = 'json', icon: Icon, size = 14 }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${SOFT_VARIANT_STYLES[variant] ?? SOFT_VARIANT_STYLES.json}`}
    >
      {Icon && <Icon size={size} />}
    </span>
  )
}
