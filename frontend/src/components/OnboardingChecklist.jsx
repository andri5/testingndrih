import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, X } from 'lucide-react'
import {
  ONBOARDING_CHECKLIST_KEY,
  defaultOnboardingChecklist,
} from '../constants/welcomeSplash'
import { useAppI18nStore } from '../store/appI18nStore'

export default function OnboardingChecklist() {
  const t = useAppI18nStore((s) => s.t)
  const [state, setState] = useState(() => {
    try {
      return { ...defaultOnboardingChecklist(), ...JSON.parse(localStorage.getItem(ONBOARDING_CHECKLIST_KEY) || '{}') }
    } catch {
      return defaultOnboardingChecklist()
    }
  })

  useEffect(() => {
    localStorage.setItem(ONBOARDING_CHECKLIST_KEY, JSON.stringify(state))
  }, [state])

  if (state.dismissed) return null
  const done = state.createScenario && state.addOrRecordSteps && state.runPublicOrLocal
  if (done) return null

  const items = [
    { key: 'createScenario', label: t('onboarding.create'), to: '/scenarios' },
    { key: 'addOrRecordSteps', label: t('onboarding.steps'), to: '/scenarios' },
    { key: 'runPublicOrLocal', label: t('onboarding.run'), to: '/scenarios' },
  ]

  return (
    <div className="mb-6 rounded-xl border border-[#2D2D2F] bg-[#161618] p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-[#E0E0E2]">{t('onboarding.title')}</h3>
        <button
          type="button"
          className="text-[#888] hover:text-[#E0E0E2]"
          aria-label="Dismiss"
          onClick={() => setState((s) => ({ ...s, dismissed: true }))}
        >
          <X size={16} />
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((item) => {
          const checked = state[item.key]
          return (
            <li key={item.key} className="flex items-center gap-2 text-sm">
              <button
                type="button"
                className="text-[#5E6AD2]"
                onClick={() => setState((s) => ({ ...s, [item.key]: !s[item.key] }))}
              >
                {checked ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} />}
              </button>
              <Link to={item.to} className={checked ? 'text-[#888] line-through' : 'text-[#A0A0A4] hover:text-[#E0E0E2]'}>
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
