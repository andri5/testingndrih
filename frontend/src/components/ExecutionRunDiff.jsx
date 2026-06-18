import { useEffect, useState } from 'react'
import { X, GitCompare } from 'lucide-react'
import { Badge, Spinner } from './ui'
import ExportFormatButton from './ExportFormatButton'
import { executionAPI } from '../services/api'

function stepKey(result, index) {
  return result.testStep?.stepNumber ?? result.stepNumber ?? index + 1
}

function stepLabel(result, index) {
  const num = stepKey(result, index)
  const desc = result.testStep?.description || result.description || ''
  return desc ? `Step ${num}: ${desc}` : `Step ${num}`
}

function statusVariant(status) {
  if (status === 'PASSED') return 'success'
  if (status === 'FAILED') return 'danger'
  if (status === 'SKIPPED') return 'warning'
  return 'default'
}

function buildDiffRows(leftSteps, rightSteps) {
  const leftMap = new Map()
  const rightMap = new Map()

  leftSteps.forEach((s, i) => leftMap.set(stepKey(s, i), s))
  rightSteps.forEach((s, i) => rightMap.set(stepKey(s, i), s))

  const keys = [...new Set([...leftMap.keys(), ...rightMap.keys()])].sort((a, b) => a - b)

  return keys.map((key) => {
    const left = leftMap.get(key)
    const right = rightMap.get(key)
    const leftStatus = left?.status || '—'
    const rightStatus = right?.status || '—'
    const changed = leftStatus !== rightStatus
      || (left?.duration ?? null) !== (right?.duration ?? null)
      || (left?.errorMessage || '') !== (right?.errorMessage || '')

    return { key, left, right, changed }
  })
}

export default function ExecutionRunDiff({ executionA, executionB, onClose }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [detailsA, setDetailsA] = useState(null)
  const [detailsB, setDetailsB] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [resA, resB] = await Promise.all([
          executionAPI.getDetails(executionA.id),
          executionAPI.getDetails(executionB.id),
        ])
        if (cancelled) return
        setDetailsA(resA.data.execution || resA.data)
        setDetailsB(resB.data.execution || resB.data)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load execution details')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [executionA.id, executionB.id])

  const rows = detailsA && detailsB
    ? buildDiffRows(detailsA.stepResults || [], detailsB.stepResults || [])
    : []

  const diffCount = rows.filter((r) => r.changed).length

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[#1A1A1C] border border-[#2D2D2F] rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#2D2D2F] shrink-0">
          <div className="flex items-center gap-2">
            <GitCompare size={18} className="text-[#9BA3F0]" />
            <h3 className="text-lg font-semibold text-[#E0E0E2]">Compare Runs</h3>
            {!loading && (
              <Badge variant={diffCount > 0 ? 'warning' : 'success'}>
                {diffCount} difference{diffCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <button onClick={onClose} className="text-[#666] hover:text-[#E0E0E2] p-1">
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-[#2D2D2F] grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm shrink-0">
          <div className="rounded-lg bg-[#141316] border border-[#2A2A2D] p-3">
            <p className="text-xs text-[#8A8A8F] uppercase tracking-wider mb-1">Run A</p>
            <p className="font-medium text-[#E0E0E2]">{executionA.scenario?.name || '—'}</p>
            <p className="text-[#8A8A8F] mt-1">{new Date(executionA.createdAt).toLocaleString()}</p>
            <Badge variant={statusVariant(executionA.status)} className="mt-2">
              {executionA.status}
            </Badge>
          </div>
          <div className="rounded-lg bg-[#141316] border border-[#2A2A2D] p-3">
            <p className="text-xs text-[#8A8A8F] uppercase tracking-wider mb-1">Run B</p>
            <p className="font-medium text-[#E0E0E2]">{executionB.scenario?.name || '—'}</p>
            <p className="text-[#8A8A8F] mt-1">{new Date(executionB.createdAt).toLocaleString()}</p>
            <Badge variant={statusVariant(executionB.status)} className="mt-2">
              {executionB.status}
            </Badge>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {loading && (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          )}
          {error && (
            <p className="text-red-400 text-sm text-center py-8">{error}</p>
          )}
          {!loading && !error && rows.length === 0 && (
            <p className="text-[#8A8A8F] text-center py-8">No step results to compare.</p>
          )}
          {!loading && !error && rows.length > 0 && (
            <div className="space-y-2">
              {rows.map(({ key, left, right, changed }) => (
                <div
                  key={key}
                  className={`rounded-lg border p-3 grid grid-cols-1 lg:grid-cols-2 gap-3 ${
                    changed
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : 'border-[#2A2A2D] bg-[#141316]'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold text-[#8A8A8F] mb-2">Run A</p>
                    {left ? (
                      <>
                        <p className="text-sm text-[#E0E0E2] mb-1">{stepLabel(left, key - 1)}</p>
                        <Badge variant={statusVariant(left.status)}>{left.status}</Badge>
                        {left.duration != null && (
                          <span className="text-xs text-[#8A8A8F] ml-2">
                            {(left.duration / 1000).toFixed(2)}s
                          </span>
                        )}
                        {left.errorMessage && (
                          <p className="text-xs text-red-400 mt-2 line-clamp-2">{left.errorMessage}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-[#555]">— missing —</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#8A8A8F] mb-2">Run B</p>
                    {right ? (
                      <>
                        <p className="text-sm text-[#E0E0E2] mb-1">{stepLabel(right, key - 1)}</p>
                        <Badge variant={statusVariant(right.status)}>{right.status}</Badge>
                        {right.duration != null && (
                          <span className="text-xs text-[#8A8A8F] ml-2">
                            {(right.duration / 1000).toFixed(2)}s
                          </span>
                        )}
                        {right.errorMessage && (
                          <p className="text-xs text-red-400 mt-2 line-clamp-2">{right.errorMessage}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-[#555]">— missing —</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end p-4 border-t border-[#2D2D2F] shrink-0">
          <ExportFormatButton format="json" onClick={onClose} icon={null}>
            Close
          </ExportFormatButton>
        </div>
      </div>
    </div>
  )
}
