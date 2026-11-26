import { useState, useEffect } from 'react'
import {
  X,
  ClipboardList,
  PlayCircle,
  Link2,
  Clock,
  Wrench,
  ChevronRight,
  Flame,
  Gauge,
  Lock,
  Bug,
  PanelLeft,
  ListChecks,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const ADMIN_HELP_TAB_IDS = new Set(['chain', 'smoke', 'stress', 'security', 'tools'])

const content = {
  en: {
    title: 'How to Use',
    subtitle: 'QA guide — Manual checklist, Test Runs, and Automated playback',
    tabs: [
      {
        id: 'nav',
        label: 'Navigation',
        icon: <PanelLeft size={14} />,
        steps: [
          {
            num: 1,
            title: 'Sidebar expand / collapse',
            desc: 'Use the panel button at the top of the left sidebar to expand (icons + labels) or collapse (icons only). Your preference is saved in this browser.',
            adminOnly: false,
          },
          {
            num: 2,
            title: 'Main menu & Tools',
            desc: 'Main: Dashboard, Cases, Test Runs, Reports, Bugs. Tools (Admin): Setup / Suites / Automation groups. LEAD gets Environments; advanced suites stay Admin.',
            adminOnly: false,
          },
          {
            num: 3,
            title: 'Feature folders',
            desc: 'On Cases, 1 folder = 1 fitur. Click a case → edit in the right panel. Open “Jalankan” for the full case page. Bulk: New Test Run / Run automated / Move.',
            adminOnly: false,
          },
          {
            num: 4,
            title: 'Dashboard reminders',
            desc: 'Unfinished cases show as reminders. Hide collapses the panel; Nanti aja dismisses items for today.',
            adminOnly: false,
          },
          {
            num: 5,
            title: 'How to use anytime',
            desc: 'Open this guide from the help icon (or “How to use”) at the bottom of the sidebar.',
            adminOnly: false,
          },
        ],
      },
      {
        id: 'scenario',
        label: 'Test cases',
        icon: <ClipboardList size={14} />,
        steps: [
          {
            num: 1,
            title: 'Create a test case',
            desc: 'Feature folder → New case → Blank / Template / Import / Quick Record.',
            adminOnly: false,
          },
          {
            num: 2,
            title: 'Edit in the panel',
            desc: 'Click a case → right panel: Details, steps (autosave), Attachments, Runs. Use Jalankan to open the full page for manual/automated run.',
            adminOnly: false,
          },
          {
            num: 3,
            title: 'Attachments / Runs / History',
            desc: 'Attachments: upload PNG/PDF evidence. Runs: history + % complete for this case. History: audit of field changes after you save.',
            adminOnly: false,
          },
          {
            num: 4,
            title: 'Record (Automated only)',
            desc: 'Switch Mode to Automated (Playwright) to show Record. Manual mode hides Record — add steps by hand instead.',
            adminOnly: false,
          },
          {
            num: 5,
            title: 'Organize',
            desc: 'Feature folders (1 folder = 1 fitur), tags, favorites, search. Select cases → Create Test Run, Auto Run, Move…, or Set PIC…',
            adminOnly: false,
          },
        ],
      },
      {
        id: 'manual',
        label: 'Jalankan case',
        icon: <ClipboardList size={14} />,
        steps: [
          {
            num: 1,
            title: 'Default mode = Manual',
            desc: 'On a case, Mode defaults to Manual checklist. No Playwright / no Record needed.',
          },
          {
            num: 2,
            title: 'Jalankan (manual)',
            desc: 'On the case page, click Jalankan (manual). Mark each step: Passed / Failed / Blocked / Skipped. Failed & Blocked require notes; you can create a Bug.',
          },
          {
            num: 3,
            title: 'Finish or cancel',
            desc: 'When all steps are marked, Finish. Or Cancel if you stop early. Progress shows on Dashboard reminders if left hanging.',
          },
          {
            num: 4,
            title: 'Prefer Test Runs for cycles',
            desc: 'For multi-case Manual QA (per feature), use Test Runs → Create Run instead of running cases one-by-one.',
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
            title: 'Multi-case run',
            desc: 'Test Runs → Create Run: cases are grouped by feature folder (1 folder = 1 fitur). Use Select fitur to pick a whole module, or filter by feature. Or select cases in Cases → Create Test Run.',
          },
          {
            num: 2,
            title: 'Set results',
            desc: 'Open the run → cases listed under each feature. Pass / Fail / Blocked / Skip per case (notes for Fail/Blocked). Or Checklist for step-level Manual Run.',
          },
          {
            num: 3,
            title: 'Close / Seal',
            desc: 'When done, Close / Seal so results cannot be changed. Filter Open vs Closed on the Test Runs list.',
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
            title: 'Automated (Playwright)',
            desc: 'On a case, set Mode → Automated. Record appears. Run uses Playwright (cloud for public URLs).',
          },
          {
            num: 2,
            title: 'Public vs internal URLs',
            desc: 'Cloud Run works for public URLs. For LAN/VPN staging, use local backend or Queue local agent (Admin → Integrations / API Tokens) on a VPN PC.',
          },
          {
            num: 3,
            title: 'Results on the case',
            desc: 'After Automated Run, review step results on the case page. Export/share from the case or Reports when available.',
          },
          {
            num: 4,
            title: 'Run automated (bulk)',
            desc: 'Cases → select rows → Auto Run (headless sequential). Prefer Create Test Run for structured Manual QA cycles.',
          },
          {
            num: 5,
            title: 'Failed automated steps',
            desc: 'Failed steps show diagnosis tips and locator suggestions. Apply a suggested selector and retry when available.',
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
            title: 'Auto bugs from failed runs',
            desc: 'When a run fails, issues can be created automatically and linked to the scenario/execution (with step screenshots when available).',
          },
          {
            num: 2,
            title: 'Manual bugs',
            desc: 'On Bugs, create a manual issue for findings even when a run passed. Attach images or files to document the problem.',
          },
          {
            num: 3,
            title: 'Share with developers',
            desc: 'Open a bug → Share to create a public link (no login). The shared page includes details, screenshots, and attachments.',
          },
          {
            num: 4,
            title: 'Track status',
            desc: 'Update status (Open / In progress / Resolved) and filter the bug list so QA and developers stay aligned.',
          },
        ],
      },
      {
        id: 'chain',
        label: 'Chains',
        icon: <Link2 size={14} />,
        steps: [
          { num: 1, title: 'Create a Chain', desc: 'Go to Chains → New Chain. A chain groups multiple scenarios into one sequential run.' },
          { num: 2, title: 'Add Cases', desc: 'Open a chain → add cases as steps. Reorder with the up/down controls.' },
          { num: 3, title: 'Configure Steps', desc: 'Edit a chain step to set wait time, retry count, and stop-on-fail.' },
          { num: 4, title: 'Execute Chain', desc: 'Execute Chain runs all scenarios in order. Review results per scenario in history.' },
        ],
      },
      {
        id: 'smoke',
        label: 'Smoke Test',
        icon: <Flame size={14} />,
        steps: [
          { num: 1, title: 'Mark for Smoke Testing', desc: 'Mark scenarios for smoke testing so they act as quick validation checks.' },
          { num: 2, title: 'View Summary', desc: 'Smoke Test shows totals, pass rate, and average duration. Metrics update after each run.' },
          { num: 3, title: 'Run Single or All', desc: 'Run one smoke scenario, or Run All Smoke Tests to execute every marked scenario.' },
          { num: 4, title: 'View History', desc: 'Check history for past runs, timestamps, and detailed logs.' },
        ],
      },
      {
        id: 'stress',
        label: 'Stress Test',
        icon: <Gauge size={14} />,
        steps: [
          { num: 1, title: 'Mark for Stress Testing', desc: 'Mark scenarios for stress testing to measure performance under load.' },
          { num: 2, title: 'Choose Load Profile', desc: 'Profiles: Light (2×3), Medium (5×5), Heavy (10×10), Extreme (20×20) concurrent users.' },
          { num: 3, title: 'Metrics', desc: 'Summary shows pass rate, average response time (ms), and throughput (executions/sec).' },
          { num: 4, title: 'Run', desc: 'Run a single scenario or Run All with the selected profile.' },
        ],
      },
      {
        id: 'security',
        label: 'Security Test',
        icon: <Lock size={14} />,
        steps: [
          { num: 1, title: 'Mark for Security Testing', desc: 'Mark scenarios for security scans to look for common web vulnerabilities.' },
          { num: 2, title: 'Choose Scan Type', desc: 'Full Scan, Quick Scan, or Custom (pick specific checks).' },
          { num: 3, title: 'Review Findings', desc: 'Filter by severity. Each finding shows type, location, risk, and remediation hints.' },
        ],
      },
      {
        id: 'tools',
        label: 'Tools',
        icon: <Wrench size={14} />,
        steps: [
          { num: 1, title: 'Open Tools', desc: 'Sidebar wrench icon → Visual Regression, Chains, API Testing, Scheduler, Parallel, Smoke/Stress/Security, Browser Test.' },
          { num: 2, title: 'Scheduler', desc: 'Scheduler → set a cron schedule to run a scenario automatically.' },
          { num: 3, title: 'Parallel Execution', desc: 'Run multiple scenarios at once — useful for broader regression suites.' },
          { num: 4, title: 'Browser Matrix', desc: 'Run one scenario across Chromium, Firefox, and WebKit to catch browser-specific issues.' },
          { num: 5, title: 'Reports', desc: 'Main menu Reports (not under Tools). Export Excel/PDF where available.' },
          { num: 6, title: 'Environments', desc: 'Main menu Environments — define variables and use {{var}} in steps.' },
        ],
      },
      {
        id: 'tips',
        label: 'Tips',
        icon: <Clock size={14} />,
        steps: [
          { num: 1, title: 'Tooltips', desc: 'Hover action buttons (or long-press on some mobile UIs) for a short description.' },
          { num: 2, title: 'Headless Mode', desc: 'Enable Headless in the browser selector for faster runs without a visible window.' },
          { num: 3, title: 'Export', desc: 'Use Export on Dashboard, Reports, Smoke/Stress/Security where available (JSON, CSV, Excel, PDF depending on the page).' },
          { num: 4, title: 'Mobile layout', desc: 'On phones, use the hamburger on the marketing site and ⋯ menus / stacked actions inside the app. Expand the sidebar when you need labels.' },
          { num: 5, title: 'Internal staging', desc: 'If Run fails with a private network error, switch to local backend or Queue local agent while FortiClient/VPN is connected.' },
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
            className="w-7 h-7 flex items-center justify-center rounded-md help-modal-close transition-colors shrink-0"
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all
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
            className="flex items-center gap-1 text-xs font-medium help-footer-btn transition-colors shrink-0"
          >
            Got it
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
