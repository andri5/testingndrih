import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { analyticsAPI } from '../services/api'
import toast from 'react-hot-toast'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Calendar, Zap, Activity } from 'lucide-react'

const COLORS = {
  passed: '#34D399',
  failed: '#F87171',
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const summaryRes = await analyticsAPI.getSummary()
      setSummary(summaryRes.data)
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const pieData = useMemo(() => {
    if (!summary) return []
    const passed = Number(summary.passedExecutions) || 0
    const failed = Number(summary.failedExecutions) || 0
    return [
      { name: 'Passed', value: passed, key: 'passed' },
      { name: 'Failed', value: failed, key: 'failed' },
    ].filter((d) => d.value > 0)
  }, [summary])

  const formatDuration = (ms) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  if (loading && !summary) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-2 border-[rgba(255,255,255,0.08)] border-t-[#0F766E] animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-[#E0E0E2] flex items-center gap-2">
            <TrendingUp size={24} className="text-[#0F766E]" />
            Test Analytics Dashboard
          </h1>
          <p className="text-[#8A8A8F] mt-1">Ringkasan hasil eksekusi — pass vs fail</p>
        </div>

        {summary && (
          <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="linear-card stat-cyan p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">Total Executions</p>
                  <p className="text-3xl font-bold text-[#E0E0E2] mt-2">{summary.totalExecutions}</p>
                  <p className="text-xs text-[#8A8A8F] mt-2">
                    Last 7 days: {summary.last7Days?.executions || 0}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#4EC9B0]/10 flex items-center justify-center">
                  <Zap size={18} className="text-[#4EC9B0]" />
                </div>
              </div>
            </div>

            <div className="linear-card stat-green p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">Overall Pass Rate</p>
                  <p className="text-3xl font-bold text-[#34D399] mt-2">{summary.passRate}%</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#34D399]/10 flex items-center justify-center">
                  <TrendingUp size={18} className="text-[#34D399]" />
                </div>
              </div>
            </div>

            <div className="linear-card stat-amber p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">Avg Duration</p>
                  <p className="text-3xl font-bold text-[#FBBF24] mt-2">{formatDuration(summary.avgDuration)}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#FBBF24]/10 flex items-center justify-center">
                  <Calendar size={18} className="text-[#FBBF24]" />
                </div>
              </div>
            </div>

            <div className="linear-card stat-violet p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[#8A8A8F] font-medium uppercase tracking-wider">Total Scenarios</p>
                  <p className="text-3xl font-bold text-[#0F766E] mt-2">{summary.totalScenarios}</p>
                  <p className="text-xs text-[#8A8A8F] mt-2">Under test</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#0F766E]/10 flex items-center justify-center">
                  <Activity size={18} className="text-[#0F766E]" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="linear-card p-6 max-w-3xl mx-auto">
          <h3 className="text-lg font-bold text-[#E0E0E2] mb-4 text-center">Pass / Fail Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={360}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1C1C2E',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: '#E0E0E2' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-[#8A8A8F]">No data available</div>
          )}
          {summary && (
            <div className="flex justify-center gap-6 mt-2 text-sm">
              <span className="text-[#34D399] font-semibold">Passed: {summary.passedExecutions ?? 0}</span>
              <span className="text-[#F87171] font-semibold">Failed: {summary.failedExecutions ?? 0}</span>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
