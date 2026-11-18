import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Coffee, PlayCircle, PenLine, X } from 'lucide-react'
import { scenarioAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'
import { Button, Spinner } from './ui'

const COPY = {
  casual: {
    title: 'Woy bro, masih ada yang belom lu selesain nih',
    subtitle: (n) => `${n} skenario nungguin lu — jangan dianggurin.`,
    empty: 'Santai, semua skenario lagi bersih. Gas terus ☕',
    never_run: 'Belum pernah lu run. Cobain sekali yuk.',
    stuck: 'Execution-nya masih menggantung. Lanjutin atau cek Execution.',
    draft: 'Skenario masih kosong nih — belum ada step.',
    ctaNever: 'Gas run',
    ctaStuck: 'Lanjutin',
    ctaDraft: 'Isi step',
    dismiss: 'Nanti aja',
  },
  formal: {
    title: 'You have unfinished scenarios',
    subtitle: (n) => `${n} scenario(s) need attention.`,
    empty: 'All clear — no unfinished scenarios.',
    never_run: 'This scenario has never been executed.',
    stuck: 'An execution is still pending/running. Continue or cancel it.',
    draft: 'This scenario has no steps yet.',
    ctaNever: 'Run',
    ctaStuck: 'Open',
    ctaDraft: 'Add steps',
    dismiss: 'Dismiss today',
  },
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function dismissStorageKey(userId) {
  return `reminderDismissed:${userId || 'anon'}:${todayKey()}`
}

function readDismissed(userId) {
  try {
    const raw = localStorage.getItem(dismissStorageKey(userId))
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function writeDismissed(userId, set) {
  localStorage.setItem(dismissStorageKey(userId), JSON.stringify([...set]))
}

function typeIcon(type) {
  if (type === 'stuck') return AlertTriangle
  if (type === 'draft') return PenLine
  return PlayCircle
}

export default function ScenarioReminders() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const reminderTone = useSettingsStore((s) => s.reminderTone)
  const tone = reminderTone === 'formal' ? 'formal' : 'casual'
  const t = COPY[tone]

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [counts, setCounts] = useState({ total: 0 })
  const [dismissed, setDismissed] = useState(() => readDismissed(user?.id))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await scenarioAPI.reminders(8)
      setItems(res.data.items || [])
      setCounts(res.data.counts || { total: 0 })
    } catch {
      setItems([])
      setCounts({ total: 0 })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setDismissed(readDismissed(user?.id))
  }, [user?.id])

  const visible = useMemo(
    () => items.filter((item) => !dismissed.has(item.id)),
    [items, dismissed]
  )

  const dismissOne = (id) => {
    const next = new Set(dismissed)
    next.add(id)
    setDismissed(next)
    writeDismissed(user?.id, next)
  }

  const dismissAll = () => {
    const next = new Set(dismissed)
    visible.forEach((item) => next.add(item.id))
    setDismissed(next)
    writeDismissed(user?.id, next)
  }

  const go = (item) => {
    if (item.type === 'stuck' && item.executionId) {
      navigate('/execution')
      return
    }
    navigate(`/scenarios/${item.id}`)
  }

  if (loading) {
    return (
      <div className="linear-card p-5 flex justify-center">
        <Spinner size="sm" />
      </div>
    )
  }

  if (!counts.total || visible.length === 0) {
    return null
  }

  return (
    <div className="linear-card p-5 border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-orange-50/40">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Coffee size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">{t.title}</h2>
            <p className="text-sm text-ink-muted mt-0.5">{t.subtitle(visible.length)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismissAll}
          className="text-xs text-ink-muted hover:text-ink shrink-0"
        >
          {t.dismiss}
        </button>
      </div>

      <ul className="space-y-2">
        {visible.map((item) => {
          const Icon = typeIcon(item.type)
          const cta =
            item.type === 'stuck'
              ? t.ctaStuck
              : item.type === 'draft'
                ? t.ctaDraft
                : t.ctaNever
          const blurb =
            item.type === 'stuck'
              ? t.stuck
              : item.type === 'draft'
                ? t.draft
                : t.never_run
          return (
            <li
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-lg border border-amber-200/70 bg-white/80 px-3 py-2.5"
            >
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                <Icon
                  size={16}
                  className={`mt-0.5 shrink-0 ${
                    item.type === 'stuck' ? 'text-amber-600' : 'text-brand'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{item.name}</p>
                  <p className="text-[11px] font-mono text-brand mt-0.5">
                    {item.scenarioCode || '—'}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">{blurb}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button size="sm" onClick={() => go(item)}>
                  {cta}
                </Button>
                <button
                  type="button"
                  title={t.dismiss}
                  onClick={() => dismissOne(item.id)}
                  className="p-1.5 rounded-md text-ink-muted hover:bg-surface-muted"
                >
                  <X size={14} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
