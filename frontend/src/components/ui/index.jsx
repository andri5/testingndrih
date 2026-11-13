import { useState, useRef } from 'react'

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
  const base = 'font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-white inline-flex items-center justify-center gap-2 cursor-pointer'

  const variants = {
    primary:   'bg-brand hover:bg-brand-hover text-white focus:ring-brand shadow-sm shadow-brand/20',
    secondary: 'bg-white hover:bg-surface-muted text-ink border border-surface-border focus:ring-brand',
    danger:    'bg-[#C24B4B] hover:bg-[#D45555] text-white focus:ring-[#C24B4B]',
    ghost:     'bg-transparent hover:bg-surface-muted text-ink-muted hover:text-ink focus:ring-brand',
    success:   'bg-[#3DAF7A] hover:bg-[#44C287] text-white focus:ring-[#3DAF7A]',
    cyan:      'bg-brand-hover hover:bg-brand text-white focus:ring-brand',
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
        <label className="block text-xs font-medium text-ink-muted mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 bg-white border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all text-ink placeholder-ink-subtle text-sm ${
          error ? 'border-[#C24B4B]' : 'border-surface-border'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        {...props}
      />
      {error && <p className="text-[#DC2626] text-xs mt-1">{error}</p>}
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
    info:    'bg-brand-soft border-brand/30 text-brand-ink',
    success: 'bg-[#ECFDF5] border-[#34D399]/40 text-[#047857]',
    warning: 'bg-[#FFFBEB] border-[#FBBF24]/40 text-[#B45309]',
    error:   'bg-[#FEF2F2] border-[#F87171]/40 text-[#B91C1C]',
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
    default: { dot: 'bg-ink-subtle', text: 'text-ink-muted' },
    primary: { dot: 'bg-brand', text: 'text-brand' },
    success: { dot: 'bg-[#34D399]', text: 'text-[#059669]' },
    warning: { dot: 'bg-[#FBBF24]', text: 'text-[#D97706]' },
    danger:  { dot: 'bg-[#F87171]', text: 'text-[#DC2626]' },
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
    <div className={`${sizes[size]} rounded-full border-2 border-surface-border border-t-brand animate-spin`} />
  )
}

// ─── CardHeader Component ─────────────────────────────────────────────────────
export function CardHeader({ children, className = '' }) {
  return (
    <div className={`pb-3 border-b border-surface-border ${className}`}>
      {children}
    </div>
  )
}

// ─── CardTitle Component ──────────────────────────────────────────────────────
export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-ink ${className}`}>
      {children}
    </h3>
  )
}

// ─── CardDescription Component ────────────────────────────────────────────────
export function CardDescription({ children, className = '' }) {
  return (
    <p className={`text-sm text-ink-muted mt-1 ${className}`}>
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

// ─── Tooltip Component ────────────────────────────────────────────────────────
export function Tooltip({ children, text, position = 'top', delay = 300, multiline = false }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  if (!text) return <>{children}</>

  const show = () => {
    timerRef.current = setTimeout(() => setVisible(true), delay)
  }
  const hide = () => {
    clearTimeout(timerRef.current)
    setVisible(false)
  }

  const posClasses = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top:    'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-[#1A2A2C]',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-[#1A2A2C]',
    left:   'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-[#1A2A2C]',
    right:  'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-[#1A2A2C]',
  }

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={`tooltip-popup absolute z-50 px-2.5 py-1.5 rounded-md text-xs font-medium bg-[#1A2A2C] text-white border border-white/10 shadow-lg pointer-events-none animate-fade-in ${multiline ? 'max-w-[260px] whitespace-pre-line text-left leading-relaxed' : 'whitespace-nowrap'} ${posClasses[position] ?? posClasses.top}`}
        >
          {text}
          <span className={`absolute w-0 h-0 border-4 ${arrowClasses[position] ?? arrowClasses.top}`} />
        </span>
      )}
    </span>
  )
}
