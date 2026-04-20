import { Wrench, RefreshCw } from 'lucide-react'

export default function MaintenancePage() {
  return (
    <div className="auth-page-bg min-h-screen bg-[#0F0E11] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center animate-slide-up">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#161618] border border-[#2A2A2D] flex items-center justify-center">
            <Wrench size={32} className="text-[#5E6AD2]" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-[#E0E0E2] mb-2">Under Maintenance</h1>

        {/* Description */}
        <p className="text-sm text-[#8B8B8E] mb-8 leading-relaxed">
          We're currently performing scheduled maintenance.<br />
          Please check back soon.
        </p>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#161618] border border-[#2A2A2D] text-xs text-[#8B8B8E] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          Maintenance in progress
        </div>

        {/* Refresh */}
        <div>
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#5E6AD2] text-sm font-medium text-white hover:bg-[#4F5BBF] transition-colors"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>

      </div>
    </div>
  )
}
