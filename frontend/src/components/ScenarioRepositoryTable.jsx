import { useEffect, useRef, useState } from 'react'
import {
  Star,
  Eye,
  Pencil,
  Copy,
  Trash2,
  GripVertical,
  CheckCircle2,
  XCircle,
  Circle,
  Folder,
  MoreHorizontal,
} from 'lucide-react'

function RowActions({ s, folderOptions, onOpen, onEdit, onDuplicate, onDelete, onMoveRequest }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const moveSelect = (
    <select
      className="text-[11px] border border-surface-border rounded-md px-1.5 py-1 bg-white text-ink-muted max-w-[110px] w-full"
      defaultValue=""
      onChange={(e) => {
        const val = e.target.value
        e.target.value = ''
        if (!val) return
        onMoveRequest?.(s.id, val === '__unfiled__' ? null : val)
        setOpen(false)
      }}
      title="Move to folder"
    >
      <option value="" disabled>
        Move…
      </option>
      <option value="__unfiled__">No folder</option>
      {folderOptions.map((f) => (
        <option key={f.id} value={f.id}>
          {f.label}
        </option>
      ))}
    </select>
  )

  return (
    <>
      {/* Desktop / tablet actions */}
      <div className="hidden md:flex items-center justify-end gap-1">
        <button
          type="button"
          title="Open"
          onClick={() => onOpen(s)}
          className="p-1.5 rounded-md bg-brand-soft text-brand hover:bg-teal-200"
        >
          <Eye size={14} />
        </button>
        <button
          type="button"
          title="Edit name, description, URL"
          onClick={() => onEdit?.(s)}
          className="p-1.5 rounded-md hover:bg-surface-muted text-ink-muted hover:text-brand"
        >
          <Pencil size={14} />
        </button>
        <button
          type="button"
          title="Duplicate"
          onClick={() => onDuplicate(s)}
          className="p-1.5 rounded-md hover:bg-surface-muted text-ink-muted"
        >
          <Copy size={14} />
        </button>
        {moveSelect}
        <button
          type="button"
          title="Delete"
          onClick={() => onDelete(s)}
          className="p-1.5 rounded-md hover:bg-red-50 text-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Mobile compact menu */}
      <div className="relative md:hidden flex justify-end" ref={ref}>
        <button
          type="button"
          title="Actions"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-md hover:bg-surface-muted text-ink-muted"
        >
          <MoreHorizontal size={16} />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 z-30 w-44 rounded-lg border border-surface-border bg-white shadow-lg py-1">
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted flex items-center gap-2"
              onClick={() => {
                setOpen(false)
                onOpen(s)
              }}
            >
              <Eye size={14} /> Open
            </button>
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted flex items-center gap-2"
              onClick={() => {
                setOpen(false)
                onEdit?.(s)
              }}
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted flex items-center gap-2"
              onClick={() => {
                setOpen(false)
                onDuplicate(s)
              }}
            >
              <Copy size={14} /> Duplicate
            </button>
            <div className="px-3 py-2 border-t border-surface-border">{moveSelect}</div>
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              onClick={() => {
                setOpen(false)
                onDelete(s)
              }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function LastResultBadge({ result }) {
  if (!result) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-ink-subtle">
        <Circle size={12} /> Not Run
      </span>
    )
  }
  if (result.status === 'PASSED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
        <CheckCircle2 size={13} /> Passed
      </span>
    )
  }
  if (result.status === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
        <XCircle size={13} /> Failed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
      <Circle size={12} /> {result.status}
    </span>
  )
}

export default function ScenarioRepositoryTable({
  scenarios = [],
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpen,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onMoveRequest,
  onReorder,
  folderOptions = [],
  isLoading,
}) {
  const allSelected = scenarios.length > 0 && scenarios.every((s) => selectedIds.has(s.id))

  return (
    <div className="linear-card overflow-hidden">
      <div className="table-wrap">
        <table className="w-full text-sm">
          <thead className="bg-surface-muted/80 border-b border-surface-border text-left">
            <tr className="text-xs uppercase tracking-wider text-ink-subtle">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-surface-border accent-brand"
                />
              </th>
              <th className="w-8 px-1 py-2.5" />
              <th className="px-3 py-2.5 font-semibold">Title</th>
              <th className="px-3 py-2.5 font-semibold hidden md:table-cell">Folder</th>
              <th className="px-3 py-2.5 font-semibold hidden sm:table-cell">Steps</th>
              <th className="px-3 py-2.5 font-semibold hidden lg:table-cell">Last result</th>
              <th className="px-3 py-2.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-subtle">
                  Loading scenarios...
                </td>
              </tr>
            )}
            {!isLoading && scenarios.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-subtle">
                  No scenarios in this folder
                </td>
              </tr>
            )}
            {!isLoading &&
              scenarios.map((s) => {
                const selected = selectedIds.has(s.id)
                return (
                  <tr
                    key={s.id}
                    className={`border-b border-surface-border/80 hover:bg-brand-soft/30 ${
                      selected ? 'bg-brand-soft/40' : 'bg-white'
                    }`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/x-scenario-id', s.id)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={(e) => {
                      if (!onReorder) return
                      e.preventDefault()
                    }}
                    onDrop={(e) => {
                      if (!onReorder) return
                      e.preventDefault()
                      const draggedId = e.dataTransfer.getData('application/x-scenario-id')
                      if (!draggedId || draggedId === s.id) return
                      onReorder(draggedId, s.id)
                    }}
                  >
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleSelect(s.id)}
                        className="rounded border-surface-border accent-brand"
                      />
                    </td>
                    <td className="px-1 py-2.5 text-ink-subtle cursor-grab">
                      <GripVertical size={14} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-left group">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleFavorite?.(s.id)
                            }}
                            className={s.isFavorite ? 'text-amber-500' : 'text-ink-subtle hover:text-amber-500'}
                            title="Favorite"
                          >
                            <Star size={14} fill={s.isFavorite ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpen(s)}
                            onDoubleClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              onEdit?.(s)
                            }}
                            className="font-medium text-ink group-hover:text-brand truncate max-w-[9.5rem] xs:max-w-[12rem] sm:max-w-md text-left"
                            title="Open · double-click to edit"
                          >
                            {s.name}
                          </button>
                        </div>
                        {s.description ? (
                          <p className="text-[11px] text-ink-muted truncate max-w-[280px] sm:max-w-md mt-0.5 pl-6">
                            {s.description}
                          </p>
                        ) : null}
                        {s.url && (
                          <p className="text-[11px] text-ink-subtle truncate max-w-[280px] sm:max-w-md mt-0.5 pl-6">
                            {s.url}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell text-ink-muted">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Folder size={12} />
                        {s.folder?.name || 'No folder'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell text-ink-muted tabular-nums">
                      {s.stepCount ?? s.steps ?? 0}
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <LastResultBadge result={s.lastResult} />
                    </td>
                    <td className="px-3 py-2.5">
                      <RowActions
                        s={s}
                        folderOptions={folderOptions}
                        onOpen={onOpen}
                        onEdit={onEdit}
                        onDuplicate={onDuplicate}
                        onDelete={onDelete}
                        onMoveRequest={onMoveRequest}
                      />
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function flattenFolderOptions(tree, prefix = '') {
  const out = []
  for (const node of tree || []) {
    const label = prefix ? `${prefix} / ${node.name}` : node.name
    out.push({ id: node.id, label })
    out.push(...flattenFolderOptions(node.children || [], label))
  }
  return out
}
