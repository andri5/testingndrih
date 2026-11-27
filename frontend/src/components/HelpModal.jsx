import { useState, useEffect } from 'react'
import {
  X,
  ClipboardList,
  Clock,
  Wrench,
  ChevronRight,
  Bug,
  PanelLeft,
  ListChecks,
  PlayCircle,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

/** Admin-only tabs (Tools suites / automation). */
const ADMIN_HELP_TAB_IDS = new Set(['tools'])

const content = {
  en: {
    title: 'How to Use',
    subtitle: 'Short guide — Cases, Test Runs, Bugs',
    tabs: [
      {
        id: 'nav',
        label: 'Start',
        icon: <PanelLeft size={14} />,
        steps: [
          {
            num: 1,
            title: 'Sidebar',
            desc: 'Icon rail on the left. Expand for labels. On phone/tablet, expand opens as an overlay so the page stays readable.',
            adminOnly: false,
          },
          {
            num: 2,
            title: 'Main menus',
            desc: 'Dashboard · Cases · Test Runs · Reports · Bugs. Admin Tools (wrench) groups Setup / Suites / Automation.',
            adminOnly: false,
          },
          {
            num: 3,
            title: 'Case folders',
            desc: 'On Cases, open Folders: Modul → fitur (Testiny-style). Put cases in the leaf fitur folder. On mobile, folders open as a drawer overlay.',
            adminOnly: false,
          },
        ],
      },
      {
        id: 'scenario',
        label: 'Cases',
        icon: <ClipboardList size={14} />,
        steps: [
          {
            num: 1,
            title: 'New case',
            desc: 'Cases → New case → Blank / Template / Import / Quick Record.',
            adminOnly: false,
          },
          {
            num: 2,
            title: 'Edit in the panel',
            desc: 'Click a case → right panel: Details (Severity), steps (autosave), Attachments, Runs. Use Jalankan for the full case page.',
            adminOnly: false,
          },
          {
            num: 3,
            title: 'Manual vs Automated',
            desc: 'Default Mode = Manual checklist. Switch to Automated (Playwright) only when you need Record / headless run.',
            adminOnly: false,
          },
        ],
      },
      {
        id: 'testruns',
        label: 'Test Runs',
        icon: <ListChecks size={14} />,
        steps: [
          {
            num: 1,
            title: 'Create a run',
            desc: 'Test Runs → Create Run (pick fitur/folder or cases). Or select rows in Cases → Create Test Run.',
          },
          {
            num: 2,
            title: 'Set results',
            desc: 'Pass / Fail / Blocked / Skip per case. Use Checklist for step-level Manual Run. Close / Seal when done.',
          },
        ],
      },
      {
        id: 'execution',
        label: 'Automated',
        icon: <PlayCircle size={14} />,
        steps: [
          {
            num: 1,
            title: 'Run with Playwright',
            desc: 'Case Mode → Automated → Record (optional) → Run. Public URLs use cloud; LAN/VPN needs local backend or Queue local agent.',
          },
          {
            num: 2,
            title: 'Bulk Auto Run',
            desc: 'Cases → select → Auto Run. Prefer Test Runs for structured Manual QA cycles.',
          },
        ],
      },
      {
        id: 'bugs',
        label: 'Bugs',
        icon: <Bug size={14} />,
        steps: [
          {
            num: 1,
            title: 'Auto + manual',
            desc: 'Failed runs can create Auto bugs. On Bugs, add Manual bugs with attachments (paste screenshot supported).',
          },
          {
            num: 2,
            title: 'Share & track',
            desc: 'Share → public link for developers (no login). Status: Open / In progress / Closed.',
          },
        ],
      },
      {
        id: 'tools',
        label: 'Tools',
        icon: <Wrench size={14} />,
        steps: [
          {
            num: 1,
            title: 'Setup',
            desc: 'Environments ({{var}}), Visual Regression, API Testing.',
          },
          {
            num: 2,
            title: 'Suites',
            desc: 'Chains, Smoke, Stress, Security, Browser Test — mark cases then run from the matching Tools page.',
          },
          {
            num: 3,
            title: 'Automation',
            desc: 'Scheduler (cron) and Parallel for broader regression suites.',
          },
        ],
      },
      {
        id: 'tips',
        label: 'Tips',
        icon: <Clock size={14} />,
        steps: [
          {
            num: 1,
            title: 'Mobile',
            desc: 'Sidebar and Folders use overlays on small screens. Tap targets are enlarged for touch.',
          },
          {
            num: 2,
            title: 'Exports & reports',
            desc: 'Reports holds history/trends. Export Excel/PDF/CSV where the page offers it.',
          },
          {
            num: 3,
            title: 'Private staging',
            desc: 'If Automated Run fails on a private URL, use local backend or Queue local agent with VPN connected.',
          },
        ],
      },
    ],
  },
}

export default function HelpModal({ onClose }) {
  const isAdmin = useAuthStore((state) => state.user)?.role === 'ADMIN'
  const c = content.en
  const visibleTabs = isAdmin
    ? c.tabs
    : c.tabs.filter((tab) => !ADMIN_HELP_TAB_IDS.has(tab.id))
  const [activeTab, setActiveTab] = useState('nav')

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id ?? 'nav')
    }
  }, [activeTab, visibleTabs])

  const activeTabData = visibleTabs.find((t) => t.id === activeTab) ?? visibleTabs[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl max-h-[90dvh] flex flex-col rounded-xl shadow-2xl overflow-hidden help-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-4 sm:px-5 pt-5 pb-4 help-modal-header shrink-0">
          <div className="min-w-0 pr-2">
            <h2 className="text-base font-semibold help-modal-title">{c.title}</h2>
            <p className="text-xs help-modal-subtitle mt-0.5">{c.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-md help-modal-close transition-colors shrink-0"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex gap-1 px-4 sm:px-5 pb-0 pt-1 help-modal-tabs-bar overflow-x-auto shrink-0">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 min-h-10 rounded-md text-xs font-medium whitespace-nowrap transition-all
                ${activeTab === tab.id ? 'help-tab-active' : 'help-tab-inactive'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="px-4 sm:px-5 py-4 space-y-3 overflow-y-auto flex-1 min-h-0 help-modal-body">
          {(activeTabData?.steps || [])
            .filter((step) => isAdmin || !step.adminOnly)
            .map((step, idx) => (
              <div key={step.num} className="flex gap-3">
                <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold help-step-num">
                  {idx + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium help-step-title leading-snug">{step.title}</p>
                  <p className="text-xs help-step-desc mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
        </div>

        <div className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 help-modal-footer shrink-0">
          <p className="text-[11px] help-footer-text min-w-0">
            Tip: expand the sidebar when you need menu labels.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 min-h-10 text-xs font-medium help-footer-btn transition-colors shrink-0 px-2"
          >
            Got it
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
