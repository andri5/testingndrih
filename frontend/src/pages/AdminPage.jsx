import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import IntegrationsSettings from '../components/IntegrationsSettings'
import UserManagement from '../components/UserManagement'
import AdminMenuAccess from '../components/AdminMenuAccess'
import UserActivityLog from '../components/UserActivityLog'
import SiteAnalytics from '../components/SiteAnalytics'
import LandingFeedbackAdmin from '../components/landing/LandingFeedbackAdmin'
import apiClient from '../services/api'

const cardCls = 'bg-[#1A1A1C] border border-[#2D2D2F] rounded-xl p-6'
const sectionTitleCls = 'text-sm font-semibold text-[#E0E0E2] uppercase tracking-wider mb-4'

const TABS = [
  { id: 'users', label: 'Users' },
  { id: 'menus', label: 'Menus' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'activity', label: 'Activity' },
  { id: 'security', label: 'Security' },
  { id: 'site', label: 'Site' },
]

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const initial = TABS.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'users'
  const [activeTab, setActiveTab] = useState(initial)
  const [securitySummary, setSecuritySummary] = useState(null)

  useEffect(() => {
    const next = TABS.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'users'
    setActiveTab(next)
  }, [tabFromUrl])

  useEffect(() => {
    if (activeTab !== 'security') return
    let cancelled = false
    ;(async () => {
      try {
        const res = await apiClient.get('/security/summary')
        if (!cancelled) setSecuritySummary(res.data.data)
      } catch {
        if (!cancelled) setSecuritySummary(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeTab])

  const selectTab = (id) => {
    setActiveTab(id)
    setSearchParams(id === 'users' ? {} : { tab: id })
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-xl font-semibold text-[#E0E0E2]">Admin</h1>
          <p className="text-sm text-[#666] mt-0.5">
            Users, menus, integrations, OWASP security, and site tools — separate from personal Settings.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-44 md:shrink-0">
            <div className="flex md:flex-col gap-1 flex-wrap">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => selectTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                    activeTab === tab.id
                      ? 'bg-[#0F766E]/15 text-[#0F766E] font-medium'
                      : 'text-[#A0A0A4] hover:text-[#E0E0E2] hover:bg-[#1A1A1C]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-4 min-w-0">
            {activeTab === 'users' && (
              <div className={cardCls}>
                <p className={sectionTitleCls}>User management</p>
                <p className="text-sm text-[#666] mb-4">
                  View, add, edit, and delete registered users.
                </p>
                <UserManagement />
              </div>
            )}

            {activeTab === 'menus' && (
              <div className={cardCls}>
                <p className={sectionTitleCls}>Menu access</p>
                <p className="text-sm text-[#666] mb-4">
                  Enable or disable sidebar menus per role / user.
                </p>
                <AdminMenuAccess />
              </div>
            )}

            {activeTab === 'integrations' && <IntegrationsSettings />}

            {activeTab === 'activity' && (
              <div className={cardCls}>
                <p className={sectionTitleCls}>User activity</p>
                <p className="text-sm text-[#666] mb-4">
                  Monitor what USER accounts are doing and their latest actions.
                </p>
                <UserActivityLog />
              </div>
            )}

            {activeTab === 'security' && (
              <div className={cardCls}>
                <p className={sectionTitleCls}>Security</p>
                <p className="text-sm text-[#666] mb-4">
                  OWASP Top 10 scans and findings live under Tools → Security Test.
                  Tab ini hanya ringkasan cepat.
                </p>
                {securitySummary ? (
                  <p className="text-sm text-[#A0A0A4] mb-4">
                    Scans: {securitySummary.totalScans || 0} · Critical:{' '}
                    {securitySummary.criticalFindings || 0} · High:{' '}
                    {securitySummary.highFindings || 0}
                  </p>
                ) : (
                  <p className="text-sm text-[#666] mb-4">Belum ada scan untuk akun ini.</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/security-test"
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-[#0F766E]/15 text-[#0F766E] hover:bg-[#0F766E]/25"
                  >
                    Buka Security Test
                  </Link>
                  <a
                    href="https://owasp.org/Top10/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-[#A0A0A4] border border-[#2D2D2F] hover:text-[#E0E0E2]"
                  >
                    owasp.org/Top10
                  </a>
                </div>
              </div>
            )}

            {activeTab === 'site' && (
              <div className="space-y-4">
                <div className={cardCls}>
                  <p className={sectionTitleCls}>Web analytics</p>
                  <p className="text-sm text-[#666] mb-4">
                    Public site visits and landing page feedback.
                  </p>
                  <SiteAnalytics />
                </div>
                <div className={cardCls}>
                  <LandingFeedbackAdmin />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
