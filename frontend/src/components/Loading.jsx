import { useLoadingStore } from '../store/loadingStore'

export function GlobalLoading() {
  const { isLoading, message } = useLoadingStore()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white dark:bg-[#1A1A1C] rounded-lg shadow-2xl p-8 text-center max-w-sm mx-4">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full border-4 border-[#E0E0E2] border-t-[#5E6AD2] dark:border-[#2D2D2F] dark:border-t-[#5E6AD2] animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-[#1A1A1C] dark:text-[#E0E0E2] mb-2">
          Loading...
        </h3>
        {message && (
          <p className="text-sm text-[#666] dark:text-[#8A8A8F]">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

export function Spinner({ size = 'md', variant = 'primary' }) {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  }[size]

  const variantClass = {
    primary: 'border-[#E0E0E2] border-t-[#5E6AD2]',
    secondary: 'border-[#2D2D2F] border-t-[#8A8A8F]',
    success: 'border-[#E0E0E2] border-t-[#10B981]',
    danger: 'border-[#E0E0E2] border-t-[#F87171]'
  }[variant]

  return (
    <div className={`${sizeClass} rounded-full animate-spin ${variantClass}`} />
  )
}

export function PageLoading({ pageKey = 'default' }) {
  const loading = useLoadingStore((state) => state.isPageLoading(pageKey))
  const message = useLoadingStore((state) => state.getPageMessage(pageKey))

  if (!loading) return null

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Spinner size="lg" variant="primary" />
      {message && (
        <p className="text-sm text-[#666] dark:text-[#8A8A8F]">
          {message}
        </p>
      )}
    </div>
  )
}

export function RequestLoading({ requestKey, fallback = null }) {
  const loading = useLoadingStore((state) => state.isRequestLoading(requestKey))
  const message = useLoadingStore((state) => state.getRequestMessage(requestKey))

  if (!loading) return fallback

  return (
    <div className="flex items-center gap-2">
      <Spinner size="sm" variant="primary" />
      {message && (
        <span className="text-sm text-[#666] dark:text-[#8A8A8F]">
          {message}
        </span>
      )}
    </div>
  )
}

export function LoadingOverlay({ show, message = '', onDismiss = null }) {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white dark:bg-[#1A1A1C] rounded-lg shadow-xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <Spinner size="lg" variant="primary" />
        </div>
        {message && (
          <p className="text-[#1A1A1C] dark:text-[#E0E0E2] mb-4">
            {message}
          </p>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="mt-4 px-4 py-2 text-sm font-medium text-[#5E6AD2] hover:bg-[#5E6AD2]/10 rounded-lg transition"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}

export function SkeletonLoader({ count = 3, height = 100 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[#E0E0E2] dark:bg-[#2D2D2F] rounded-lg animate-pulse"
          style={{ height: `${height}px` }}
        />
      ))}
    </div>
  )
}
