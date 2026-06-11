import React, { useState } from 'react'
import { Zap, ChevronDown, ChevronUp } from 'lucide-react'
import Layout from '../components/Layout'

export default function SmokeTestHelpPage() {
  const [expandedSections, setExpandedSections] = useState({})  
  const t = translations

  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-10 h-10 text-orange-500" />
            <h1 className="text-4xl font-bold text-[#E0E0E2]">
              {t.title}
            </h1>
          </div>
          <p className="text-lg text-[#A0A0A4]">
            {t.description}
          </p>
        </div>

        {/* What is Smoke Test */}
        <div className="bg-[#1A1A1C] rounded-lg p-6 mb-6 border border-[#2D2D2F]">
          <h2 className="text-2xl font-bold text-orange-500 mb-4">{t.whatIs}</h2>
          <p className="text-[#E0E0E2] leading-relaxed mb-4">
            {t.whatIsDesc}
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {t.whatIsTips.map((tip, idx) => (
              <div key={idx} className="flex gap-3 bg-[#2D2D2F] p-3 rounded">
                <span className="text-orange-400 font-bold text-xl">•</span>
                <span className="text-[#A0A0A4]">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step by Step */}
        <div className="bg-[#1A1A1C] rounded-lg p-6 mb-6 border border-[#2D2D2F]">
          <h2 className="text-2xl font-bold text-orange-500 mb-6">{t.stepByStep}</h2>
          <div className="space-y-3">
            {t.steps.map((step, idx) => (
              <div key={idx} className="border-l-4 border-orange-500 pl-4 py-2 bg-[#0F0E11] p-4 rounded-r">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-[#E0E0E2]">
                    {step.title}
                  </h3>
                </div>
                <p className="text-[#A0A0A4] text-sm ml-11">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Understanding Results */}
        <div className="bg-[#1A1A1C] rounded-lg p-6 mb-6 border border-[#2D2D2F]">
          <h2 className="text-2xl font-bold text-orange-500 mb-6">{t.understanding}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {t.results.map((result, idx) => (
              <div key={idx} className="bg-[#2D2D2F] p-4 rounded">
                <h3 className="font-semibold text-orange-400 mb-2">{result.label}</h3>
                <p className="text-[#A0A0A4] text-sm">
                  {result.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-[#1A1A1C] rounded-lg p-6 mb-6 border border-[#2D2D2F]">
          <h2 className="text-2xl font-bold text-green-400 mb-6">{t.bestPractices}</h2>
          <div className="space-y-2">
            {t.practices.map((practice, idx) => (
              <div key={idx} className="flex gap-3 text-[#A0A0A4]">
                <span className="text-green-400 font-bold">✓</span>
                <span>{practice}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="bg-[#1A1A1C] rounded-lg p-6 border border-[#2D2D2F]">
          <h2 className="text-2xl font-bold text-red-400 mb-6">{t.troubleshooting}</h2>
          <div className="space-y-3">
            {t.issues.map((issue, idx) => (
              <div
                key={idx}
                className="bg-[#2D2D2F] rounded cursor-pointer hover:bg-[#3D3D3F] transition-colors"
              >
                <button
                  onClick={() => toggleSection(`issue-${idx}`)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <span className="font-semibold text-[#E0E0E2] text-left">
                    ❓ {issue.problem}
                  </span>
                  {expandedSections[`issue-${idx}`] ? (
                    <ChevronUp className="w-5 h-5 text-orange-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#8A8A8F]" />
                  )}
                </button>
                {expandedSections[`issue-${idx}`] && (
                  <div className="px-4 pb-4 border-t border-[#3D3D3F]">
                    <p className="text-[#A0A0A4]">
                      <span className="font-semibold text-green-400">💡 Solution:</span> {issue.solution}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

const translations = {
    title: '💨 Smoke Tests Guide',
    description: 'Learn how to quickly validate your application core functionality',
    whatIs: 'What is a Smoke Test?',
    whatIsDesc: `A Smoke Test is a quick automated test that validates the core functionality of your application. It runs critical business flows to ensure basic features are working correctly. It's called "smoke test" because if there's critical functionality broken, it "smokes" (fails immediately).`,
    whatIsTips: [
      'Typically runs in 2-5 minutes',
      'Tests only critical user flows',
      'Perfect for quick validation after deployment',
      'Ideal for CI/CD pipelines'
    ],
    stepByStep: 'How to Run a Smoke Test',
    steps: [
      { number: 1, title: "Navigate to Smoke Test", description: "Click \"Test Asap\" in the left sidebar under \"Tools\" section" },
      { number: 2, title: "View Available Scenarios", description: "You'll see a list of pre-configured smoke test scenarios representing critical user flows" },
      { number: 3, title: "Select a Scenario", description: "Click any scenario to select it. The selected scenario will be highlighted with a light background" },
      { number: 4, title: "Review Details", description: "The panel shows detailed information about what will be tested, including target URL and test steps" },
      { number: 5, title: "Optional - Enable Notifications", description: "Check \"Kirim notifikasi email\" if you want email notifications when the test completes" },
      { number: 6, title: "Start Test", description: "Click the orange \"Mulai Pengujian Smoke\" button to begin. The button shows a loading spinner while running" },
      { number: 7, title: "Monitor Progress", description: "Watch the test progress in real-time. The interface shows which step is executing and test status" },
      { number: 8, title: "View Results", description: "After completion, results appear showing: passed/failed steps, duration, and timestamp. Green = PASSED, Red = FAILED" },
      { number: 9, title: "Run All Tests", description: "Click \"Jalankan Semua Pengujian Smoke\" to run all smoke tests sequentially" }
    ],
    understanding: 'Understanding Test Results',
    results: [
      { label: 'Status Badge', description: 'Shows BERHASIL (PASSED) in green or GAGAL (FAILED) in red' },
      { label: 'Steps Passed', description: 'Shows "X/Y steps" - how many passed out of total' },
      { label: 'Duration', description: 'Total time the test took to complete in seconds' },
      { label: 'Timestamp', description: 'When the test was executed' }
    ],
    bestPractices: 'Best Practices',
    practices: [
      'Run smoke tests after every deployment',
      'Keep smoke test scenarios simple and fast',
      'Test only the most critical user flows',
      'Run them regularly in your CI/CD pipeline',
      'Monitor test history to catch regressions early',
      'Update scenarios when critical flows change',
      'Set up email notifications for failed tests'
    ],
    troubleshooting: 'Troubleshooting',
    issues: [
      {
        problem: 'Test keeps failing',
        solution: 'Check if the target application is running and accessible. Verify the application URL in scenario details.'
      },
      {
        problem: 'Test timeout errors',
        solution: 'The application might be slow. Increase the execution timeout in Settings > Pengaturan Eksekusi'
      },
      {
        problem: 'Test runs but steps fail',
        solution: 'The application UI might have changed. Click the scenario to view steps and verify selectors are correct'
      },
      {
        problem: 'Email notifications not received',
        solution: 'Verify email is configured in the backend. Notifications are only sent if email service is properly set up'
      }
    ]
  
}
