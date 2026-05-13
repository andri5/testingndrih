import { create } from 'zustand'

export const useLoadingStore = create((set) => ({
  // Global loading state
  isLoading: false,
  message: '',
  
  // Page-level loading states (by page key)
  pageLoading: {},
  
  // Request-level loading states (by request key)
  requestLoading: {},

  // Actions
  setLoading: (loading, message = '') => {
    set({ isLoading: loading, message })
  },

  setPageLoading: (pageKey, loading, message = '') => {
    set((state) => ({
      pageLoading: {
        ...state.pageLoading,
        [pageKey]: { loading, message }
      }
    }))
  },

  setRequestLoading: (requestKey, loading, message = '') => {
    set((state) => ({
      requestLoading: {
        ...state.requestLoading,
        [requestKey]: { loading, message }
      }
    }))
  },

  isPageLoading: (pageKey) => {
    const state = useLoadingStore.getState()
    return state.pageLoading[pageKey]?.loading || false
  },

  isRequestLoading: (requestKey) => {
    const state = useLoadingStore.getState()
    return state.requestLoading[requestKey]?.loading || false
  },

  getPageMessage: (pageKey) => {
    const state = useLoadingStore.getState()
    return state.pageLoading[pageKey]?.message || ''
  },

  getRequestMessage: (requestKey) => {
    const state = useLoadingStore.getState()
    return state.requestLoading[requestKey]?.message || ''
  },

  clearPageLoading: (pageKey) => {
    set((state) => {
      const newPageLoading = { ...state.pageLoading }
      delete newPageLoading[pageKey]
      return { pageLoading: newPageLoading }
    })
  },

  clearRequestLoading: (requestKey) => {
    set((state) => {
      const newRequestLoading = { ...state.requestLoading }
      delete newRequestLoading[requestKey]
      return { requestLoading: newRequestLoading }
    })
  },

  clearAll: () => {
    set({
      isLoading: false,
      message: '',
      pageLoading: {},
      requestLoading: {}
    })
  }
}))
