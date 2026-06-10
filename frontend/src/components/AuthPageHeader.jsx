import { ShieldCheck } from 'lucide-react'

export default function AuthPageHeader({ subtitle }) {
  return (
    <div className="flex flex-col items-center mb-8">
      <div className="w-9 h-9 rounded-lg bg-[#5E6AD2] flex items-center justify-center mb-4">
        <ShieldCheck size={20} className="text-white" />
      </div>
      <h1 className="text-lg font-semibold text-[#E0E0E2]">Test Sambil Ngopi</h1>
      {subtitle ? (
        <p className="text-sm text-[#8A8A8F] mt-0.5">{subtitle}</p>
      ) : null}
    </div>
  )
}
