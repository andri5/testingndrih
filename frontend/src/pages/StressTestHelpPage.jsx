import React, { useState } from 'react'
import { Gauge, ChevronDown, ChevronUp } from 'lucide-react'
import Layout from '../components/Layout'

export default function StressTestHelpPage() {
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
            <Gauge className="w-10 h-10 text-purple-500" />
            <h1 className="text-4xl font-bold text-[#E0E0E2]">
              {t.title}
            </h1>
          </div>
          <p className="text-lg text-[#A0A0A4]">
            {t.description}
          </p>
        </div>

        {/* What is Stress Test */}
        <div className="bg-[#1A1A1C] rounded-lg p-6 mb-6 border border-[#2D2D2F]">
          <h2 className="text-2xl font-bold text-purple-500 mb-4">{t.whatIs}</h2>
          <p className="text-[#E0E0E2] leading-relaxed mb-4">
            {t.whatIsDesc}
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {t.whatIsTips.map((tip, idx) => (
              <div key={idx} className="flex gap-3 bg-[#2D2D2F] p-3 rounded">
                <span className="text-purple-400 font-bold text-xl">•</span>
                <span className="text-[#A0A0A4]">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Load Profiles */}
        <div className="bg-[#1A1A1C] rounded-lg p-6 mb-6 border border-[#2D2D2F]">
          <h2 className="text-2xl font-bold text-purple-500 mb-6">{t.profiles}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {t.profileDetails.map((profile, idx) => (
              <div key={idx} className="bg-[#2D2D2F] p-4 rounded border-l-4 border-purple-500">
                <h3 className="font-bold text-[#E0E0E2] mb-2">{profile.name}</h3>
                <p className="text-sm text-[#A0A0A4] mb-2">{profile.users}</p>
                <p className="text-sm text-[#A0A0A4]">{profile.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step by Step */}
        <div className="bg-[#1A1A1C] rounded-lg p-6 mb-6 border border-[#2D2D2F]">
          <h2 className="text-2xl font-bold text-purple-500 mb-6">{t.stepByStep}</h2>
          <div className="space-y-3">
            {t.steps.map((step, idx) => (
              <div key={idx} className="border-l-4 border-purple-500 pl-4 py-2 bg-[#0F0E11] p-4 rounded-r">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
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

        {/* Understanding Metrics */}
        <div className="bg-[#1A1A1C] rounded-lg p-6 mb-6 border border-[#2D2D2F]">
          <h2 className="text-2xl font-bold text-purple-500 mb-6">{t.metrics}</h2>
          <div className="space-y-3">
            {t.metricDetails.map((metric, idx) => (
              <div key={idx} className="bg-[#2D2D2F] p-4 rounded">
                <h3 className="font-semibold text-purple-400 mb-2">{metric.label}</h3>
                <p className="text-[#A0A0A4] text-sm">
                  {metric.description}
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
                    <ChevronUp className="w-5 h-5 text-purple-400" />
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
    title: '⚡ Stress Tests Guide',
    description: 'Learn how to test your application under high load and concurrent traffic',
    whatIs: 'What is a Stress Test?',
    whatIsDesc: `A Stress Test evaluates how your application performs under high load and concurrent users. It simulates many users accessing your application simultaneously to identify performance bottlenecks, maximum capacity, and stability limits. This helps you understand how your system behaves when pushed to its limits.`,
    whatIsTips: [
      'Tests with hundreds to thousands of concurrent requests',
      'Measures response time and error rates',
      'Identifies breaking points and capacity limits',
      'Essential before major releases or traffic spikes'
    ],
    profiles: 'Load Profiles Available',
    profileDetails: [
      { name: '🟢 Light Profile', users: 'Concurrency: 10 users', time: 'Time: ~1 minute' },
      { name: '🟡 Medium Profile', users: 'Concurrency: 50 users', time: 'Time: ~5 minutes' },
      { name: '🔴 Heavy Profile', users: 'Concurrency: 100 users', time: 'Time: ~10 minutes' },
      { name: '⚫ Custom Profile', users: 'Define your own users', time: 'Flexible duration' }
    ],
    stepByStep: 'How to Run a Stress Test',
    steps: [
      { number: 1, title: 'Navigate to Stress Test', description: 'Click "Test Beban" in the left sidebar under "Tools" section' },
      { number: 2, title: 'Select a Scenario', description: 'Choose from available scenarios. Each scenario represents a workflow to be stress tested' },
      { number: 3, title: 'Choose Load Profile', description: 'Select Light, Medium, Heavy, or Custom profile. Start with Light and gradually increase' },
      { number: 4, title: 'For Custom Profile', description: 'Enter concurrency (simultaneous users) and iterations (repeats per user) for custom load configuration' },
      { number: 5, title: 'Review Target Details', description: 'Verify the target application URL and test endpoints before starting' },
      { number: 6, title: 'Start Stress Test', description: 'Click the purple "Jalankan Test Beban" button. This may take several minutes depending on profile' },
      { number: 7, title: 'Monitor Live Metrics', description: 'Watch real-time metrics: current load, response times (min/max/avg), error rate, and current phase' },
      { number: 8, title: 'View Final Report', description: 'After completion, review total requests, success/failure counts, average response time, and peak response time' },
      { number: 9, title: 'Analyze & Compare', description: 'Check if response times are acceptable and error rate is low. Compare with previous runs to identify regressions' }
    ],
    metrics: 'Key Metrics Explained',
    metricDetails: [
      { label: 'Load (X × Y)', description: 'X concurrent users with Y iterations each. Total requests = X × Y' },
      { label: 'Duration', description: 'Total test execution time (includes ramp-up, steady state, and cool-down phases)' },
      { label: 'Avg Response Time', description: 'Average time for all requests. Should be consistent for good performance' },
      { label: 'Peak Response Time', description: 'Maximum response time observed. Shows worst-case latency' },
      { label: 'Error Rate', description: 'Percentage of failed requests. Ideally should be 0% or very low' },
      { label: 'Throughput', description: 'Requests per second. Shows how many requests your system can handle' }
    ],
    bestPractices: 'Best Practices',
    practices: [
      'Start with Light profile and gradually increase load',
      'Run stress tests during off-peak hours',
      'Establish baseline metrics with initial tests',
      'Run tests multiple times for consistency',
      'Monitor system resources (CPU, memory, disk) during testing',
      'Identify when performance degrades significantly',
      'Document capacity limits and share with team',
      'Test critical paths and high-traffic endpoints',
      'Run tests in isolated environment before production',
      'Use results to optimize infrastructure'
    ],
    troubleshooting: 'Troubleshooting',
    issues: [
      {
        problem: 'Test fails immediately',
        solution: 'Check target application is running and accessible. Verify endpoints are correct and not blocked by firewall.'
      },
      {
        problem: 'High error rates',
        solution: 'Application may be overloaded. Try Light profile first, then gradually increase load. Check server logs for details.'
      },
      {
        problem: 'Inconsistent results',
        solution: 'Run multiple tests to get average results. External factors may affect results. Try isolating test environment.'
      },
      {
        problem: 'Test timeout',
        solution: 'Reduce load parameters or increase timeout in settings. Very heavy loads may take longer to complete.'
      }
    ]
  
}

