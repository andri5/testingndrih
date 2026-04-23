// ─── Button Component ───────────────────────────────────────────────────────
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  ...props
}) {
  const base = 'font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#0F0E11] inline-flex items-center justify-center gap-2 cursor-pointer'

  const variants = {
    primary:   'bg-[#5E6AD2] hover:bg-[#6B7AE8] text-white focus:ring-[#5E6AD2]',
    secondary: 'bg-[#1A1A1C] hover:bg-[#252528] text-[#E0E0E2] border border-[rgba(255,255,255,0.1)] focus:ring-[#5E6AD2]',
    danger:    'bg-[#C24B4B] hover:bg-[#D45555] text-white focus:ring-[#C24B4B]',
    ghost:     'bg-transparent hover:bg-[rgba(255,255,255,0.05)] text-[#8A8A8F] hover:text-[#E0E0E2] focus:ring-[#5E6AD2]',
    success:   'bg-[#3DAF7A] hover:bg-[#44C287] text-white focus:ring-[#3DAF7A]',
    cyan:      'bg-[#3A9E9E] hover:bg-[#44B2B2] text-white focus:ring-[#3A9E9E]',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  }

  return (
    <button
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

// ─── Input Component ─────────────────────────────────────────────────────────
export function Input({
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  disabled = false,
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-[#8A8A8F] mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-[#161618] border rounded-md focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] outline-none transition-all text-[#E0E0E2] placeholder-[#4A4A52] text-sm ${
          error ? 'border-[#C24B4B]' : 'border-[rgba(255,255,255,0.1)]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        {...props}
      />
      {error && <p className="text-[#F87171] text-xs mt-1">{error}</p>}
    </div>
  )
}

// ─── Card Component ───────────────────────────────────────────────────────────
export function Card({ children, className = '' }) {
  return (
    <div className={`linear-card p-5 ${className}`}>
      {children}
    </div>
  )
}

// ─── Alert Component ──────────────────────────────────────────────────────────
export function Alert({ type = 'info', message, onClose }) {
  const styles = {
    info:    'bg-[#1A1A2E] border-[#5E6AD2]/40 text-[#9BA3F0]',
    success: 'bg-[#0F1F17] border-[#34D399]/40 text-[#34D399]',
    warning: 'bg-[#1F1A0F] border-[#FBBF24]/40 text-[#FBBF24]',
    error:   'bg-[#1F0F0F] border-[#F87171]/40 text-[#F87171]',
  }

  return (
    <div className={`p-3.5 border rounded-md ${styles[type] ?? styles.info}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 opacity-50 hover:opacity-100 transition-opacity text-base leading-none"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Badge Component ──────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default' }) {
  const colors = {
    default: { dot: 'bg-[#8A8A8F]', text: 'text-[#8A8A8F]' },
    primary: { dot: 'bg-[#5E6AD2]', text: 'text-[#9BA3F0]' },
    success: { dot: 'bg-[#34D399]', text: 'text-[#34D399]' },
    warning: { dot: 'bg-[#FBBF24]', text: 'text-[#FBBF24]' },
    danger:  { dot: 'bg-[#F87171]', text: 'text-[#F87171]' },
  }

  const c = colors[variant] ?? colors.default

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      {children}
    </span>
  )
}

// ─── Spinner Component ────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`${sizes[size]} rounded-full border-2 border-[rgba(255,255,255,0.08)] border-t-[#5E6AD2] animate-spin`} />
  )
}

// ─── CardHeader Component ─────────────────────────────────────────────────────
export function CardHeader({ children, className = '' }) {
  return (
    <div className={`pb-3 border-b border-[rgba(255,255,255,0.1)] ${className}`}>
      {children}
    </div>
  )
}

// ─── CardTitle Component ──────────────────────────────────────────────────────
export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-[#E0E0E2] ${className}`}>
      {children}
    </h3>
  )
}

// ─── CardDescription Component ────────────────────────────────────────────────
export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-[#8A8A8F] mt-1 ${className}`}>
      {children}
    </p>
  )
}

// ─── CardContent Component ────────────────────────────────────────────────────
export function CardContent({ children, className = '' }) {
  return (
    <div className={`pt-4 ${className}`}>
      {children}
    </div>
  )
}

