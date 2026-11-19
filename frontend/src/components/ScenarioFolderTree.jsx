import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Inbox,
  Layers,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useFolderStore } from '../store/folderStore'
import toast from 'react-hot-toast'

function readScenarioDragId(dt) {
  const custom = (dt.getData('application/x-scenario-id') || '').trim()
  if (custom) return custom
  const plain = (dt.getData('text/plain') || '').trim()
  if (plain.startsWith('folder:')) return ''
  return plain
}

function readFolderDragId(dt) {
  const custom = (dt.getData('application/x-folder-id') || '').trim()
  if (custom) return custom
  const plain = (dt.getData('text/plain') || '').trim()
  return plain.startsWith('folder:') ? plain.slice('folder:'.length) : ''
}

function FolderNode({ node, depth, selectedKey, expandedIds, onSelect, onToggle, onDropScenario, onRename, onDelete, onCreateChild }) {
  const isExpanded = expandedIds.has(node.id)
  const isActive = selectedKey === node.id
  const [menuOpen, setMenuOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div>
      <div
        className={`group flex items-center gap-1 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${
          isActive ? 'bg-brand-soft text-brand-ink' : 'text-ink-muted hover:bg-white hover:text-ink'
        } ${dragOver ? 'ring-2 ring-brand bg-brand-soft/50' : ''}`}
        style={{ paddingLeft: 8 + depth * 12 }}
        onClick={() => onSelect(node.id)}
        onDragOver={(e) => {
          e.preventDefault()
          e.stopPropagation()
          e.dataTransfer.dropEffect = 'move'
          setDragOver(true)
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDragOver(false)
          const scenarioId = readScenarioDragId(e.dataTransfer)
          const folderId = readFolderDragId(e.dataTransfer)
          // Prefer scenario move when both present (shouldn't happen)
          onDropScenario?.({
            scenarioId: scenarioId || undefined,
            folderId: scenarioId ? undefined : folderId || undefined,
            targetFolderId: node.id,
          })
        }}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/x-folder-id', node.id)
          e.dataTransfer.setData('text/plain', `folder:${node.id}`)
          e.dataTransfer.effectAllowed = 'move'
        }}
      >
        <button
          type="button"
          className="w-4 h-4 flex items-center justify-center text-ink-subtle shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onToggle(node.id)
          }}
        >
          {node.children?.length ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="w-3" />
          )}
        </button>
        {isExpanded ? <FolderOpen size={15} className="shrink-0 text-brand" /> : <Folder size={15} className="shrink-0 text-brand" />}
        <span className="flex-1 truncate font-medium">{node.name}</span>
        <span className="text-[10px] text-ink-subtle tabular-nums">{node.countRecursive ?? node.count ?? 0}</span>
        <div className="relative">
          <button
            type="button"
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-surface-muted"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 z-20 w-36 rounded-md border border-surface-border bg-white shadow-lg py-1 text-xs">
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left hover:bg-surface-muted flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onCreateChild(node.id)
                }}
              >
                <FolderPlus size={12} /> New subfolder
              </button>
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left hover:bg-surface-muted flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onRename(node)
                }}
              >
                <Pencil size={12} /> Rename
              </button>
              <button
                type="button"
                className="w-full px-3 py-1.5 text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onDelete(node)
                }}
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
      {isExpanded &&
        (node.children || []).map((child) => (
          <FolderNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedKey={selectedKey}
            expandedIds={expandedIds}
            onSelect={onSelect}
            onToggle={onToggle}
            onDropScenario={onDropScenario}
            onRename={onRename}
            onDelete={onDelete}
            onCreateChild={onCreateChild}
          />
        ))}
    </div>
  )
}

export default function ScenarioFolderTree({ onSelectionChange, onDropScenario }) {
  const {
    tree,
    counts,
    selectedKey,
    expandedIds,
    filterQuery,
    isLoading,
    fetchFolders,
    setSelectedKey,
    setFilterQuery,
    toggleExpanded,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFolder,
  } = useFolderStore()

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  const filteredTree = useMemo(() => {
    const q = filterQuery.trim().toLowerCase()
    if (!q) return tree
    const filterNodes = (nodes) =>
      nodes
        .map((n) => {
          const children = filterNodes(n.children || [])
          if (n.name.toLowerCase().includes(q) || children.length) {
            return { ...n, children }
          }
          return null
        })
        .filter(Boolean)
    return filterNodes(tree)
  }, [tree, filterQuery])

  const select = (key) => {
    setSelectedKey(key)
    onSelectionChange?.(key)
  }

  const handleDrop = async (payload) => {
    const { scenarioId, folderId, targetFolderId } = payload || {}
    if (scenarioId) {
      onDropScenario?.({ scenarioId, targetFolderId: targetFolderId ?? null })
      return
    }
    if (folderId) {
      if (folderId === targetFolderId) return
      try {
        await moveFolder(folderId, targetFolderId ?? null)
        toast.success('Folder dipindahkan')
      } catch (e) {
        toast.error(e.response?.data?.message || e.message || 'Gagal memindahkan folder')
      }
    }
  }

  const handleCreate = async (parentId = null) => {
    const name = window.prompt(
      parentId
        ? 'Subfolder name (e.g. Login / Forgot password)'
        : 'Feature / folder name (e.g. Login)'
    )
    if (!name?.trim()) return
    try {
      await createFolder(name.trim(), parentId)
      toast.success('Folder berhasil dibuat')
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Gagal membuat folder')
    }
  }

  const handleRename = async (node) => {
    const name = window.prompt('Rename folder', node.name)
    if (!name?.trim() || name.trim() === node.name) return
    try {
      await renameFolder(node.id, name.trim())
      toast.success('Folder berhasil diubah')
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Gagal rename folder')
    }
  }

  const handleDelete = async (node) => {
    if (!window.confirm(`Delete folder "${node.name}"? Scenarios will move to No folder.`)) return
    try {
      await deleteFolder(node.id)
      onSelectionChange?.(useFolderStore.getState().selectedKey)
      toast.success('Folder berhasil dihapus')
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Gagal menghapus folder')
    }
  }

  const virtualItem = (key, label, icon, count, { droppable = false } = {}) => (
    <div
      role="button"
      tabIndex={0}
      onClick={() => select(key)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          select(key)
        }
      }}
      onDragOver={(e) => {
        if (!droppable) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        e.currentTarget.classList.add('ring-2', 'ring-brand', 'bg-brand-soft/40')
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove('ring-2', 'ring-brand', 'bg-brand-soft/40')
      }}
      onDrop={(e) => {
        if (!droppable) return
        e.preventDefault()
        e.currentTarget.classList.remove('ring-2', 'ring-brand', 'bg-brand-soft/40')
        const scenarioId = readScenarioDragId(e.dataTransfer)
        const draggedFolderId = readFolderDragId(e.dataTransfer)
        handleDrop({
          scenarioId: scenarioId || undefined,
          folderId: scenarioId ? undefined : draggedFolderId || undefined,
          targetFolderId: null,
        })
      }}
      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
        selectedKey === key ? 'bg-brand-soft text-brand-ink' : 'text-ink-muted hover:bg-white hover:text-ink'
      }`}
    >
      {icon}
      <span className="flex-1 text-left font-medium truncate">{label}</span>
      <span className="text-[10px] text-ink-subtle tabular-nums">{count}</span>
    </div>
  )

  return (
    <div className="h-full flex flex-col bg-surface-sidebar border-r border-surface-border">
      <div className="px-3 py-3 border-b border-surface-border flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-ink uppercase tracking-wide">Feature folders</p>
          <p className="text-[10px] text-ink-subtle">1 folder = 1 fitur</p>
        </div>
        <button
          type="button"
          onClick={() => handleCreate(null)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-brand text-white hover:bg-brand-hover"
          title="New feature folder"
        >
          <FolderPlus size={13} /> New
        </button>
      </div>

      <div className="px-3 py-2">
        <input
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter features..."
          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-surface-border bg-white text-ink placeholder-ink-subtle focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {virtualItem('all', 'All scenarios', <Layers size={15} className="text-brand" />, counts.all || 0)}
        {virtualItem(
          'unfiled',
          'No folder',
          <Inbox size={15} className="text-ink-subtle" />,
          counts.unfiled || 0,
          { droppable: true }
        )}

        <div className="pt-2 pb-1 px-2.5 text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">
          Features
        </div>
        <p className="px-2.5 pb-1.5 text-[10px] text-ink-subtle leading-snug">
          Drag ⋮⋮ pada case → drop ke fitur di sini
        </p>

        {isLoading && <p className="px-2.5 text-xs text-ink-subtle">Loading...</p>}
        {!isLoading && filteredTree.length === 0 && (
          <div className="mx-1 mt-1 rounded-lg border border-dashed border-surface-border bg-white/60 px-2.5 py-3">
            <p className="text-xs font-medium text-ink">Belum ada feature folder</p>
            <p className="text-[11px] text-ink-subtle mt-1 leading-snug">
              Buat folder fitur dulu (mis. Login). Lalu drag case dari tabel (ikon ⋮⋮) ke folder ini.
            </p>
            <button
              type="button"
              onClick={() => handleCreate(null)}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand-hover"
            >
              <FolderPlus size={12} /> New feature folder
            </button>
          </div>
        )}
        {filteredTree.map((node) => (
          <FolderNode
            key={node.id}
            node={node}
            depth={0}
            selectedKey={selectedKey}
            expandedIds={expandedIds}
            onSelect={select}
            onToggle={toggleExpanded}
            onDropScenario={handleDrop}
            onRename={handleRename}
            onDelete={handleDelete}
            onCreateChild={handleCreate}
          />
        ))}
      </div>
    </div>
  )
}
