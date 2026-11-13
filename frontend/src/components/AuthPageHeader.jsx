import BrandLogo from './BrandLogo'

export default function AuthPageHeader({ subtitle }) {
  return (
    <div className="flex flex-col items-center mb-8">
      <BrandLogo size="lg" className="mb-4 shadow-lg shadow-teal-900/20" title="Test Sambil Ngopi" />
      <h1 className="text-lg font-semibold text-ink tracking-wide uppercase">Test Sambil Ngopi</h1>
      {subtitle ? (
        <p className="text-sm text-ink-muted mt-0.5">{subtitle}</p>
      ) : null}
    </div>
  )
}
