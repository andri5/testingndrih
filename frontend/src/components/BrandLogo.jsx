/** Coffee cup brand mark — matches public/favicon.svg */

function CoffeeCup({ stroke = 'currentColor' }) {
  return (
    <g
      transform="translate(6, 7)"
      stroke={stroke}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <path d="M3 6h12v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V6z" />
      <path d="M15 8h2a3 3 0 0 1 0 6h-2" />
      <path d="M5 2.5c.8-1 1.8-1.5 3-1.5s2.2.5 3 1.5" />
      <path d="M8.5 2c.5-.8 1.2-1.2 2-1.2s1.5.4 2 1.2" />
    </g>
  )
}

/**
 * @param {'app'|'mark'} variant — app: indigo tile + white cup; mark: cup only (inherits color)
 * @param {number|'xs'|'sm'|'md'|'lg'|'xl'} size — px or preset
 */
export default function BrandLogo({ variant = 'app', size = 'md', className = '', title }) {
  const px =
    typeof size === 'number'
      ? size
      : { xs: 24, sm: 28, md: 32, lg: 36, xl: 48 }[size] ?? 32

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden={!title}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {variant === 'app' ? <rect width="32" height="32" rx="7" fill="#5E6AD2" /> : null}
      <CoffeeCup stroke={variant === 'app' ? '#fff' : 'currentColor'} />
    </svg>
  )
}
