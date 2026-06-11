import React, { useState } from 'react'
import { Shield, ChevronDown, ChevronUp } from 'lucide-react'
import Layout from '../components/Layout'

export default function SecurityTestHelpPage() {
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
            <Shield className="w-10 h-10 text-red-500" />
            <h1 className="text-4xl font-bold text-[#E0E0E2]">
              {t.title}
            </h1>
          </div>
          <p className="text-lg text-[#A0A0A4]">
            {t.description}
          </p>
        </div>

        {/* What is Security Test */}
        <div className="bg-[#1A1A1C] rounded-lg p-6 mb-6 border border-[#2D2D2F]">
          <h2 className="text-2xl font-bold text-red-500 mb-4">{t.whatIs}</h2>
          <p className="text-[#E0E0E2] leading-relaxed mb-4">
            {t.whatIsDesc}
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {t.whatIsTips.map((tip, idx) => (
              <div key={idx} className="flex gap-3 bg-[#2D2D2F] p-3 rounded">
                <span className="text-red-400 font-bold text-xl">🔒</span>
                <span className="text-[#A0A0A4]">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scan Types */}
        <div className="bg-[#1A1A1C] rounded-lg p-6 mb-6 border border-[#2D2D2F]">
          <h2 className="text-2xl font-bold text-red-500 mb-6">{t.scanTypes}</h2>
          <div className="space-y-4">
            {t.scanTypeDetails.map((scan, idx) => (
              <div key={idx} className="bg-[#2D2D2F] p-4 rounded border-l-4 border-red-500">
                <h3 className="font-bold text-[#E0E0E2] mb-2">{scan.name}</h3>
                <p className="text-sm text-[#A0A0A4] mb-2">{scan.coverage}</p>
                <p className="text-sm text-[#A0A0A4]">{scan.time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vulnerability Levels */}
        <div className="bg-[#1A1A1C] rounded-lg p-6 mb-6 border border-[#2D2D2F]">
          <h2 className="text-2xl font-bold text-red-500 mb-6">{t.vulnLevels}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {t.vulnDetails.map((vuln, idx) => (
              <div key={idx} className="bg-[#2D2D2F] p-4 rounded border-l-4" style={{ borderLeftColor: vuln.color }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: vuln.color }}></div>
                  <h3 className="font-bold text-[#E0E0E2]">{vuln.level}</h3>
                </div>
                <p className="text-sm text-[#A0A0A4]">{vuln.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step by Step */}
        <div className="bg-[#1A1A1C] rounded-lg p-6 mb-6 border border-[#2D2D2F]">
          <h2 className="text-2xl font-bold text-red-500 mb-6">{t.stepByStep}</h2>
          <div className="space-y-3">
            {t.steps.map((step, idx) => (
              <div key={idx} className="border-l-4 border-red-500 pl-4 py-2 bg-[#0F0E11] p-4 rounded-r">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
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
          <h2 className="text-2xl font-bold text-red-500 mb-6">{t.results}</h2>
          <div className="space-y-3">
            {t.resultDetails.map((result, idx) => (
              <div key={idx} className="bg-[#2D2D2F] p-4 rounded">
                <h3 className="font-semibold text-red-400 mb-2">{result.label}</h3>
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

        {/* Taking Action */}
        <div className="bg-[#1A1A1C] rounded-lg p-6 mb-6 border border-[#2D2D2F]">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">{t.action}</h2>
          <div className="space-y-3">
            {t.actionSteps.map((action, idx) => (
              <div key={idx} className="bg-[#2D2D2F] p-4 rounded flex gap-4">
                <span className="text-yellow-400 font-bold text-lg">{idx + 1}</span>
                <div>
                  <h3 className="font-semibold text-[#E0E0E2] mb-1">{action.title}</h3>
                  <p className="text-sm text-[#A0A0A4]">{action.description}</p>
                </div>
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
                    <ChevronUp className="w-5 h-5 text-red-400" />
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
    title: '🔐 Security Testing Guide',
    description: 'Learn how to scan your application for security vulnerabilities and protect against threats',
    whatIs: 'What is a Security Test?',
    whatIsDesc: `A Security Test scans your application for potential vulnerabilities and security weaknesses. It automatically detects common security issues like SQL injection, cross-site scripting (XSS), authentication flaws, and configuration issues. This helps you identify and fix security problems before attackers can exploit them.`,
    whatIsTips: [
      'Detects common vulnerability types (SQL injection, XSS, etc.)',
      'Identifies authentication and authorization flaws',
      'Checks for insecure configurations',
      'Reports severity levels (Critical, High, Medium, Low)'
    ],
    scanTypes: 'Scan Types Available',
    scanTypeDetails: [
      { name: '🟢 Quick Scan', coverage: 'Coverage: Basic vulnerability checks', time: 'Duration: ~2-5 minutes' },
      { name: '🟡 Standard Scan', coverage: 'Coverage: Common vulnerabilities + deep checks', time: 'Duration: ~10-15 minutes' },
      { name: '🔴 Full Scan', coverage: 'Coverage: All vulnerability types + performance checks', time: 'Duration: ~30+ minutes' },
      { name: '⚙️ Custom Scan', coverage: 'Coverage: Select specific checks', time: 'Duration: Depends on selection' }
    ],
    vulnLevels: 'Vulnerability Severity Levels',
    vulnDetails: [
      { level: '🔴 Critical', color: '#EF4444', description: 'Immediate action required. Exploitation is likely and impact is severe.' },
      { level: '🟠 High', color: '#F97316', description: 'Should be fixed soon. Exploitation is possible with significant impact.' },
      { level: '🟡 Medium', color: '#EAB308', description: 'Should be addressed. Exploitation is possible but impact is limited.' },
      { level: '🔵 Low', color: '#3B82F6', description: 'Can be reviewed. Exploitation is difficult or impact is minimal.' }
    ],
    stepByStep: 'How to Run a Security Test',
    steps: [
      { number: 1, title: 'Navigate to Security Test', description: 'Click "Keamanan" in the left sidebar under "Tools" section' },
      { number: 2, title: 'Select Target Application', description: 'Choose the application or service you want to scan for vulnerabilities' },
      { number: 3, title: 'Choose Scan Type', description: 'Select Quick, Standard, Full, or Custom scan type based on your needs' },
      { number: 4, title: 'For Custom Scan', description: 'Select specific vulnerability types to check: SQL Injection, XSS, CSRF, etc.' },
      { number: 5, title: 'Configure Scan Settings', description: 'Adjust timeout, request rate, and other parameters if needed' },
      { number: 6, title: 'Start Security Scan', description: 'Click "Mulai Scanning" button. Scan will run and test for vulnerabilities' },
      { number: 7, title: 'Monitor Scan Progress', description: 'Watch as scan runs through different check categories and endpoints' },
      { number: 8, title: 'Review Found Issues', description: 'As vulnerabilities are found, they appear in real-time with severity levels' },
      { number: 9, title: 'Analyze Full Report', description: 'After completion, review detailed report with findings, impact, and recommendations' },
      { number: 10, title: 'Take Action', description: 'Fix vulnerabilities starting with Critical and High severity issues' }
    ],
    results: 'Understanding Scan Results',
    resultDetails: [
      { label: 'Vulnerability Name', description: 'The type of vulnerability found (e.g., SQL Injection, XSS, Missing Authentication)' },
      { label: 'Severity Level', description: 'Critical, High, Medium, or Low - indicates how serious the issue is' },
      { label: 'CVSS Score', description: 'Common Vulnerability Scoring System score (0-10) - higher means more severe' },
      { label: 'Affected Endpoint', description: 'Which API endpoint or page is vulnerable' },
      { label: 'Description', description: 'Explanation of what the vulnerability is and why it matters' },
      { label: 'Recommendation', description: 'Suggested fix or remediation steps to address the issue' }
    ],
    bestPractices: 'Best Practices',
    practices: [
      'Run security scans regularly - at least before each major release',
      'Start with Quick scans during development, Full scans before production',
      'Address Critical and High severity issues immediately',
      'Keep your framework and dependencies up to date',
      'Use Web Application Firewall (WAF) as additional protection',
      'Implement secure authentication (OAuth2, JWT properly configured)',
      'Validate and sanitize all user inputs',
      'Use HTTPS for all communications',
      'Keep secrets and API keys out of source code',
      'Document and track all security issues and fixes'
    ],
    action: 'When Vulnerabilities Are Found',
    actionSteps: [
      { title: 'Step 1: Prioritize', description: 'Sort by severity. Fix Critical issues first, then High, then Medium' },
      { title: 'Step 2: Understand', description: 'Read the description and CVSS score to understand the impact' },
      { title: 'Step 3: Investigate', description: 'Identify the root cause in your code - don\'t just patch symptoms' },
      { title: 'Step 4: Fix', description: 'Implement the recommended fix. Follow security best practices' },
      { title: 'Step 5: Test', description: 'Run the security scan again to confirm the issue is resolved' },
      { title: 'Step 6: Document', description: 'Log the issue and fix in your security tracking system' }
    ],
    troubleshooting: 'Troubleshooting',
    issues: [
      {
        problem: 'Scan fails or times out',
        solution: 'Try Quick scan instead of Full scan. Check that application is accessible and responding. Increase timeout in settings.'
      },
      {
        problem: 'False positives reported',
        solution: 'Review findings carefully and validate in your code. Some findings might be false positives - use developer expertise to confirm.'
      },
      {
        problem: 'Too many issues found',
        solution: 'Filter by severity and focus on Critical/High first. Create action plan and fix systematically. Not all issues need immediate fixing.'
      },
      {
        problem: 'Same issue keeps appearing',
        solution: 'Ensure fix was deployed correctly. Clear caches. Verify the issue is actually fixed before re-running scan.'
      }
    ]
  
}
