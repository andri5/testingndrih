import { useState, useEffect } from 'react'
import { X, ClipboardList, PlayCircle, Link2, Clock, Zap, ChevronRight, Flame, Gauge, Lock } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const ADMIN_HELP_TAB_IDS = new Set(['chain', 'smoke', 'stress', 'security', 'tools'])

const content = {
  en: {
    title: 'How to Use',
    subtitle: 'Get started with Test Sambil Ngopi',
    tabs: [
      {
        id: 'scenario',
        label: 'Scenarios',
        icon: <ClipboardList size={14} />,
        steps: [
          { num: 1, title: 'Create a Scenario', desc: 'Go to Scenarios → click "+ Create Scenario" dropdown. Choose "Create Manual" to fill in name, URL, and description manually.' },
          { num: 2, title: 'Add Test Steps', desc: 'Open a scenario → click "+ Add Step". Choose step type: click, fill, navigate, wait, assert, etc.' },
          { num: 3, title: 'Use Quick Record', desc: 'Click "+ Create Scenario" → "Quick Record" → enter URL → browser actions are recorded automatically as steps.' },
          { num: 4, title: 'Use Templates', desc: 'Click "+ Create Scenario" → "Templates" to load a pre-built scenario (Login, E-Commerce, Navigation, Form).' },
          { num: 5, title: 'Import / Clone', desc: 'Import Excel: Click "+ Create Scenario" → "Import Excel" (Ctrl+Click to view template). Clone: Hover a scenario card → use Clone to duplicate.' },
        ],
      },
      {
        id: 'execution',
        label: 'Execution',
        icon: <PlayCircle size={14} />,
        steps: [
          { num: 1, title: 'Run a Scenario', desc: 'Open a scenario → click "Run". Choose browser (Chrome/Firefox/Safari) and headless mode.' },
          { num: 2, title: 'Live Viewer', desc: 'During execution, a live viewer shows each step result in real-time with screenshots.' },
          { num: 3, title: 'Pause / Stop', desc: 'Use Pause or Stop buttons in the live viewer to control the running execution.' },
          { num: 4, title: 'View History', desc: 'Go to Execution page to see all past runs, filter by status, and download reports.' },
          { num: 5, title: 'Bulk Execute', desc: 'On the Scenarios page, select multiple scenarios → click "Run Selected" to execute in batch.' },
        ],
      },
      {
        id: 'chain',
        label: 'Chains',
        icon: <Link2 size={14} />,
        steps: [
          { num: 1, title: 'Create a Chain', desc: 'Go to Chains → click "+ New Chain". A chain groups multiple scenarios into one sequential run.' },
          { num: 2, title: 'Add Scenarios', desc: 'Open a chain → add scenarios as steps. Set order with the up/down arrows.' },
          { num: 3, title: 'Configure Steps', desc: 'Click Edit on a chain step to set wait time, retry count, and stop-on-fail behavior.' },
          { num: 4, title: 'Execute Chain', desc: 'Click "Execute Chain" to run all scenarios in order. View results per scenario.' },
        ],
      },
      {
        id: 'smoke',
        label: 'Smoke Test',
        icon: <Flame size={14} />,
        steps: [
          { num: 1, title: 'Mark for Smoke Testing', desc: 'Go to Scenarios → select scenarios you want to test → mark them for smoke testing. These become quick validation tests.' },
          { num: 2, title: 'View Summary', desc: 'Smoke Test page shows total tests, pass rate, and average execution duration. Real-time metrics update after each run.' },
          { num: 3, title: 'Run Single Test', desc: 'Select a scenario from the list → click "Run" to execute that smoke test and see live results.' },
          { num: 4, title: 'Run All Tests', desc: 'Click the "Run All Smoke Tests" button to execute all marked scenarios at once.' },
          { num: 5, title: 'View History', desc: 'Check test history on the right sidebar. View past runs, results, timestamps, and detailed logs.' },
        ],
      },
      {
        id: 'stress',
        label: 'Stress Test',
        icon: <Gauge size={14} />,
        steps: [
          { num: 1, title: 'Mark for Stress Testing', desc: 'Go to Scenarios → select scenarios → mark them for stress testing. These measure system performance under load.' },
          { num: 2, title: 'Choose Load Profile', desc: 'Stress Test supports 4 profiles: Light (2x3), Medium (5x5), Heavy (10x10), Extreme (20x20) concurrent users.' },
          { num: 3, title: 'View Performance Metrics', desc: 'Summary shows total tests, pass rate, average response time (ms), and throughput (executions/sec).' },
          { num: 4, title: 'Run Single Scenario', desc: 'Select a scenario → click "Run" to stress test that scenario with the default light profile.' },
          { num: 5, title: 'Run All Scenarios', desc: 'Click the "Run All" button with play icon to run stress tests on all scenarios with light profile.' },
        ],
      },
      {
        id: 'security',
        label: 'Security Test',
        icon: <Lock size={14} />,
        steps: [
          { num: 1, title: 'Mark for Security Testing', desc: 'Go to Scenarios → mark scenarios for security testing to scan for vulnerabilities.' },
          { num: 2, title: 'Choose Scan Type', desc: '3 scan types available: Full Scan (comprehensive), Quick Scan (fast), Custom (select specific checks).' },
          { num: 3, title: 'View Vulnerability Summary', desc: 'Shows total scans, avg risk score, count of critical/high/medium+low severity vulnerabilities.' },
          { num: 4, title: 'Start a Scan', desc: 'Select a scenario → choose scan type → click "Start Security Scan". View findings as they are discovered.' },
          { num: 5, title: 'Review Findings', desc: 'Filter findings by severity. Each finding shows vulnerability type, location, CVSS score, and remediation steps.' },
        ],
      },
      {
        id: 'tools',
        label: 'Tools',
        icon: <Zap size={14} />,
        steps: [
          { num: 1, title: 'Scheduler', desc: 'Go to Scheduler → set a cron schedule to run a scenario automatically at a specific time.' },
          { num: 2, title: 'Parallel Execution', desc: 'Run multiple scenarios simultaneously. Useful for regression testing across many tests.' },
          { num: 3, title: 'Browser Matrix', desc: 'Test one scenario across Chrome, Firefox, and Safari at the same time to catch browser-specific bugs.' },
          { num: 4, title: 'Analytics', desc: 'View pass/fail trends, execution time charts, and most-failed steps on the Analytics page.' },
          { num: 5, title: 'Reports', desc: 'Download test results as PDF or CSV from the Reports page for sharing with your team.' },
        ],
      },
      {
        id: 'tips',
        label: 'Tips',
        icon: <Clock size={14} />,
        steps: [
          { num: 1, title: 'Tooltips', desc: 'Hover any action button (View, Edit, Clone, Delete) to see a quick description of what it does.' },
          { num: 2, title: 'Headless Mode', desc: 'Enable Headless in browser selector for faster execution without opening a visible browser window.' },
          { num: 3, title: 'Export Reports', desc: 'Use Export buttons on Smoke/Stress/Security pages to download test results as PDF or Excel for analysis.' },
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
  const [activeTab, setActiveTab] = useState('scenario')

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id ?? 'scenario')
    }
  }, [activeTab, visibleTabs])

  const activeTabData = visibleTabs.find(t => t.id === activeTab) ?? visibleTabs[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl rounded-xl shadow-2xl overflow-hidden help-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 help-modal-header">
          <div>
            <h2 className="text-base font-semibold help-modal-title">{c.title}</h2>
            <p className="text-xs help-modal-subtitle mt-0.5">{c.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md help-modal-close transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pb-0 pt-1 help-modal-tabs-bar overflow-x-auto">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all
                ${activeTab === tab.id ? 'help-tab-active' : 'help-tab-inactive'}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Steps */}
        <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto help-modal-body">
          {activeTabData?.steps.map(step => (
            <div key={step.num} className="flex gap-3">
              <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold help-step-num">
                {step.num}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium help-step-title leading-snug">{step.title}</p>
                <p className="text-xs help-step-desc mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 flex items-center justify-between help-modal-footer">
          <p className="text-[11px] help-footer-text">
            Hover buttons for quick inline tooltips.
          </p>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-medium help-footer-btn transition-colors"
          >
            Got it
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
