import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Button, Input, Alert, Spinner, Badge } from '../components/ui'
import { scenarioAPI } from '../services/api'
import apiClient from '../services/api'

export default function ImportExportPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('import')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  // Import state
  const [selectedFile, setSelectedFile] = useState(null)
  const [scenarioName, setScenarioName] = useState('')
  const [scenarioDesc, setScenarioDesc] = useState('')
  const [scenarioUrl, setScenarioUrl] = useState('')
  const [validationResult, setValidationResult] = useState(null)

  // Export state
  const [scenarios, setScenarios] = useState([])
  const [loadingScenarios, setLoadingScenarios] = useState(false)

  // Templates state
  const [templates, setTemplates] = useState([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  useEffect(() => {
    if (activeTab === 'export') loadScenarios()
    if (activeTab === 'templates') loadTemplates()
  }, [activeTab])

  const loadScenarios = async () => {
    setLoadingScenarios(true)
    try {
      const res = await apiClient.get('/scenarios', { params: { skip: 0, take: 100 } })
      setScenarios(res.data.scenarios || [])
    } catch (err) {
      setError('Gagal memuat daftar skenario')
    } finally {
      setLoadingScenarios(false)
    }
  }

  const loadTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const res = await scenarioAPI.listTemplates()
      setTemplates(res.data.templates || res.data || [])
    } catch (err) {
      // Templates might not be implemented yet
      setTemplates([])
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setError('File harus berformat CSV')
        return
      }
      setSelectedFile(file)
      setValidationResult(null)
      setError(null)
    }
  }

  const handleValidate = async () => {
    if (!selectedFile) return
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      const res = await apiClient.post('/import/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setValidationResult(res.data)
      if (res.data.valid) {
        setSuccess('File CSV valid dan siap diimport')
      } else {
        setError(`Validasi gagal: ${res.data.errors?.join(', ') || 'Format tidak valid'}`)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memvalidasi file')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      if (scenarioName) formData.append('scenarioName', scenarioName)
      if (scenarioDesc) formData.append('description', scenarioDesc)
      if (scenarioUrl) formData.append('url', scenarioUrl)

      const res = await apiClient.post('/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess(`Skenario "${res.data.scenario?.name || scenarioName}" berhasil diimport dengan ${res.data.stepsCreated || 0} step`)
      setSelectedFile(null)
      setScenarioName('')
      setScenarioDesc('')
      setScenarioUrl('')
      setValidationResult(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Gagal mengimport file')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (scenarioId, scenarioNameExport) => {
    try {
      const res = await scenarioAPI.exportToCSV(scenarioId)
      const blob = res.data
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${scenarioNameExport || 'scenario'}.csv`
      a.click()
      URL.revokeObjectURL(url)
      setSuccess(`Skenario "${scenarioNameExport}" berhasil diexport`)
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengexport skenario')
    }
  }

  const handleImportTemplate = async (templateId) => {
    setLoading(true)
    try {
      const res = await scenarioAPI.importFromTemplate(templateId)
      setSuccess(`Skenario berhasil dibuat dari template`)
      navigate(`/scenarios/${res.data.scenario?.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengimport template')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'import', label: '📥 Import CSV' },
    { id: 'export', label: '📤 Export CSV' },
    { id: 'templates', label: '📋 Templates' }
  ]

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">📦 Import / Export</h1>
          <p className="text-gray-600 mt-1">Import scenarios from CSV or export existing ones</p>
        </div>

        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(null); setSuccess(null) }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-700 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-bold text-gray-900 mb-4">Import Scenario from CSV</h2>

              {/* CSV Format Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-800 mb-2">📝 Format CSV yang didukung:</h3>
                <code className="block bg-white rounded p-3 text-xs font-mono text-gray-700 whitespace-pre">
{`stepNumber,type,description,selector,value
1,NAVIGATE,Open homepage,,https://example.com
2,CLICK,Click login button,#login-btn,
3,FILL,Enter email,input[name="email"],user@test.com
4,FILL,Enter password,input[name="password"],password123
5,CLICK,Submit form,button[type="submit"],
6,ASSERTION,Check dashboard,.dashboard-title,Dashboard`}
                </code>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">File CSV</label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {selectedFile && (
                      <Button size="sm" variant="secondary" onClick={handleValidate} disabled={loading}>
                        Validate
                      </Button>
                    )}
                  </div>
                  {selectedFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                {validationResult && (
                  <div className={`p-3 rounded-lg border ${validationResult.valid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className={`font-medium ${validationResult.valid ? 'text-green-700' : 'text-red-700'}`}>
                      {validationResult.valid ? '✅ File valid' : '❌ File tidak valid'}
                    </p>
                    {validationResult.rowCount && (
                      <p className="text-sm text-gray-600 mt-1">{validationResult.rowCount} baris terdeteksi</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nama Skenario (opsional)"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="My Test Scenario"
                  />
                  <Input
                    label="URL Target (opsional)"
                    value={scenarioUrl}
                    onChange={(e) => setScenarioUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <Input
                  label="Deskripsi (opsional)"
                  value={scenarioDesc}
                  onChange={(e) => setScenarioDesc(e.target.value)}
                  placeholder="Deskripsi skenario testing"
                />

                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || loading}
                >
                  {loading ? 'Importing...' : '📥 Import Scenario'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Export Scenarios to CSV</h2>
            {loadingScenarios ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : scenarios.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Belum ada skenario. Buat skenario terlebih dahulu.</p>
                <Button className="mt-3" onClick={() => navigate('/scenarios')}>
                  Go to Scenarios
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {scenarios.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{s.name}</p>
                      <p className="text-sm text-gray-500 truncate">{s.description || 'No description'}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {s._count?.testSteps ?? s.testSteps?.length ?? '?'} steps
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/scenarios/${s.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleExport(s.id, s.name)}
                      >
                        📤 Export
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Scenario Templates</h2>
            <p className="text-gray-600 mb-4">Quickly create scenarios from pre-defined templates</p>
            {loadingTemplates ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-3">📋</p>
                <p>Belum ada template tersedia</p>
                <p className="text-sm mt-1">Template akan muncul di sini setelah dibuat via API</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(t => (
                  <div key={t.id} className="border rounded-lg p-4 hover:border-indigo-300 transition">
                    <h3 className="font-semibold text-gray-900">{t.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t.description || '-'}</p>
                    <div className="mt-3">
                      <Button
                        size="sm"
                        onClick={() => handleImportTemplate(t.id)}
                        disabled={loading}
                      >
                        Use Template
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </Layout>
  )
}
