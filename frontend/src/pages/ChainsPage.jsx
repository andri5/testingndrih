/**
 * ChainsPage - List and manage test chains
 */

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../store/settingsStore'
import Layout from '../components/Layout'
import { chainAPI } from '../services/api'
import { Plus, Trash2, Edit, Play, Clock } from 'lucide-react'

export default function ChainsPage() {
  const navigate = useNavigate()
  const { theme, language } = useSettingsStore()
  const isDark = theme !== 'light'
  const [chains, setChains] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [limit] = useState(10)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    fetchChains()
  }, [page, limit])

  async function fetchChains() {
    setLoading(true)
    setError(null)
    try {
      const response = await chainAPI.getAll(limit, page * limit)
      setChains(response.data.chains)
      setTotal(response.data.total)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load chains')
      setChains([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(chainId) {
    if (!window.confirm('Are you sure you want to delete this chain?')) {
      return
    }

    setDeleting(chainId)
    try {
      await chainAPI.delete(chainId)
      setChains(chains.filter(c => c.id !== chainId))
      setTotal(total - 1)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete chain')
    } finally {
      setDeleting(null)
    }
  }

  const i18n = {
    en: {
      title: 'Test Chains',
      description: 'Link and execute scenarios in sequence',
      createChain: 'Create Chain',
      createFirst: 'Create your first chain',
      noChains: 'No chains yet',
      noChainsDesc: 'Create a chain to link scenarios together',
      name: 'Name', steps: 'Steps', status: 'Status',
      executions: 'Executions', created: 'Created', actions: 'Actions',
      active: 'Active', inactive: 'Inactive',
      previous: 'Previous', next: 'Next',
      showing: 'Showing', of: 'of', page: 'Page',
      loading: 'Loading chains...'
    },
    id: {
      title: 'Test Chains',
      description: 'Hubungkan dan jalankan skenario secara berurutan',
      createChain: 'Buat Chain',
      createFirst: 'Buat chain pertama Anda',
      noChains: 'Belum ada chain',
      noChainsDesc: 'Buat chain untuk menghubungkan skenario',
      name: 'Nama', steps: 'Langkah', status: 'Status',
      executions: 'Eksekusi', created: 'Dibuat', actions: 'Aksi',
      active: 'Aktif', inactive: 'Tidak Aktif',
      previous: 'Sebelumnya', next: 'Berikutnya',
      showing: 'Menampilkan', of: 'dari', page: 'Halaman',
      loading: 'Memuat chains...'
    }
  }
  const t = i18n[language] || i18n.en

  const totalPages = Math.ceil(total / limit)

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t.title}
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{t.description}</p>
          </div>
          <Link
            to="/chains/new"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            <Plus size={20} />
            {t.createChain}
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500 text-red-500 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.loading}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && chains.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-6 text-6xl">🔗</div>
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.noChains}</h2>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.noChainsDesc}</p>
            <Link
              to="/chains/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              <Plus size={20} />
              {t.createFirst}
            </Link>
          </div>
        )}

        {/* Chains Table */}
        {!loading && chains.length > 0 && (
          <div className={`border rounded-lg overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <table className="w-full">
              <thead className={`border-b ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <tr>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t.name}</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t.steps}</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t.status}</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t.executions}</th>
                  <th className={`px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t.created}</th>
                  <th className={`px-6 py-4 text-right text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t.actions}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                {chains.map((chain) => (
                  <tr key={chain.id} className={`transition ${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <Link
                        to={`/chains/${chain.id}`}
                        className="text-blue-500 hover:text-blue-400 font-medium"
                      >
                        {chain.name}
                      </Link>
                    </td>
                    <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{chain.steps}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        chain.isActive
                          ? 'bg-green-500/20 text-green-500'
                          : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {chain.isActive ? t.active : t.inactive}
                      </span>
                    </td>
                    <td className={`px-6 py-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{chain._count?.chainExecutions || 0}</td>
                    <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(chain.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/chains/${chain.id}`}
                          className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`}
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => navigate(`/chains/${chain.id}/execute`)}
                          className="p-2 hover:bg-green-600/30 rounded-lg text-green-500 hover:text-green-400 transition"
                          title="Execute"
                        >
                          <Play size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(chain.id)}
                          disabled={deleting === chain.id}
                          className="p-2 hover:bg-red-600/30 rounded-lg text-red-500 hover:text-red-400 transition disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`px-6 py-4 border-t flex items-center justify-between ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t.showing} {page * limit + 1} — {Math.min((page + 1) * limit, total)} {t.of} {total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className={`px-3 py-2 disabled:opacity-50 rounded-lg transition ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'}`}
                  >
                    {t.previous}
                  </button>
                  <span className={`px-3 py-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {t.page} {page + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className={`px-3 py-2 disabled:opacity-50 rounded-lg transition ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'}`}
                  >
                    {t.next}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
