import { useLoadingStore } from '../store/loadingStore'

/**
 * Hook untuk wrap async operations dengan loading state
 * @param {string} key - Unique key untuk request
 * @param {string} message - Loading message (opsional)
 * @returns {object} { execute, isLoading, clear }
 */
export function useRequestLoading(key, message = '') {
  const { setRequestLoading, isRequestLoading, clearRequestLoading } = useLoadingStore()

  const execute = async (asyncFn) => {
    try {
      setRequestLoading(key, true, message)
      const result = await asyncFn()
      return result
    } catch (error) {
      throw error
    } finally {
      setRequestLoading(key, false)
    }
  }

  const isLoading = isRequestLoading(key)

  return { execute, isLoading, clear: () => clearRequestLoading(key) }
}

/**
 * Hook untuk wrap page-level loading
 * @param {string} pageKey - Page identifier
 * @param {string} message - Loading message (opsional)
 * @returns {object} { setLoading, isLoading, clear }
 */
export function usePageLoading(pageKey = 'default', message = '') {
  const { setPageLoading, isPageLoading, clearPageLoading } = useLoadingStore()

  return {
    setLoading: (loading, msg = message) => setPageLoading(pageKey, loading, msg),
    isLoading: isPageLoading(pageKey),
    clear: () => clearPageLoading(pageKey)
  }
}

/**
 * Helper untuk global loading
 */
export function useGlobalLoading() {
  const { setLoading, isLoading, clearAll } = useLoadingStore()

  return {
    show: (message = '') => setLoading(true, message),
    hide: () => setLoading(false),
    isLoading,
    clear: clearAll
  }
}

/**
 * Wrapper untuk API calls dengan automatic loading state
 * @param {Promise} promise - API call promise
 * @param {object} options - { key, pageKey, message, global }
 * @returns {Promise}
 */
export async function withLoading(promise, options = {}) {
  const { key, pageKey, message = '', global = false } = options
  const store = useLoadingStore.getState()

  try {
    if (global) {
      store.setLoading(true, message)
    } else if (pageKey) {
      store.setPageLoading(pageKey, true, message)
    } else if (key) {
      store.setRequestLoading(key, true, message)
    }

    const result = await promise
    return result
  } finally {
    if (global) {
      store.setLoading(false)
    } else if (pageKey) {
      store.setPageLoading(pageKey, false)
    } else if (key) {
      store.setRequestLoading(key, false)
    }
  }
}

/**
 * Async wrapper function untuk use dalam async functions
 * @param {string} key - Request key
 * @param {Function} fn - Async function
 * @returns {Promise}
 */
export async function withRequestLoading(key, fn) {
  const store = useLoadingStore.getState()
  try {
    store.setRequestLoading(key, true)
    return await fn()
  } finally {
    store.setRequestLoading(key, false)
  }
}
