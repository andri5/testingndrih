import React, { useState } from 'react'
import apiClient from '../../services/api'
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

const i18n = {
    affectedUrl: 'Affected URL',
    affectedParameter: 'Affected Parameter',
    payload: 'Attack Payload',
    evidence: 'Evidence',
    remediation: 'Remediation',
    owasp: 'OWASP Category',
    acknowledge: 'Acknowledge',
    markFixed: 'Mark Fixed',
    falsePositive: 'False Positive',
  
}

export default function SecurityFindings({ findings }) {
  const [expandedIds, setExpandedIds] = useState([])  const t = i18n

  const toggleExpand = (id) => {
    setExpandedIds(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    )
  }

  const handleStatusUpdate = async (findingId, status) => {
    try {
      await apiClient.post(`/security/findings/${findingId}/status`, {
        status,
        notes: `Updated to ${status} at ${new Date().toLocaleString()}`
      })
      // Reload findings would go here
      alert(`Finding marked as ${status}`)
    } catch (err) {
      console.error('Failed to update finding status:', err)
    }
  }

  const getSeverityColor = (severity) => {
    const colors = {
      CRITICAL: { bg: 'bg-red-50 dark:bg-red-900', border: 'border-red-200 dark:border-red-700', text: 'text-red-700 dark:text-red-200', badge: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-100' },
      HIGH: { bg: 'bg-orange-50 dark:bg-orange-900', border: 'border-orange-200 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-200', badge: 'bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-100' },
      MEDIUM: { bg: 'bg-yellow-50 dark:bg-yellow-900', border: 'border-yellow-200 dark:border-yellow-700', text: 'text-yellow-700 dark:text-yellow-200', badge: 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100' },
      LOW: { bg: 'bg-blue-50 dark:bg-blue-900', border: 'border-blue-200 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-200', badge: 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100' },
      INFO: { bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', text: 'text-gray-700 dark:text-gray-200', badge: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100' }
    }
    return colors[severity] || colors.INFO
  }

  const getCVSSColor = (score) => {
    if (score >= 9.0) return 'text-red-600 dark:text-red-400'
    if (score >= 7.0) return 'text-orange-600 dark:text-orange-400'
    if (score >= 4.0) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-blue-600 dark:text-blue-400'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'FIXED':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'FALSE_POSITIVE':
        return <XCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      case 'ACKNOWLEDGED':
        return <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
      default:
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
    }
  }

  return (
    <div className="space-y-3">
      {findings.map((finding, index) => {
        const isExpanded = expandedIds.includes(finding.id)
        const colors = getSeverityColor(finding.severity)

        return (
          <div
            key={finding.id}
            className={`border rounded-lg overflow-hidden transition-all ${colors.border} ${colors.bg}`}
          >
            {/* Header */}
            <button
              onClick={() => toggleExpand(finding.id)}
              className="w-full p-4 flex items-start justify-between hover:opacity-80 transition-opacity text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white break-words">{finding.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{finding.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${colors.badge}`}>
                    {finding.severity}
                  </span>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold whitespace-nowrap bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100`}>
                    CVSS {finding.cvssScore}
                  </span>
                  <span className="inline-block text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                    {finding.type}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                {getStatusIcon(finding.status)}
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </div>
            </button>

            {/* Details */}
            {isExpanded && (
              <div className={`border-t ${colors.border} px-4 py-4 space-y-4 bg-white dark:bg-gray-800 overflow-auto max-h-96`}>
                {/* Affected URL */}
                {finding.affectedUrl && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.affectedUrl}</label>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded overflow-x-auto">
                      {finding.affectedUrl}
                    </p>
                  </div>
                )}

                {/* Affected Parameter */}
                {finding.affectedParameter && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.affectedParameter}</label>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      {finding.affectedParameter}
                    </p>
                  </div>
                )}

                {/* Payload */}
                {finding.payload && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.payload}</label>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded overflow-x-auto break-all">
                      {finding.payload}
                    </p>
                  </div>
                )}

                {/* Evidence */}
                {finding.evidenceRequest && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t.evidence}</label>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded overflow-x-auto break-all">
                      {finding.evidenceRequest}
                    </p>
                  </div>
                )}

                {finding.evidenceResponse && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Response Evidence</label>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded overflow-x-auto break-all">
                      {finding.evidenceResponse}
                    </p>
                  </div>
                )}

                {/* Remediation */}
                {finding.remediationNotes && (
                  <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded p-3">
                    <label className="text-sm font-semibold text-green-900 dark:text-green-200">{t.remediation}</label>
                    <p className="text-sm text-green-800 dark:text-green-100 mt-1">
                      {finding.remediationNotes}
                    </p>
                  </div>
                )}

                {/* OWASP Category */}
                {finding.owasp10Category && (
                  <div className="text-sm">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{t.owasp}: </span>
                    <span className="text-gray-600 dark:text-gray-400">{finding.owasp10Category}</span>
                  </div>
                )}

                {/* Status Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleStatusUpdate(finding.id, 'ACKNOWLEDGED')}
                    className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded text-sm font-semibold hover:bg-yellow-600 dark:hover:bg-yellow-700 hover:shadow transition-all"
                  >
                    {t.acknowledge}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(finding.id, 'FIXED')}
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded text-sm font-semibold hover:bg-green-600 dark:hover:bg-green-700 hover:shadow transition-all"
                  >
                    {t.markFixed}
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(finding.id, 'FALSE_POSITIVE')}
                    className="flex-1 px-3 py-2 bg-gray-500 text-white rounded text-sm font-semibold hover:bg-gray-600 dark:hover:bg-gray-700 hover:shadow transition-all"
                  >
                    {t.falsePositive}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
