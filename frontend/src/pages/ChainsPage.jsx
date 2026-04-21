/**
 * ChainsPage - List and manage test chains
 */

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { chainAPI } from '../services/api'
import { Plus, Trash2, Edit, Play, Clock } from 'lucide-react'

export default function ChainsPage() {
  const navigate = useNavigate()
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

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Test Chains</h1>
            <p className="text-slate-400">Link and execute scenarios in sequence</p>
          </div>
          <Link
            to="/chains/new"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            <Plus size={20} />
            Create Chain
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-600 text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && chains.length === 0 && (
          <div className="text-center py-16">
            <div className="text-slate-400 mb-6 text-6xl">🔗</div>
            <h2 className="text-2xl font-bold text-white mb-2">No chains yet</h2>
            <p className="text-slate-400 mb-6">Create a chain to link scenarios together</p>
            <Link
              to="/chains/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              <Plus size={20} />
              Create your first chain
            </Link>
          </div>
        )}

        {/* Chains Table */}
        {!loading && chains.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Steps</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Executions</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Created</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {chains.map((chain) => (
                  <tr key={chain.id} className="hover:bg-slate-700/30 transition">
                    <td className="px-6 py-4">
                      <Link
                        to={`/chains/${chain.id}`}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        {chain.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{chain.steps}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        chain.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-slate-600/50 text-slate-400'
                      }`}>
                        {chain.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{chain._count?.chainExecutions || 0}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(chain.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/chains/${chain.id}`}
                          className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => navigate(`/chains/${chain.id}/execute`)}
                          className="p-2 hover:bg-green-600/30 rounded-lg text-green-400 hover:text-green-300 transition"
                          title="Execute"
                        >
                          <Play size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(chain.id)}
                          disabled={deleting === chain.id}
                          className="p-2 hover:bg-red-600/30 rounded-lg text-red-400 hover:text-red-300 transition disabled:opacity-50"
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
              <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-slate-300">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white rounded-lg transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-slate-400 mt-4">Loading chains...</p>
          </div>
        )}
      </div>
    </div>
  )
}
