import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Button, Badge, Spinner, Alert } from '../components/ui'
import StepErrorDetail from '../components/StepErrorDetail'
import TestStepList from '../components/TestStepList'
import { scenarioAPI, executionAPI, recorderAPI } from '../services/api'

const STEP_TYPES = [
  { value: 'NAVIGATE', label: 'Navigate', icon: '🌐', fields: ['value'], placeholder: { value: 'https://example.com' } },
  { value: 'CLICK', label: 'Click', icon: '👆', fields: ['selector'], placeholder: { selector: '#button-id, .class-name, atau //xpath' } },
  { value: 'FILL', label: 'Fill', icon: '✏️', fields: ['selector', 'value'], placeholder: { selector: '#input-id atau //xpath', value: 'Text to type' } },
  { value: 'SCREENSHOT', label: 'Screenshot', icon: '📸', fields: [], placeholder: {} },
  { value: 'WAIT', label: 'Wait', icon: '⏱️', fields: ['value'], placeholder: { value: '1000 (ms)' } },
  { value: 'ASSERTION', label: 'Assertion', icon: '✅', fields: ['selector', 'value'], placeholder: { selector: '#element atau //xpath', value: 'Expected text (optional)' } },
  { value: 'API_CALL', label: 'API Call', icon: '📡', fields: ['value', 'metadata'], placeholder: { value: 'https://api.example.com/endpoint', metadata: '{"method":"GET","headers":{}}' } },
]

const emptyStep = { type: 'NAVIGATE', description: '', selector: '', value: '', metadata: '' }

export default function ScenarioDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [scenario, setScenario] = useState(null)
  const [steps, setSteps] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Step form state
  const [showStepForm, setShowStepForm] = useState(false)
  const [editingStep, setEditingStep] = useState(null)
  const [stepForm, setStepForm] = useState({ ...emptyStep })
  const [isSaving, setIsSaving] = useState(false)

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(null)

  // Screenshot modal state
  const [screenshotModal, setScreenshotModal] = useState(null)

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSteps, setRecordingSteps] = useState([])
  const [recordingUrl, setRecordingUrl] = useState('')
  const [isStartingRecording, setIsStartingRecording] = useState(false)
  const [isStoppingRecording, setIsStoppingRecording] = useState(false)
  const [isSavingRecording, setIsSavingRecording] = useState(false)
  const [showRecordingPanel, setShowRecordingPanel] = useState(false)
  const pollingRef = useRef(null)
  const stepFormRef = useRef(null)

  // Checkbox selection state
  const [selectedStepIds, setSelectedStepIds] = useState(new Set())
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const loadScenario = useCallback(async () => {
    try {
      const res = await scenarioAPI.getById(id)
      setScenario(res.data.scenario || res.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat scenario')
    }
  }, [id])

  const loadSteps = useCallback(async () => {
    try {
      const res = await scenarioAPI.getSteps(id, 0, 100)
      setSteps(res.data.steps || [])
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memuat test steps')
    }
  }, [id])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      await Promise.all([loadScenario(), loadSteps()])
      setIsLoading(false)
    }
    load()
  }, [loadScenario, loadSteps])

  // Get step type config
  const getStepTypeConfig = (type) => STEP_TYPES.find(t => t.value === type) || STEP_TYPES[0]

  // Step form handlers
  const openAddForm = () => {
    setEditingStep(null)
    setStepForm({ ...emptyStep })
    setShowStepForm(true)
    setTimeout(() => {
      stepFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const openEditForm = (step) => {
    setEditingStep(step)
    setStepForm({
      type: step.type,
      description: step.description || '',
      selector: step.selector || '',
      value: step.value || '',
      metadata: step.metadata || ''
    })
    setShowStepForm(true)
    setTimeout(() => {
      stepFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const cancelForm = () => {
    setShowStepForm(false)
    setEditingStep(null)
    setStepForm({ ...emptyStep })
  }

  const handleSaveStep = async () => {
    if (!stepForm.type || !stepForm.description.trim()) {
      setError('Type dan description wajib diisi')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      let parsedMetadata = null
      if (stepForm.metadata) {
        try {
          parsedMetadata = JSON.parse(stepForm.metadata)
        } catch {
          setError('Metadata harus berupa JSON yang valid')
          setIsSaving(false)
          return
        }
      }

      if (editingStep) {
        await scenarioAPI.updateStep(id, editingStep.id, {
          type: stepForm.type,
          description: stepForm.description.trim(),
          selector: stepForm.selector || null,
          value: stepForm.value || null,
          metadata: parsedMetadata
        })
        showSuccess('Step berhasil diupdate')
      } else {
        const stepNumber = steps.length + 1
        await scenarioAPI.createStep(
          id,
          stepNumber,
          stepForm.type,
          stepForm.description.trim(),
          stepForm.selector || null,
          stepForm.value || null,
          parsedMetadata
        )
        showSuccess('Step berhasil ditambahkan')
      }

      cancelForm()
      await loadSteps()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan step')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteStep = async (stepId) => {
    if (!window.confirm('Hapus step ini?')) return

    try {
      await scenarioAPI.deleteStep(id, stepId)
      showSuccess('Step berhasil dihapus')
      setSelectedStepIds(prev => { const next = new Set(prev); next.delete(stepId); return next })
      await loadSteps()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menghapus step')
    }
  }

  const toggleStepSelection = (stepId) => {
    setSelectedStepIds(prev => {
      const next = new Set(prev)
      if (next.has(stepId)) next.delete(stepId)
      else next.add(stepId)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedStepIds.size === steps.length) {
      setSelectedStepIds(new Set())
    } else {
      setSelectedStepIds(new Set(steps.map(s => s.id)))
    }
  }

  const handleBulkDelete = async () => {
    const count = selectedStepIds.size
    if (count === 0) return

    const confirmMsg = count === steps.length
      ? `Hapus SEMUA ${count} step?`
      : `Hapus ${count} step yang dipilih?`

    if (!window.confirm(confirmMsg)) return

    setIsDeletingBulk(true)
    try {
      await scenarioAPI.bulkDeleteSteps(id, Array.from(selectedStepIds))
      showSuccess(`${count} step berhasil dihapus`)
      setSelectedStepIds(new Set())
      await loadSteps()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menghapus steps')
    } finally {
      setIsDeletingBulk(false)
    }
  }

  const handleMoveStep = async (index, direction) => {
    const newSteps = [...steps]
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= newSteps.length) return

    ;[newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]

    const stepOrders = newSteps.map((s, i) => ({
      stepId: s.id,
      sequenceNumber: i + 1
    }))

    setSteps(newSteps)

    try {
      await scenarioAPI.reorderSteps(id, stepOrders)
      await loadSteps()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mengubah urutan step')
      await loadSteps()
    }
  }

  const executionResultRef = useRef(null)

  const handleExecute = async () => {
    if (steps.length === 0) {
      setError('Tambahkan minimal 1 step sebelum menjalankan skenario')
      return
    }

    if (!window.confirm(`Jalankan skenario "${scenario.name}"?`)) return

    setIsExecuting(true)
    setExecutionResult(null)
    setCurrentStepIndex(null)
    setError(null)

    try {
      const res = await executionAPI.executeScenario(id)
      const execution = res.data.execution

      // Poll execution details to track progress
      const pollExecution = async () => {
        try {
          const detailRes = await executionAPI.getDetails(execution.id)
          const result = detailRes.data.execution || detailRes.data
          setExecutionResult(result)

          // Track current step index based on completed steps
          if (result.stepResults && Array.isArray(result.stepResults)) {
            const completedCount = result.stepResults.filter(sr => sr && sr.status).length
            const currentIndex = Math.min(completedCount, steps.length - 1)
            
            // Only update if there are completed steps
            if (completedCount > 0) {
              setCurrentStepIndex(currentIndex)
            }
          }

          // If execution is still running, continue polling
          if (result.status === 'RUNNING' || result.status === 'PENDING') {
            setTimeout(pollExecution, 500)
          } else {
            // Execution finished
            setCurrentStepIndex(null)
            
            if (result.status === 'FAILED') {
              setError(`Eksekusi selesai dengan status FAILED (${result.failedSteps} step gagal)`)
            } else {
              showSuccess(`Eksekusi selesai - Status: ${result.status}`)
            }

            // Auto-scroll to results
            setTimeout(() => {
              executionResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 100)
          }
        } catch (pollErr) {
          // Ignore polling errors but log them
          if (pollingRef.current) {
            console.debug('Polling error (execution may still be running):', pollErr.message)
            setTimeout(pollExecution, 1000)
          }
        }
      }

      // Start polling
      pollExecution()
    } catch (err) {
      const errData = err.response?.data
      let errMsg = errData?.message || 'Eksekusi gagal'

      // Detect timeout
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errMsg = 'Request timeout — eksekusi mungkin masih berjalan di server. Cek halaman Execution untuk hasilnya.'
      }

      setError(errMsg)

      // If backend returned execution details on failure, show them
      if (errData?.execution) {
        setExecutionResult(errData.execution)
        setTimeout(() => {
          executionResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    } finally {
      setIsExecuting(false)
    }
  }

  // Handle applying AI fix to a step
  const handleApplyAIFix = (stepId, suggestedLocator) => {
    // Find the step and update its selector
    const stepIndex = steps.findIndex(s => s.id === stepId)
    if (stepIndex !== -1) {
      const updatedStep = { ...steps[stepIndex], selector: suggestedLocator }
      
      // Show approval modal
      if (window.confirm(`Apply this fix?\n\nOld: ${steps[stepIndex].selector || '(none)'}\nNew: ${suggestedLocator}\n\nStep will be updated and saved.`)) {
        // Update step in database
        handleSaveStep(updatedStep, stepIndex)
        showSuccess('Locator updated! Ready to run again.')
      }
    }
  }

  // ── Recording handlers ──
  const startPollingSteps = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(async () => {
      try {
        const res = await recorderAPI.status(id)
        if (res.data.status === 'recording') {
          setRecordingSteps(res.data.steps || [])
        } else if (res.data.status === 'stopped' || res.data.status === 'idle') {
          setIsRecording(false)
          clearInterval(pollingRef.current)
          pollingRef.current = null
        }
      } catch {
        // ignore polling errors
      }
    }, 1500)
  }, [id])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  // Check for existing recording session on load
  useEffect(() => {
    if (!id) return
    recorderAPI.status(id).then(res => {
      if (res.data.status === 'recording') {
        setIsRecording(true)
        setRecordingSteps(res.data.steps || [])
        setShowRecordingPanel(true)
        startPollingSteps()
      }
    }).catch(() => {})
  }, [id, startPollingSteps])

  const handleStartRecording = async () => {
    const url = recordingUrl.trim() || scenario?.url || ''
    if (!url) {
      setError('Masukkan URL target untuk recording')
      return
    }
    setIsStartingRecording(true)
    setError(null)
    try {
      await recorderAPI.start(id, url)
      setIsRecording(true)
      setRecordingSteps([])
      setShowRecordingPanel(true)
      showSuccess('Recording dimulai — browser Chromium terbuka. Silakan berinteraksi dengan halaman.')
      startPollingSteps()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memulai recording')
    } finally {
      setIsStartingRecording(false)
    }
  }

  const handleStopRecording = async () => {
    setIsStoppingRecording(true)
    try {
      const res = await recorderAPI.stop(id)
      setRecordingSteps(res.data.steps || [])
      setIsRecording(false)
      stopPolling()
      showSuccess(res.data.message || 'Recording selesai')
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menghentikan recording')
    } finally {
      setIsStoppingRecording(false)
    }
  }

  const handleSaveRecordedSteps = async () => {
    if (recordingSteps.length === 0) {
      setError('Tidak ada steps yang tercatat untuk disimpan')
      return
    }
    setIsSavingRecording(true)
    try {
      const res = await recorderAPI.save(id, recordingSteps)
      showSuccess(res.data.message || `${recordingSteps.length} steps berhasil disimpan`)
      setRecordingSteps([])
      setShowRecordingPanel(false)
      await loadSteps()
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal menyimpan recorded steps')
    } finally {
      setIsSavingRecording(false)
    }
  }

  const handleDiscardRecording = () => {
    if (recordingSteps.length > 0 && !window.confirm(`Buang ${recordingSteps.length} recorded steps?`)) return
    setRecordingSteps([])
    setShowRecordingPanel(false)
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-24">
          <Spinner size="lg" />
        </div>
      </Layout>
    )
  }

  if (!scenario) {
    return (
      <Layout>
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Scenario tidak ditemukan</p>
            <Button variant="primary" className="mt-4" onClick={() => navigate('/scenarios')}>
              Kembali ke Scenarios
            </Button>
          </div>
        </Card>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => navigate('/scenarios')}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mb-2 flex items-center gap-1"
            >
              ← Kembali ke Scenarios
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{scenario.name}</h1>
            {scenario.description && (
              <p className="text-gray-600 mt-1">{scenario.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>🌐 {scenario.url}</span>
              <span>📋 {steps.length} steps</span>
            </div>
          </div>

          <div className="flex gap-2">
            {!isRecording ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  setRecordingUrl(scenario.url || '')
                  setShowRecordingPanel(true)
                }}
                disabled={isExecuting}
              >
                🔴 Record
              </Button>
            ) : (
              <Button
                variant="danger"
                size="lg"
                onClick={handleStopRecording}
                disabled={isStoppingRecording}
              >
                {isStoppingRecording ? (
                  <span className="flex items-center gap-2"><Spinner size="sm" /> Stopping...</span>
                ) : '⏹ Stop Recording'}
              </Button>
            )}
            <Button
              variant="primary"
              size="lg"
              onClick={handleExecute}
              disabled={isExecuting || steps.length === 0 || isRecording}
            >
              {isExecuting ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" /> Menjalankan...
                </span>
              ) : (
                '▶ Jalankan Skenario'
              )}
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {successMsg && <Alert type="success" message={successMsg} />}

        {/* Recording Panel */}
        {showRecordingPanel && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {isRecording && <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
                🎬 {isRecording ? 'Recording Aktif...' : 'Mode Recording'}
              </h2>
              {!isRecording && recordingSteps.length === 0 && (
                <button
                  onClick={() => setShowRecordingPanel(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Start recording controls */}
            {!isRecording && recordingSteps.length === 0 && (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                  Mulai recording untuk merekam interaksi Anda di browser. Browser Chromium akan terbuka secara otomatis —
                  setiap klik, isian form, dan navigasi akan tercatat sebagai test steps.
                </p>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Target</label>
                    <input
                      type="url"
                      value={recordingUrl}
                      onChange={(e) => setRecordingUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleStartRecording}
                    disabled={isStartingRecording}
                  >
                    {isStartingRecording ? (
                      <span className="flex items-center gap-2"><Spinner size="sm" /> Membuka Browser...</span>
                    ) : '🔴 Mulai Recording'}
                  </Button>
                </div>
              </div>
            )}

            {/* Live recorded steps */}
            {(isRecording || recordingSteps.length > 0) && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500">
                    {recordingSteps.length} step{recordingSteps.length !== 1 ? 's' : ''} tercatat
                    {isRecording && ' — berinteraksilah dengan browser...'}
                  </p>
                  {!isRecording && recordingSteps.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveRecordedSteps}
                        disabled={isSavingRecording}
                      >
                        {isSavingRecording ? 'Menyimpan...' : `💾 Simpan ${recordingSteps.length} Steps`}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={handleDiscardRecording}>
                        Buang
                      </Button>
                    </div>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {recordingSteps.map((step, idx) => {
                    const config = getStepTypeConfig(step.type)
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded text-sm border border-gray-100"
                      >
                        <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <Badge variant="primary">{config.icon} {config.label}</Badge>
                        <span className="text-gray-700 truncate flex-1">{step.description}</span>
                        {step.selector && (
                          <code className="text-xs bg-gray-200 px-1 rounded text-gray-600 truncate max-w-[200px]">
                            {step.selector}
                          </code>
                        )}
                      </div>
                    )
                  })}
                  {recordingSteps.length === 0 && isRecording && (
                    <div className="text-center py-6 text-gray-400 text-sm">
                      Menunggu interaksi... Klik, isi form, atau navigasi di browser yang terbuka.
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Test Steps */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Test Steps</h2>
            <div className="flex items-center gap-2">
              {/* Bulk delete controls */}
              {selectedStepIds.size > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isDeletingBulk}
                >
                  {isDeletingBulk ? 'Menghapus...' : `Hapus ${selectedStepIds.size} Step`}
                </Button>
              )}
              {!showStepForm && (
                <Button variant="primary" onClick={openAddForm}>
                  + Tambah Step
                </Button>
              )}
            </div>
          </div>

          {/* Step Form */}
          {showStepForm && (
            <div ref={stepFormRef} className="mb-6 p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {editingStep ? 'Edit Step' : 'Tambah Step Baru'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={stepForm.type}
                    onChange={(e) => setStepForm({ ...stepForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {STEP_TYPES.map(t => (
                      <option key={t.value} value={t.value}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    value={stepForm.description}
                    onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
                    placeholder="Deskripsi langkah ini"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Conditional fields based on type */}
                {getStepTypeConfig(stepForm.type).fields.includes('selector') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selector
                    </label>
                    <input
                      type="text"
                      value={stepForm.selector}
                      onChange={(e) => setStepForm({ ...stepForm, selector: e.target.value })}
                      placeholder={getStepTypeConfig(stepForm.type).placeholder.selector}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                )}

                {getStepTypeConfig(stepForm.type).fields.includes('value') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={stepForm.value}
                      onChange={(e) => setStepForm({ ...stepForm, value: e.target.value })}
                      placeholder={getStepTypeConfig(stepForm.type).placeholder.value}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                )}

                {getStepTypeConfig(stepForm.type).fields.includes('metadata') && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metadata (JSON)
                    </label>
                    <textarea
                      value={stepForm.metadata}
                      onChange={(e) => setStepForm({ ...stepForm, metadata: e.target.value })}
                      placeholder={getStepTypeConfig(stepForm.type).placeholder.metadata}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Type hint */}
              <div className="mt-3 text-sm text-gray-500">
                {stepForm.type === 'NAVIGATE' && '💡 Masukkan URL tujuan di field Value'}
                {stepForm.type === 'CLICK' && '💡 Masukkan CSS selector atau XPath elemen yang akan di-klik'}
                {stepForm.type === 'FILL' && '💡 Masukkan CSS selector atau XPath input dan text yang akan diketik'}
                {stepForm.type === 'SCREENSHOT' && '💡 Akan mengambil screenshot halaman saat ini'}
                {stepForm.type === 'WAIT' && '💡 Masukkan waktu tunggu dalam milidetik (contoh: 1000 = 1 detik)'}
                {stepForm.type === 'ASSERTION' && '💡 Verifikasi elemen ada di halaman, dengan opsi pengecekan teks'}
                {stepForm.type === 'API_CALL' && '💡 Masukkan URL endpoint dan konfigurasi di metadata (JSON)'}
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="primary" onClick={handleSaveStep} disabled={isSaving}>
                  {isSaving ? 'Menyimpan...' : editingStep ? 'Update Step' : 'Simpan Step'}
                </Button>
                <Button variant="secondary" onClick={cancelForm}>
                  Batal
                </Button>
              </div>
            </div>
          )}

          {/* Steps List */}
          <TestStepList
            steps={steps}
            onMoveStep={handleMoveStep}
            onEditStep={openEditForm}
            onDeleteStep={handleDeleteStep}
            onToggleSelection={toggleStepSelection}
            onToggleSelectAll={toggleSelectAll}
            selectedStepIds={selectedStepIds}
            executionResult={executionResult}
            currentStepIndex={currentStepIndex}
            STEP_TYPES={STEP_TYPES}
            isDeletingBulk={isDeletingBulk}
          />
        </Card>

        {/* Execution Result */}
        {executionResult && (
          <div ref={executionResultRef}>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Hasil Eksekusi</h2>
              <Badge variant={executionResult.status === 'PASSED' ? 'success' : 'danger'}>
                {executionResult.status === 'PASSED' ? '✓' : '✗'} {executionResult.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{executionResult.passedSteps || 0}</p>
                <p className="text-sm text-gray-600">Passed</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{executionResult.failedSteps || 0}</p>
                <p className="text-sm text-gray-600">Failed</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{executionResult.totalSteps || 0}</p>
                <p className="text-sm text-gray-600">Total Steps</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-700">
                  {executionResult.duration ? `${(executionResult.duration / 1000).toFixed(2)}s` : '-'}
                </p>
                <p className="text-sm text-gray-600">Durasi</p>
              </div>
            </div>

            {executionResult.errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                <strong>Error:</strong>
                <StepErrorDetail 
                  errorMessage={executionResult.errorMessage} 
                  onRetest={handleExecute}
                  step={executionResult.failedStepIndex !== undefined ? steps[executionResult.failedStepIndex] : null}
                  pageUrl={scenario?.url}
                  onApplyAIFix={executionResult.failedStepIndex !== undefined ? (locator) => handleApplyAIFix(steps[executionResult.failedStepIndex]?.id, locator) : null}
                />
              </div>
            )}

            {/* Step Results */}
            {executionResult.stepResults && executionResult.stepResults.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Detail Per-Step</h3>
                <div className="space-y-3">
                  {executionResult.stepResults.map((result, idx) => (
                    <div
                      key={result.id || idx}
                      className={`p-3 rounded-lg border ${
                        result.status === 'PASSED'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg ${result.status === 'PASSED' ? 'text-green-600' : 'text-red-600'}`}>
                          {result.status === 'PASSED' ? '✓' : '✗'}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            Step {result.testStep?.stepNumber || idx + 1}: {result.testStep?.type || result.type} — {result.testStep?.description || result.description || '-'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {result.testStep?.type || result.type} 
                            {result.testStep?.selector ? ` • ${result.testStep.selector}` : ''}
                            {result.duration ? ` • ${result.duration}ms` : ''}
                          </p>
                          {result.errorMessage && (
                            <StepErrorDetail 
                              errorMessage={result.errorMessage} 
                              onRetest={handleExecute}
                              step={result.testStep}
                              pageUrl={scenario?.url}
                              onApplyAIFix={result.testStep ? (locator) => handleApplyAIFix(result.testStep.id, locator) : null}
                            />
                          )}
                        </div>
                        {/* Screenshot thumbnail */}
                        {result.screenshot && (
                          <button
                            onClick={() => setScreenshotModal({
                              url: result.screenshot.url,
                              stepNumber: result.testStep?.stepNumber || idx + 1,
                              description: result.testStep?.description || ''
                            })}
                            className="flex-shrink-0 border-2 border-gray-300 rounded-lg overflow-hidden hover:border-indigo-500 transition cursor-pointer"
                            title="Klik untuk memperbesar screenshot"
                          >
                            <img
                              src={result.screenshot.url}
                              alt={`Screenshot step ${result.testStep?.stepNumber || idx + 1}`}
                              className="w-24 h-16 object-cover"
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
          </div>
        )}

        {/* Screenshot Modal */}
        {screenshotModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={() => setScreenshotModal(null)}
          >
            <div
              className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  📸 Step {screenshotModal.stepNumber}: {screenshotModal.description}
                </h3>
                <button
                  onClick={() => setScreenshotModal(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <img
                  src={screenshotModal.url}
                  alt={`Screenshot step ${screenshotModal.stepNumber}`}
                  className="w-full rounded-lg border border-gray-200"
                />
              </div>
              <div className="flex justify-end p-4 border-t">
                <a
                  href={screenshotModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium mr-4"
                >
                  Buka di tab baru ↗
                </a>
                <Button variant="secondary" onClick={() => setScreenshotModal(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
