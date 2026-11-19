import { useEffect, useRef, useState } from 'react'
// drag reorder: grip → drop on another row (folder / No folder views)
import {
  Star,
  FileText,
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
          title="Buka detail test case"
          aria-label="Buka detail test case"
          onClick={() => onOpen(s)}
          className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md bg-brand-soft text-brand hover:bg-teal-200 text-[11px] font-semibold"
        >
          <FileText size={14} />
          Open
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
              <FileText size={14} /> Open detail
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

const SEVERITY_BADGE = {
  LOW: 'border-sky-300 bg-sky-50 text-sky-800',
  MEDIUM: 'border-amber-300 bg-amber-50 text-amber-900',
  HIGH: 'border-orange-400 bg-orange-50 text-orange-900',
  CRITICAL: 'border-red-400 bg-red-50 text-red-800',
}

function SeverityBadge({ priority }) {
  const level = String(priority || 'MEDIUM').toUpperCase()
  const cls = SEVERITY_BADGE[level] || SEVERITY_BADGE.MEDIUM
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide border ${cls}`}
      title={`Severity / Priority: ${level}`}
    >
      {level}
    </span>
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
  const total = result.totalSteps || 0
  const done = (result.passedSteps || 0) + (result.failedSteps || 0)
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : null
  const typeHint = result.testType === 'MANUAL' ? 'Manual' : null

  if (result.status === 'PASSED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium" title={typeHint || undefined}>
        <CheckCircle2 size={13} /> Passed{pct != null ? ` · ${pct}%` : ''}
      </span>
    )
  }
  if (result.status === 'FAILED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium" title={typeHint || undefined}>
        <XCircle size={13} /> Failed{pct != null ? ` · ${pct}%` : ''}
      </span>
    )
  }
  if (result.status === 'RUNNING') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-brand font-medium" title={typeHint || undefined}>
        <Circle size={12} className="fill-brand text-brand" /> Running{pct != null ? ` · ${pct}%` : ''}
      </span>
    )
  }
  if (result.status === 'BLOCKED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium">
        <Circle size={12} /> Blocked
      </span>
    )
  }
  if (result.status === 'SKIPPED') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-ink-muted font-medium">
        <Circle size={12} /> Skipped
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
  activeId = null,
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
  emptyTitle = 'Belum ada test case',
  emptyHint = 'Buat case baru untuk fitur ini, lalu isi steps di detail.',
  onCreateEmpty,
  createEmptyLabel = 'Create Manual',
  reorderEnabled = false,
  compact = false,
}) {
  const allSelected = scenarios.length > 0 && scenarios.every((s) => selectedIds.has(s.id))
  const canReorder = Boolean(onReorder) && reorderEnabled
  const [draggingId, setDraggingId] = useState(null)
  const [dropTargetId, setDropTargetId] = useState(null)

  return (
    <div className="linear-card overflow-hidden max-w-full">
      {canReorder && scenarios.length > 1 ? (
        <p className="px-3 py-2 text-[11px] text-ink-muted border-b border-surface-border bg-surface-muted/40">
          Ubah urutan: drag ikon <span className="font-semibold text-ink">⋮⋮</span> ke baris lain (atas/bawah).
          Drag ke sidebar untuk pindah feature folder.
        </p>
      ) : null}
      {compact ? (
        <p className="px-3 py-1.5 text-[11px] text-ink-muted border-b border-surface-border bg-sky-50/80">
          Klik baris untuk ganti case di panel kanan · tutup panel untuk aksi Edit/Delete lengkap.
        </p>
      ) : null}
      <div className={`table-wrap max-w-full ${compact ? 'overflow-x-hidden' : ''}`}>
        <table className={`w-full text-sm ${compact ? 'table-fixed' : ''}`}>
          <thead className="bg-surface-muted/80 border-b border-surface-border text-left">
            <tr className="text-xs uppercase tracking-wider text-ink-subtle">
              <th className={`${compact ? 'w-9' : 'w-10'} px-2 sm:px-3 py-2.5`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-surface-border accent-brand"
                />
              </th>
              <th
                className={`${compact ? 'w-7' : 'w-8'} px-1 py-2.5`}
                title={canReorder ? 'Drag to reorder' : undefined}
              />
              <th className="px-2 sm:px-3 py-2.5 font-semibold min-w-0">Title</th>
              <th className={`px-3 py-2.5 font-semibold ${compact ? 'hidden' : 'hidden md:table-cell'}`}>
                Folder
              </th>
              <th className={`px-3 py-2.5 font-semibold ${compact ? 'hidden' : 'hidden sm:table-cell'}`}>
                Steps
              </th>
              <th className={`${compact ? 'w-[5.5rem]' : ''} px-2 sm:px-3 py-2.5 font-semibold`}>
                Severity
              </th>
              <th
                className={`px-3 py-2.5 font-semibold ${
                  compact ? 'hidden' : 'hidden lg:table-cell'
                }`}
              >
                Last result
              </th>
              <th className={`px-3 py-2.5 font-semibold text-right ${compact ? 'hidden' : ''}`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-ink-subtle">
                  Loading scenarios...
                </td>
              </tr>
            )}
            {!isLoading && scenarios.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <p className="text-sm font-medium text-ink">{emptyTitle}</p>
                  <p className="text-xs text-ink-muted mt-1 max-w-md mx-auto">{emptyHint}</p>
                  {onCreateEmpty ? (
                    <button
                      type="button"
                      onClick={onCreateEmpty}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-hover"
                    >
                      {createEmptyLabel}
                    </button>
                  ) : null}
                </td>
              </tr>
            )}
            {!isLoading &&
              scenarios.map((s) => {
                const selected = selectedIds.has(s.id)
                const isActive = activeId === s.id
                const isDragging = draggingId === s.id
                const isDropTarget = canReorder && dropTargetId === s.id && draggingId && draggingId !== s.id
                return (
                  <tr
                    key={s.id}
                    className={[
                      'border-b border-surface-border/80 hover:bg-brand-soft/30 transition-colors cursor-pointer',
                      isActive
                        ? 'bg-sky-50/90 ring-1 ring-inset ring-sky-200'
                        : selected
                          ? 'bg-brand-soft/40'
                          : 'bg-white',
                      isDragging ? 'opacity-40' : '',
                      isDropTarget ? 'bg-brand-soft/70 shadow-[inset_0_2px_0_0_var(--color-brand,#0d9488)]' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={(e) => {
                      // Ignore interactive controls — Open / checkbox / drag handle handle themselves
                      const tag = e.target?.closest?.(
                        'button, a, input, select, [data-drag-handle], [data-row-action]'
                      )
                      if (tag) return
                      onOpen?.(s)
                    }}
                    onDragOver={(e) => {
                      if (!canReorder || !draggingId) return
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      if (dropTargetId !== s.id) setDropTargetId(s.id)
                    }}
                    onDragLeave={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setDropTargetId((cur) => (cur === s.id ? null : cur))
                      }
                    }}
                    onDrop={(e) => {
                      if (!canReorder) return
                      e.preventDefault()
                      const draggedId =
                        e.dataTransfer.getData('application/x-scenario-id') ||
                        e.dataTransfer.getData('text/plain')
                      setDropTargetId(null)
                      setDraggingId(null)
                      if (!draggedId || draggedId === s.id || draggedId.startsWith('folder:')) return
                      onReorder(draggedId, s.id)
                    }}
                  >
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleSelect(s.id)}
                        className="rounded border-surface-border accent-brand"
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td
                      className="px-1 py-2.5 text-ink-subtle cursor-grab active:cursor-grabbing"
                      draggable
                      data-drag-handle="scenario"
                      title={
                        canReorder
                          ? 'Drag atas/bawah untuk ubah urutan · drop ke folder di sidebar untuk pindah fitur'
                          : 'Drag ke feature folder di sidebar'
                      }
                      onDragStart={(e) => {
                        e.stopPropagation()
                        e.dataTransfer.setData('application/x-scenario-id', s.id)
                        e.dataTransfer.setData('text/plain', s.id)
                        e.dataTransfer.effectAllowed = 'move'
                        setDraggingId(s.id)
                      }}
                      onDragEnd={() => {
                        setDraggingId(null)
                        setDropTargetId(null)
                      }}
                    >
                      <GripVertical size={14} />
                    </td>
                    <td className="px-2 sm:px-3 py-2.5 min-w-0">
                      <div className="text-left group min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0">
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
                            className="font-medium text-ink group-hover:text-brand truncate text-left max-w-full block"
                            title="Open · double-click to edit"
                          >
                            {s.name}
                          </button>
                        </div>
                        {s.scenarioCode ? (
                          <p className="text-[10px] font-mono text-brand truncate mt-0.5 pl-6 max-w-full">
                            {s.scenarioCode}
                          </p>
                        ) : null}
                        {s.description && !compact ? (
                          <p className="text-[11px] text-ink-muted truncate max-w-[280px] sm:max-w-md mt-0.5 pl-6">
                            {s.description}
                          </p>
                        ) : null}
                        {s.url && !compact ? (
                          <p className="text-[11px] text-ink-subtle truncate max-w-[280px] sm:max-w-md mt-0.5 pl-6">
                            {s.url}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    <td
                      className={`px-3 py-2.5 text-ink-muted ${
                        compact ? 'hidden' : 'hidden md:table-cell'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Folder size={12} />
                        {s.folder?.name || 'No folder'}
                      </span>
                    </td>
                    <td
                      className={`px-3 py-2.5 text-ink-muted tabular-nums ${
                        compact ? 'hidden' : 'hidden sm:table-cell'
                      }`}
                    >
                      {s.stepCount ?? s.steps ?? 0}
                    </td>
                    <td className="px-3 py-2.5">
                      <SeverityBadge priority={s.priority} />
                    </td>
                    <td
                      className={`px-3 py-2.5 ${compact ? 'hidden' : 'hidden lg:table-cell'}`}
                    >
                      <LastResultBadge result={s.lastResult} />
                    </td>
                    <td
                      className={`px-3 py-2.5 ${compact ? 'hidden' : ''}`}
                      data-row-action
                      onClick={(e) => e.stopPropagation()}
                    >
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
