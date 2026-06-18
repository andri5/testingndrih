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
