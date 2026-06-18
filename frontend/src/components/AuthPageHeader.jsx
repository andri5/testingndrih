import BrandLogo from './BrandLogo'

export default function AuthPageHeader({ subtitle }) {
  return (
    <div className="flex flex-col items-center mb-8">
      <BrandLogo size="lg" className="mb-4 shadow-lg shadow-indigo-900/30" title="Test Sambil Ngopi" />
      <h1 className="text-lg font-semibold text-[#E0E0E2]">Test Sambil Ngopi</h1>
      {subtitle ? (
        <p className="text-sm text-[#8A8A8F] mt-0.5">{subtitle}</p>
      ) : null}
    </div>
  )
}
