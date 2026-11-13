import { create } from 'zustand'
import { scenarioFolderAPI } from '../services/api'

export const useFolderStore = create((set, get) => ({
  tree: [],
  counts: { all: 0, unfiled: 0, byFolder: {}, byFolderRecursive: {} },
  selectedKey: 'all', // 'all' | 'unfiled' | folderId
  expandedIds: new Set(),
  isLoading: false,
  error: null,
  filterQuery: '',

  setSelectedKey: (selectedKey) => set({ selectedKey }),
  setFilterQuery: (filterQuery) => set({ filterQuery }),

  toggleExpanded: (id) => {
    const next = new Set(get().expandedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    set({ expandedIds: next })
  },

  expandMany: (ids) => {
    const next = new Set(get().expandedIds)
    ids.forEach((id) => next.add(id))
    set({ expandedIds: next })
  },

  fetchFolders: async () => {
    set({ isLoading: true, error: null })
    try {
      const res = await scenarioFolderAPI.list()
      set({
        tree: res.data.tree || [],
        counts: res.data.counts || { all: 0, unfiled: 0, byFolder: {}, byFolderRecursive: {} },
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error.response?.data?.message || 'Failed to load folders',
        isLoading: false,
      })
    }
  },

  createFolder: async (name, parentId = null) => {
    const res = await scenarioFolderAPI.create(name, parentId)
    await get().fetchFolders()
    if (parentId) get().expandMany([parentId])
    return res.data.folder
  },

  renameFolder: async (id, name) => {
    await scenarioFolderAPI.update(id, { name })
    await get().fetchFolders()
  },

  moveFolder: async (id, parentId) => {
    await scenarioFolderAPI.update(id, { parentId })
    await get().fetchFolders()
  },

  deleteFolder: async (id) => {
    await scenarioFolderAPI.delete(id)
    if (get().selectedKey === id) set({ selectedKey: 'all' })
    await get().fetchFolders()
  },

  activeFolderIdForCreate: () => {
    const key = get().selectedKey
    if (key === 'all' || key === 'unfiled') return null
    return key
  },

  listParams: () => {
    const key = get().selectedKey
    if (key === 'unfiled') return { unfiled: 'true' }
    if (key === 'all') return {}
    return { folderId: key, includeDescendants: 'true' }
  },
}))
