import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Button, Badge, Spinner, Alert } from '../components/ui'
import BrowserSelector from '../components/BrowserSelector'
import StepErrorDetail from '../components/StepErrorDetail'
import TestStepList from '../components/TestStepList'
import { scenarioAPI, executionAPI, recorderAPI } from '../services/api'
import { CheckCircle2, XCircle, ClipboardList, Clock } from 'lucide-react'
import { useSettingsStore } from '../store/settingsStore'

const i18n = {
  en: {
    loadScenarioError: 'Failed to load scenario',
    loadStepsError: 'Failed to load test steps',
    typeRequired: 'Type and description are required',
    invalidMetadata: 'Metadata must be valid JSON',
    stepUpdated: 'Step updated successfully',
    stepAdded: 'Step added successfully',
    saveStepError: 'Failed to save step',
    confirmDeleteStep: 'Delete this step?',
    stepDeleted: 'Step deleted successfully',
    deleteStepError: 'Failed to delete step',
    confirmDeleteAll: (c) => `Delete ALL ${c} steps?`,
    confirmDeleteSelected: (c) => `Delete ${c} selected steps?`,
    stepsDeleted: (c) => `${c} steps deleted`,
    deleteStepsError: 'Failed to delete steps',
    reorderError: 'Failed to reorder steps',
    addStepFirst: 'Add at least 1 step before running the scenario',
    confirmExecute: (name) => `Run scenario "${name}"?`,
    startingExecution: 'Starting execution, please wait...',
    executionFailed: (n) => `Execution completed with status FAILED (${n} steps failed)`,
    executionSuccess: (s) => `Execution completed - Status: ${s}`,
    executionError: 'Execution failed',
    executionTimeout: 'Request timeout — execution may still be running on the server. Check the Execution page for results.',
    updateSelectorError: 'Failed to update selector',
    locatorUpdated: (o, n) => `Locator updated: "${o}" → "${n}". Re-running...`,
    locatorsBatchUpdated: (c) => `✓ ${c} locators updated. Re-running scenario...`,
    batchFixError: 'Batch fix failed',
    noFixableSteps: 'No steps can be automatically fixed',
    enterUrlForRecording: 'Enter target URL for recording',
    recordingStarted: (msg) => `Recording started with Playwright 🎥\nBackend: ${msg}`,
    startRecordingError: 'Failed to start recording',
    stepsSavedRecording: (c) => `${c} steps recorded and saved`,
    recordingAutoSaveError: (c, e) => `Recording completed (${c} steps), but failed to auto-save: ${e}. Click "Save" to try again.`,
    recordingNoSteps: 'Recording completed — no steps captured',
    stopRecordingError: 'Failed to stop recording',
    noStepsToSave: 'No steps to save',
    stepsSaved: (c) => `${c} steps saved`,
    saveRecordingError: 'Failed to save recorded steps',
    confirmDiscardRecording: (c) => `Discard ${c} recorded steps?`,
    scenarioNotFound: 'Scenario not found',
    backToScenarios: '← Back to Scenarios',
    running: 'Running...',
    runScenario: '▶ Run Scenario',
    recordingActive: 'Recording Active...',
    recordingMode: 'Recording Mode',
    startRecordingHint: 'Start recording to capture your browser interactions. Chromium will open automatically — every click, form fill, and navigation will be recorded as test steps.',
    urlTarget: 'Target URL',
    openingBrowser: 'Opening Browser...',
    startRecording: '🔴 Start Recording',
    stepsRecorded: (c) => `${c} step${c !== 1 ? 's' : ''} recorded`,
    interactionHint: '— interact with the browser...',
    waitingForInteraction: 'Waiting for interactions... Click, fill forms, or navigate in the opened browser.',
    saving: 'Saving...',
    saveSteps: (c) => `💾 Save ${c} Steps`,
    discard: 'Discard',
    deleting: 'Deleting...',
    deleteSelectedSteps: (c) => `Delete ${c} Steps`,
    addStep: '+ Add Step',
    editStep: 'Edit Step',
    addNewStep: 'Add New Step',
    stepDescriptionPlaceholder: 'Step description',
    saveStepBtn: 'Save Step',
    updateStepBtn: 'Update Step',
    cancel: 'Cancel',
    executionResults: 'Execution Results',
    passed: 'Passed',
    failed: 'Failed',
    duration: 'Duration',
    fixing: 'Fixing...',
    autoRetryError: 'Auto-retry failed',
    hints: {
      NAVIGATE: '💡 Enter the target URL in the Value field',
      CLICK: '💡 Enter the CSS selector or XPath of the element to click',
      FILL: '💡 Enter the CSS selector or XPath of the input and the text to type',
      SCREENSHOT: '💡 Will take a screenshot of the current page',
      WAIT: '💡 Enter wait time in milliseconds (e.g., 1000 = 1 second)',
      ASSERTION: '💡 Verify element exists on page, with optional text check',
      API_CALL: '💡 Enter the endpoint URL and configuration in metadata (JSON)',
    },
    goBackToScenarios: 'Back to Scenarios',
    fieldType: 'Type',
    fieldDescription: 'Description',
    fieldSelector: 'Selector',
    fieldValue: 'Value',
    fieldMetadata: 'Metadata (JSON)',
    required: 'required',
    closeDialog: 'Close dialog',
  },
  id: {
    loadScenarioError: 'Gagal memuat scenario',
    loadStepsError: 'Gagal memuat test steps',
    typeRequired: 'Type dan description wajib diisi',
    invalidMetadata: 'Metadata harus berupa JSON yang valid',
    stepUpdated: 'Step berhasil diupdate',
    stepAdded: 'Step berhasil ditambahkan',
    saveStepError: 'Gagal menyimpan step',
    confirmDeleteStep: 'Hapus step ini?',
    stepDeleted: 'Step berhasil dihapus',
    deleteStepError: 'Gagal menghapus step',
    confirmDeleteAll: (c) => `Hapus SEMUA ${c} step?`,
    confirmDeleteSelected: (c) => `Hapus ${c} step yang dipilih?`,
    stepsDeleted: (c) => `${c} step berhasil dihapus`,
    deleteStepsError: 'Gagal menghapus steps',
    reorderError: 'Gagal mengubah urutan step',
    addStepFirst: 'Tambahkan minimal 1 step sebelum menjalankan skenario',
    confirmExecute: (name) => `Jalankan skenario "${name}"?`,
    startingExecution: 'Memulai eksekusi, mohon tunggu...',
    executionFailed: (n) => `Eksekusi selesai dengan status FAILED (${n} step gagal)`,
    executionSuccess: (s) => `Eksekusi selesai - Status: ${s}`,
    executionError: 'Eksekusi gagal',
    executionTimeout: 'Request timeout — eksekusi mungkin masih berjalan di server. Cek halaman Execution untuk hasilnya.',
    updateSelectorError: 'Gagal mengupdate selector',
    locatorUpdated: (o, n) => `Locator diperbarui: "${o}" → "${n}". Menjalankan kembali...`,
    locatorsBatchUpdated: (c) => `✓ ${c} locator diperbarui. Menjalankan kembali scenario...`,
    batchFixError: 'Batch fix gagal',
    noFixableSteps: 'Tidak ada step yang bisa diperbaiki secara otomatis',
    enterUrlForRecording: 'Masukkan URL target untuk recording',
    recordingStarted: (msg) => `Recording dimulai dengan Playwright 🎥\nBackend: ${msg}`,
    startRecordingError: 'Gagal memulai recording',
    stepsSavedRecording: (c) => `${c} steps berhasil direkam dan disimpan`,
    recordingAutoSaveError: (c, e) => `Recording selesai (${c} steps), tapi gagal auto-save: ${e}. Klik "Simpan" untuk coba lagi.`,
    recordingNoSteps: 'Recording selesai — tidak ada steps yang tercatat',
    stopRecordingError: 'Gagal menghentikan recording',
    noStepsToSave: 'Tidak ada steps yang tercatat untuk disimpan',
    stepsSaved: (c) => `${c} steps berhasil disimpan`,
    saveRecordingError: 'Gagal menyimpan recorded steps',
    confirmDiscardRecording: (c) => `Buang ${c} recorded steps?`,
    scenarioNotFound: 'Scenario tidak ditemukan',
    backToScenarios: '← Kembali ke Scenarios',
    running: 'Menjalankan...',
    runScenario: '▶ Jalankan Skenario',
    recordingActive: 'Recording Aktif...',
    recordingMode: 'Mode Recording',
    startRecordingHint: 'Mulai recording untuk merekam interaksi Anda di browser. Browser Chromium akan terbuka secara otomatis — setiap klik, isian form, dan navigasi akan tercatat sebagai test steps.',
    urlTarget: 'URL Target',
    openingBrowser: 'Membuka Browser...',
    startRecording: '🔴 Mulai Recording',
    stepsRecorded: (c) => `${c} step${c !== 1 ? 's' : ''} tercatat`,
    interactionHint: '— berinteraksilah dengan browser...',
    waitingForInteraction: 'Menunggu interaksi... Klik, isi form, atau navigasi di browser yang terbuka.',
    saving: 'Menyimpan...',
    saveSteps: (c) => `💾 Simpan ${c} Steps`,
    discard: 'Buang',
    deleting: 'Menghapus...',
    deleteSelectedSteps: (c) => `Hapus ${c} Step`,
    addStep: '+ Tambah Step',
    editStep: 'Edit Step',
    addNewStep: 'Tambah Step Baru',
    stepDescriptionPlaceholder: 'Deskripsi langkah ini',
    saveStepBtn: 'Simpan Step',
    updateStepBtn: 'Update Step',
    cancel: 'Batal',
    executionResults: 'Hasil Eksekusi',
    passed: 'Lolos',
    failed: 'Gagal',
    duration: 'Durasi',
    fixing: 'Memperbaiki...',
    autoRetryError: 'Auto-retry gagal',
    hints: {
      NAVIGATE: '💡 Masukkan URL tujuan di field Value',
      CLICK: '💡 Masukkan CSS selector atau XPath elemen yang akan di-klik',
      FILL: '💡 Masukkan CSS selector atau XPath input dan text yang akan diketik',
      SCREENSHOT: '💡 Akan mengambil screenshot halaman saat ini',
      WAIT: '💡 Masukkan waktu tunggu dalam milidetik (contoh: 1000 = 1 detik)',
      ASSERTION: '💡 Verifikasi elemen ada di halaman, dengan opsi pengecekan teks',
      API_CALL: '💡 Masukkan URL endpoint dan konfigurasi di metadata (JSON)',
    },
    goBackToScenarios: 'Kembali ke Scenarios',
    fieldType: 'Tipe',
    fieldDescription: 'Deskripsi',
    fieldSelector: 'Selector',
    fieldValue: 'Value',
    fieldMetadata: 'Metadata (JSON)',
    required: 'wajib',
    closeDialog: 'Tutup dialog',
  },
}

const STEP_TYPES = [
  { value: 'NAVIGATE', label: 'Navigate', icon: '🌐', fields: ['value'], placeholder: { value: 'https://example.com' } },
  { value: 'CLICK', label: 'Click', icon: '👆', fields: ['selector', 'metadata'], placeholder: { selector: '#button-id, .class-name, atau //xpath', metadata: '{"maxRetries":2} (optional)' } },
  { value: 'FILL', label: 'Fill', icon: '✏️', fields: ['selector', 'value', 'metadata'], placeholder: { selector: '#input-id atau //xpath', value: 'Text to type', metadata: '{"maxRetries":2} (optional)' } },
  { value: 'HOVER', label: 'Hover', icon: '🖱️', fields: ['selector', 'metadata'], placeholder: { selector: '#element atau //xpath', metadata: '{"maxRetries":1} (optional)' } },
  { value: 'SCROLL', label: 'Scroll', icon: '↕️', fields: ['selector', 'value'], placeholder: { selector: '#container (optional)', value: '300 (px, positif=bawah, negatif=atas)' } },
  { value: 'FILE_UPLOAD', label: 'File Upload', icon: '📁', fields: ['selector', 'value'], placeholder: { selector: 'input[type="file"]', value: '/path/to/file.pdf (pipe-separated for multiple)' } },
  { value: 'DRAG', label: 'Drag', icon: '🖱️', fields: ['selector', 'value', 'metadata'], placeholder: { selector: '#source-element (draggable)', value: '#target-element (drop zone)', metadata: '{"maxRetries":1} (optional)' } },
  { value: 'MOCK_ROUTE', label: 'Mock Route', icon: '🔀', fields: ['value', 'metadata'], placeholder: { value: '**/api/users* (URL glob pattern)', metadata: '{"status":200,"body":{"ok":true},"contentType":"application/json"}' } },
  { value: 'SCREENSHOT', label: 'Screenshot', icon: '📸', fields: [], placeholder: {} },
  { value: 'WAIT', label: 'Wait', icon: '⏱️', fields: ['value'], placeholder: { value: '1000 (ms)' } },
  { value: 'ASSERTION', label: 'Assertion', icon: '✅', fields: ['selector', 'value', 'metadata'], placeholder: { selector: '#element atau //xpath', value: 'Expected text, regex:/pattern/, count:3, visible, not-exists', metadata: '{"maxRetries":2} (optional)' } },
  { value: 'API_CALL', label: 'API Call', icon: '📡', fields: ['value', 'metadata'], placeholder: { value: 'https://api.example.com/endpoint', metadata: '{"method":"GET","headers":{}}' } },
]

const emptyStep = { type: 'NAVIGATE', description: '', selector: '', value: '', metadata: '' }

export default function ScenarioDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const routeLocation = useLocation()
  const location = useLocation()

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
  const [isAutoRetrying, setIsAutoRetrying] = useState(false)
  const [isBatchFixing, setIsBatchFixing] = useState(false)
  const [executionIteration, setExecutionIteration] = useState(0)

  // Browser selection state
  const [selectedBrowser, setSelectedBrowser] = useState('chromium')
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [headlessMode, setHeadlessMode] = useState(false)
  const [showBrowserSelector, setShowBrowserSelector] = useState(false)

  // Screenshot modal state
  const [screenshotModal, setScreenshotModal] = useState(null)

  // Step details collapse state
  const [showStepDetails, setShowStepDetails] = useState(false)

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSteps, setRecordingSteps] = useState([])
  const [recordingUrl, setRecordingUrl] = useState('')
  const [isStartingRecording, setIsStartingRecording] = useState(false)
  const [isStoppingRecording, setIsStoppingRecording] = useState(false)
  const [isSavingRecording, setIsSavingRecording] = useState(false)
  const [showRecordingPanel, setShowRecordingPanel] = useState(false)

  // Auto-open recording panel if navigated via Quick Record (?autoRecord=1)
  useEffect(() => {
    const params = new URLSearchParams(routeLocation.search)
    if (params.get('autoRecord') === '1') {
      setShowRecordingPanel(true)
      setRecordingUrl(scenario?.url || '')
      // Auto-start recording immediately
      setTimeout(() => {
        handleStartRecording()
      }, 500)
      // Clean up URL param without re-render
      const cleanUrl = routeLocation.pathname
      window.history.replaceState(null, '', cleanUrl)
    }
  }, [routeLocation, scenario])

  // ── End of state declarations ──

  const pollingRef = useRef(null)
  const handleStopRecordingRef = useRef(null)
  const stepFormRef = useRef(null)

  // Checkbox selection state
  const [selectedStepIds, setSelectedStepIds] = useState(new Set())
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const { language, theme } = useSettingsStore()
  const t = i18n[language] || i18n.id
  const isDark = theme === 'dark'

  // Close step form modal on Escape
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape' && showStepForm) cancelForm() }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [showStepForm])

  const loadScenario = useCallback(async () => {
    try {
      const res = await scenarioAPI.getById(id)
      setScenario(res.data.scenario || res.data)
    } catch (err) {
      setError(err.response?.data?.error || t.loadScenarioError)
    }
  }, [id])

  const loadSteps = useCallback(async () => {
    try {
      const res = await scenarioAPI.getSteps(id, 0, 100)
      setSteps(res.data.steps || [])
    } catch (err) {
      setError(err.response?.data?.error || t.loadStepsError)
    }
  }, [id])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      await Promise.all([loadScenario(), loadSteps()])
      setIsLoading(false)
      // Load jumlah eksekusi sebelumnya untuk iterasi counter
      try {
        const histRes = await executionAPI.getHistory(id, 100, 0)
        const total = histRes.data?.total ?? (histRes.data?.executions?.length ?? 0)
        setExecutionIteration(total)
      } catch { /* abaikan jika gagal */ }
    }
    load()
  }, [loadScenario, loadSteps, id])

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
      setError(t.typeRequired)
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
          setError(t.invalidMetadata)
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
        showSuccess(t.stepUpdated)
      } else {
        await scenarioAPI.createStep(
          id,
          null,
          stepForm.type,
          stepForm.description.trim(),
          stepForm.selector || null,
          stepForm.value || null,
          parsedMetadata
        )
        showSuccess(t.stepAdded)
      }

      cancelForm()
      await loadSteps()
    } catch (err) {
      setError(err.response?.data?.error || t.saveStepError)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteStep = async (stepId) => {
    if (!window.confirm(t.confirmDeleteStep)) return

    try {
      await scenarioAPI.deleteStep(id, stepId)
      showSuccess(t.stepDeleted)
      setSelectedStepIds(prev => { const next = new Set(prev); next.delete(stepId); return next })
      await loadSteps()
    } catch (err) {
      setError(err.response?.data?.error || t.deleteStepError)
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
      ? t.confirmDeleteAll(count)
      : t.confirmDeleteSelected(count)

    if (!window.confirm(confirmMsg)) return

    setIsDeletingBulk(true)
    try {
      await scenarioAPI.bulkDeleteSteps(id, Array.from(selectedStepIds))
      showSuccess(t.stepsDeleted(count))
      setSelectedStepIds(new Set())
      await loadSteps()
    } catch (err) {
      setError(err.response?.data?.error || t.deleteStepsError)
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
      setError(err.response?.data?.error || t.reorderError)
      await loadSteps()
    }
  }

  const executionResultRef = useRef(null)

  const handleExecute = async () => {
    if (steps.length === 0) {
      setError(t.addStepFirst)
      return
    }

    if (!window.confirm(t.confirmExecute(scenario.name))) return

    // Open live viewer window BEFORE await to avoid popup blocker
    const liveWindow = window.open('', '_blank', 'width=1280,height=800,menubar=no,toolbar=no,scrollbars=yes,resizable=yes')
    if (liveWindow) {
      liveWindow.document.write(`<html><body style="font-family:sans-serif;padding:40px;background:#0f172a;color:#e2e8f0"><p>${t.startingExecution}</p></body></html>`)
    }

    setIsExecuting(true)
    setExecutionResult(null)
    setCurrentStepIndex(null)
    setError(null)
    setExecutionIteration(prev => prev + 1)

    try {
      const res = await executionAPI.executeScenario(id, {
        browser: selectedBrowser,
        headless: headlessMode,
        device: selectedDevice || undefined
      })
      const execution = res.data.execution

      // Redirect live viewer ke halaman live-view
      if (res.data.liveViewUrl && liveWindow && !liveWindow.closed) {
        liveWindow.location.href = res.data.liveViewUrl
      }

      // Poll execution details to track progress in main page
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
              setError(t.executionFailed(result.failedSteps))
            } else {
              showSuccess(t.executionSuccess(result.status))
            }

            // Auto-scroll to results
            setTimeout(() => {
              executionResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 100)
          }
        } catch (pollErr) {
          // Ignore transient polling errors, keep retrying
          console.debug('Polling error (execution may still be running):', pollErr.message)
          setTimeout(pollExecution, 1000)
        }
      }

      // Start polling
      pollExecution()
    } catch (err) {
      const errData = err.response?.data
      let errMsg = errData?.message || t.executionError

      // Detect timeout
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errMsg = t.executionTimeout
      }

      setError(errMsg)

      // Tutup live window jika ada error
      if (liveWindow && !liveWindow.closed) liveWindow.close()

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

  const handleApplyAIFix = async (stepId, suggestedLocator) => {
    const step = steps.find(s => s.id === stepId)
    if (!step) return
    if (!window.confirm(`Apply this fix?\n\nOld: ${step.selector || '(none)'}\nNew: ${suggestedLocator}\n\nStep will be updated and saved.`)) return
    try {
      let parsedMeta = null
      if (step.metadata) {
        try { parsedMeta = typeof step.metadata === 'string' ? JSON.parse(step.metadata) : step.metadata } catch { parsedMeta = null }
      }
      await scenarioAPI.updateStep(id, stepId, {
        type: step.type,
        description: step.description,
        selector: suggestedLocator,
        value: step.value || null,
        metadata: parsedMeta
      })
      showSuccess('Locator updated! Ready to run again.')
      await loadSteps()
    } catch (err) {
      setError(err.response?.data?.error || t.updateSelectorError)
    }
  }

  const handleAutoRetry = async (stepId, topSuggestionSelector) => {
    if (!stepId || !topSuggestionSelector || isAutoRetrying) return
    
    const step = steps.find(s => s.id === stepId)
    if (!step) return
    
    try {
      setIsAutoRetrying(true)
      setError(null)
      
      // Update step with top suggestion (silent, no confirmation)
      let parsedMeta = null
      if (step.metadata) {
        try { parsedMeta = typeof step.metadata === 'string' ? JSON.parse(step.metadata) : step.metadata } catch { parsedMeta = null }
      }
      
      await scenarioAPI.updateStep(id, stepId, {
        type: step.type,
        description: step.description,
        selector: topSuggestionSelector,
        value: step.value || null,
        metadata: parsedMeta
      })
      
      await loadSteps()
      showSuccess(t.locatorUpdated(step.selector, topSuggestionSelector))
      
      // Immediately re-execute scenario
      setTimeout(() => handleExecute(), 500)
    } catch (err) {
      setError(err.response?.data?.error || 'Auto-retry gagal')
      setIsAutoRetrying(false)
    }
  }

  /**
   * Batch Fix Mode: Apply top suggestions to all failed steps at once
   */
  const handleBatchFix = async () => {
    if (!executionResult || !executionResult.stepResults || isBatchFixing) return

    try {
      setIsBatchFixing(true)
      setError(null)

      // Collect all failed steps with suggestions
      const updates = []
      let fixedCount = 0

      for (const result of executionResult.stepResults) {
        if (result.status !== 'FAILED' || !result.errorMessage) continue

        // Parse error message to extract suggestions
        let parsedError = null
        try {
          parsedError = typeof result.errorMessage === 'string' ? JSON.parse(result.errorMessage) : result.errorMessage
        } catch {
          continue
        }

        // Get top suggestion
        const topSuggestion = parsedError.locatorSuggestions?.[0]
        if (!topSuggestion || !topSuggestion.selector) continue

        // Find the step to get full data
        const step = steps.find(s => s.id === result.testStep?.id)
        if (!step) continue

        updates.push({
          stepId: step.id,
          selector: topSuggestion.selector
        })
        fixedCount++
      }

      if (updates.length === 0) {
        setError(t.noFixableSteps)
        setIsBatchFixing(false)
        return
      }

      // Batch update all steps
      await scenarioAPI.batchUpdateSteps(id, { updates })
      await loadSteps()

      showSuccess(t.locatorsBatchUpdated(fixedCount))

      // Re-execute scenario
      setTimeout(() => handleExecute(), 500)
    } catch (err) {
      setError(err.response?.data?.error || t.batchFixError)
      setIsBatchFixing(false)
    }
  }

  // ── Recording handlers ──
  const startPollingSteps = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    // First fetch immediately
    recorderAPI.status(id).then(res => {
      if (res.data.status === 'recording') {
        setRecordingSteps(res.data.steps || [])
      }
    }).catch(() => {})
    
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
    }, 1000)
  }, [id])

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
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
    const url = (recordingUrl.trim() || scenario?.url || '').trim()
    if (!url) {
      setError(t.enterUrlForRecording)
      return
    }

    setIsStartingRecording(true)
    setError(null)
    try {
      // ═══ Start Playwright-based Recording ═══
      const res = await recorderAPI.start(id, url)
      
      setIsRecording(true)
      setRecordingSteps([])
      setShowRecordingPanel(true)

      // ═══ Show Status ═══
      showSuccess(t.recordingStarted(res.data.message))
      
      // Start polling for recorded steps with immediate first fetch
      startPollingSteps()

    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || t.startRecordingError
      setError(errorMsg)
      console.error('Recording start error:', err.response?.data || err.message)
      setIsRecording(false)
    } finally {
      setIsStartingRecording(false)
    }
  }

  const handleStopRecording = async () => {
    setIsStoppingRecording(true)
    stopPolling() // Stop polling steps from backend
    try {
      // ═══ Stop Playwright-based Recording ═══
      const res = await recorderAPI.stop(id)
      const stoppedSteps = res.data.steps || []
      
      setRecordingSteps(stoppedSteps)
      setIsRecording(false)

      // Auto-save steps ke database jika ada
      if (stoppedSteps.length > 0) {
        try {
          const saveRes = await recorderAPI.save(id, stoppedSteps)
          showSuccess(saveRes.data.message || t.stepsSavedRecording(stoppedSteps.length))
          setRecordingSteps([])
          setShowRecordingPanel(false)
          await loadSteps() // Refresh step list
        } catch (saveErr) {
          // If save failed, show steps for manual save
          const saveErrorMsg = saveErr.response?.data?.message || saveErr.response?.data?.error || saveErr.message
          setError(t.recordingAutoSaveError(stoppedSteps.length, saveErrorMsg))
        }
      } else {
        showSuccess(t.recordingNoSteps)
        setShowRecordingPanel(false)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || t.stopRecordingError
      setError(errorMsg)
      console.error('Recording stop error:', err.response?.data || err.message)
    } finally {
      setIsStoppingRecording(false)
    }
  }
  handleStopRecordingRef.current = handleStopRecording

  const handleSaveRecordedSteps = async () => {
    if (recordingSteps.length === 0) {
      setError(t.noStepsToSave)
      return
    }
    setIsSavingRecording(true)
    try {
      const res = await recorderAPI.save(id, recordingSteps)
      showSuccess(res.data.message || t.stepsSaved(recordingSteps.length))
      setRecordingSteps([])
      setShowRecordingPanel(false)
      await loadSteps()
    } catch (err) {
      setError(err.response?.data?.error || t.saveRecordingError)
    } finally {
      setIsSavingRecording(false)
    }
  }

  const handleDiscardRecording = () => {
    if (recordingSteps.length > 0 && !window.confirm(t.confirmDiscardRecording(recordingSteps.length))) return
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
            <p className="text-[#888] text-lg">{t.scenarioNotFound}</p>
            <Button variant="primary" className="mt-4" onClick={() => navigate('/scenarios')}>
              {t.goBackToScenarios}
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
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <button
              onClick={() => navigate('/scenarios')}
              className="text-[#5E6AD2] hover:text-[#6B7AE8] text-sm font-medium mb-2 flex items-center gap-1"
            >
              {t.backToScenarios}
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#E0E0E2] break-words">{scenario.name}</h1>
            {scenario.description && (
              <p className="text-[#A0A0A4] mt-1">{scenario.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-[#888]">
              <span>🌐 {scenario.url}</span>
              <span>📋 {steps.length} steps</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowBrowserSelector(!showBrowserSelector)}
              disabled={isExecuting}
            >
              {selectedDevice ? `📱 ${selectedDevice}` : `🌐 ${selectedBrowser}`}
            </Button>
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
                  <Spinner size="sm" /> {t.running}
                </span>
              ) : (
                t.runScenario
              )}
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {successMsg && <Alert type="success" message={successMsg} />}

        {/* Browser Selector */}
        {showBrowserSelector && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-base font-bold ${isDark ? 'text-[#E0E0E2]' : 'text-slate-900'}`}>Browser &amp; Device</h2>
              <button
                onClick={() => setShowBrowserSelector(false)}
                className={`text-xl leading-none ${isDark ? 'text-[#8A8A8F] hover:text-[#E0E0E2]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                ✕
              </button>
            </div>
            <BrowserSelector
              selectedBrowser={selectedBrowser}
              selectedDevice={selectedDevice}
              onBrowserChange={(b) => { setSelectedBrowser(b); setSelectedDevice(null) }}
              onDeviceChange={setSelectedDevice}
              headless={headlessMode}
              onHeadlessChange={setHeadlessMode}
              disabled={isExecuting}
            />
          </Card>
        )}

        {/* Recording Panel */}
        {showRecordingPanel && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#E0E0E2] flex items-center gap-2">
                {isRecording && <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
                🎬 {isRecording ? t.recordingActive : t.recordingMode}
              </h2>
              {!isRecording && recordingSteps.length === 0 && (
                <button
                  onClick={() => setShowRecordingPanel(false)}
                  className="text-[#666] hover:text-[#E0E0E2] text-xl leading-none"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Start recording controls */}
            {!isRecording && recordingSteps.length === 0 && (
              <div className="space-y-4">
                <p className="text-[#A0A0A4] text-sm">
                  {t.startRecordingHint}
                </p>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[#A0A0A4] mb-1">{t.urlTarget}</label>
                    <input
                      type="url"
                      value={recordingUrl}
                      onChange={(e) => setRecordingUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 bg-[#161618] border border-[#2D2D2F] text-[#E0E0E2] placeholder-[#4A4A52] rounded-lg focus:ring-1 focus:ring-[#5E6AD2] focus:outline-none"
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleStartRecording}
                    disabled={isStartingRecording}
                  >
                    {isStartingRecording ? (
                      <span className="flex items-center gap-2"><Spinner size="sm" /> {t.openingBrowser}</span>
                    ) : t.startRecording}
                  </Button>
                </div>
              </div>
            )}

            {/* Live recorded steps */}
            {(isRecording || recordingSteps.length > 0) && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-[#888]">
                    {t.stepsRecorded(recordingSteps.length)}
                    {isRecording && ` ${t.interactionHint}`}
                  </p>
                  {!isRecording && recordingSteps.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleSaveRecordedSteps}
                        disabled={isSavingRecording}
                      >
                        {isSavingRecording ? t.saving : t.saveSteps(recordingSteps.length)}
                      </Button>
                      <Button variant="secondary" size="sm" onClick={handleDiscardRecording}>
                        {t.discard}
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
                        className="flex items-center gap-2 px-3 py-2 bg-[#161618] rounded text-sm border border-[#2D2D2F]"
                      >
                        <span className="flex-shrink-0 w-6 h-6 bg-[#5E6AD2]/15 text-[#5E6AD2] rounded-full flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <Badge variant="primary">{config.icon} {config.label}</Badge>
                        <span className="text-[#E0E0E2] truncate flex-1">{step.description}</span>
                        {step.selector && (
                          <code className="text-xs bg-[#2D2D2F] px-1 rounded text-[#A0A0A4] truncate max-w-[200px]">
                            {step.selector}
                          </code>
                        )}
                      </div>
                    )
                  })}
                  {recordingSteps.length === 0 && isRecording && (
                    <div className="text-center py-6 text-[#555] text-sm">
                      {t.waitingForInteraction}
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
            <h2 className="text-xl font-bold text-[#E0E0E2]">Test Steps</h2>
            <div className="flex items-center gap-2">
              {/* Bulk delete controls */}
              {selectedStepIds.size > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isDeletingBulk}
                >
                  {isDeletingBulk ? t.deleting : t.deleteSelectedSteps(selectedStepIds.size)}
                </Button>
              )}
              {!showStepForm && (
                <Button variant="primary" onClick={openAddForm}>
                  {t.addStep}
                </Button>
              )}
            </div>
          </div>

          {/* Step Form Modal */}
          {showStepForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
              {/* Backdrop */}
              <div
                className={`absolute inset-0 backdrop-blur-sm ${
                  isDark ? 'bg-black/60' : 'bg-black/40'
                }`}
                onClick={cancelForm}
                aria-label={t.closeDialog}
              />
              {/* Dialog */}
              <div
                ref={stepFormRef}
                role="dialog"
                aria-modal="true"
                aria-label={editingStep ? t.editStep : t.addNewStep}
                className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border transition-colors ${
                  isDark
                    ? 'bg-[#1C1C1E] border-[#2D2D2F]'
                    : 'bg-white border-gray-200'
                }`}
              >
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${
                  isDark ? 'border-[#2D2D2F]' : 'border-gray-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#5E6AD2]/15 flex items-center justify-center">
                      <span className="text-[#5E6AD2] text-sm">{editingStep ? '✏️' : '+'}</span>
                    </div>
                    <h3 className={`text-lg font-semibold ${
                      isDark ? 'text-[#E0E0E2]' : 'text-gray-900'
                    }`}>
                      {editingStep ? t.editStep : t.addNewStep}
                    </h3>
                  </div>
                  <button
                    onClick={cancelForm}
                    aria-label={t.closeDialog}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      isDark
                        ? 'text-[#888] hover:text-[#E0E0E2] hover:bg-[#2D2D2F]'
                        : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    ✕
                  </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Type */}
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDark ? 'text-[#A0A0A4]' : 'text-gray-700'
                      }`}>
                        {t.fieldType} <span className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>*{t.required}</span>
                      </label>
                      <select
                        value={stepForm.type}
                        onChange={(e) => setStepForm({ ...stepForm, type: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#5E6AD2] focus:outline-none transition-colors ${
                          isDark
                            ? 'bg-[#161618] border-[#2D2D2F] text-[#E0E0E2]'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        {STEP_TYPES.map(st => (
                          <option key={st.value} value={st.value}>
                            {st.icon} {st.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${
                        isDark ? 'text-[#A0A0A4]' : 'text-gray-700'
                      }`}>
                        {t.fieldDescription} <span className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>*{t.required}</span>
                      </label>
                      <input
                        type="text"
                        value={stepForm.description}
                        onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
                        placeholder={t.stepDescriptionPlaceholder}
                        autoFocus
                        className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#5E6AD2] focus:outline-none transition-colors ${
                          isDark
                            ? 'bg-[#161618] border-[#2D2D2F] text-[#E0E0E2] placeholder-[#4A4A52]'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>

                    {/* Selector */}
                    {getStepTypeConfig(stepForm.type).fields.includes('selector') && (
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${
                          isDark ? 'text-[#A0A0A4]' : 'text-gray-700'
                        }`}>
                          {t.fieldSelector}
                        </label>
                        <input
                          type="text"
                          value={stepForm.selector}
                          onChange={(e) => setStepForm({ ...stepForm, selector: e.target.value })}
                          placeholder={getStepTypeConfig(stepForm.type).placeholder.selector}
                          className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#5E6AD2] focus:outline-none transition-colors ${
                            isDark
                              ? 'bg-[#161618] border-[#2D2D2F] text-[#E0E0E2] placeholder-[#4A4A52]'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                      </div>
                    )}

                    {/* Value */}
                    {getStepTypeConfig(stepForm.type).fields.includes('value') && (
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${
                          isDark ? 'text-[#A0A0A4]' : 'text-gray-700'
                        }`}>
                          {t.fieldValue}
                        </label>
                        <input
                          type="text"
                          value={stepForm.value}
                          onChange={(e) => setStepForm({ ...stepForm, value: e.target.value })}
                          placeholder={getStepTypeConfig(stepForm.type).placeholder.value}
                          className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#5E6AD2] focus:outline-none transition-colors ${
                            isDark
                              ? 'bg-[#161618] border-[#2D2D2F] text-[#E0E0E2] placeholder-[#4A4A52]'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                      </div>
                    )}

                    {/* Metadata */}
                    {getStepTypeConfig(stepForm.type).fields.includes('metadata') && (
                      <div className="md:col-span-2">
                        <label className={`block text-sm font-medium mb-1 ${
                          isDark ? 'text-[#A0A0A4]' : 'text-gray-700'
                        }`}>
                          {t.fieldMetadata}
                        </label>
                        <textarea
                          value={stepForm.metadata}
                          onChange={(e) => setStepForm({ ...stepForm, metadata: e.target.value })}
                          placeholder={getStepTypeConfig(stepForm.type).placeholder.metadata}
                          rows={3}
                          className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#5E6AD2] focus:outline-none font-mono text-sm transition-colors ${
                            isDark
                              ? 'bg-[#161618] border-[#2D2D2F] text-[#E0E0E2] placeholder-[#4A4A52]'
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Type hint */}
                  {t.hints[stepForm.type] && (
                    <div className={`mt-4 px-3 py-2 rounded-lg text-sm ${
                      isDark ? 'bg-[#5E6AD2]/10 text-[#9BA3F0]' : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {t.hints[stepForm.type]}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className={`flex gap-3 px-6 py-4 border-t ${
                  isDark ? 'border-[#2D2D2F]' : 'border-gray-100'
                }`}>
                  <Button variant="primary" onClick={handleSaveStep} disabled={isSaving} className="flex-1 sm:flex-none">
                    {isSaving ? t.saving : editingStep ? t.updateStepBtn : t.saveStepBtn}
                  </Button>
                  <Button variant="secondary" onClick={cancelForm} className="flex-1 sm:flex-none">
                    {t.cancel}
                  </Button>
                </div>
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
              <div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-[#E0E0E2]' : 'text-gray-900'}`}>{t.executionResults}</h2>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8A8A8F]' : 'text-gray-500'}`}>
                  {language === 'id' ? `Percobaan ke-${executionIteration}` : `Run #${executionIteration}`}
                </p>
              </div>
              <Badge variant={executionResult.status === 'PASSED' ? 'success' : 'danger'}>
                {executionResult.status === 'PASSED' ? '✓' : '✗'} {executionResult.status}
              </Badge>
            </div>

            {/* Simple 2-Column Stats Row */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className={`flex-1 min-w-[200px] p-4 rounded-lg border ${isDark ? 'bg-[#0F170F] border-[#34D399]/20' : 'bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-[#8A8A8F]' : 'text-green-600'}`}>{t.passed || 'Passed'}</p>
                    <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-[#34D399]' : 'text-green-700'}`}>{executionResult.passedSteps || 0}</p>
                  </div>
                  <CheckCircle2 size={24} className={`opacity-50 ${isDark ? 'text-[#34D399]' : 'text-green-600'}`} />
                </div>
              </div>
              <div className={`flex-1 min-w-[200px] p-4 rounded-lg border ${isDark ? 'bg-[#170F0F] border-[#F87171]/20' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-[#8A8A8F]' : 'text-red-600'}`}>{t.failed || 'Failed'}</p>
                    <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-[#F87171]' : 'text-red-700'}`}>{executionResult.failedSteps || 0}</p>
                  </div>
                  <XCircle size={24} className={`opacity-50 ${isDark ? 'text-[#F87171]' : 'text-red-600'}`} />
                </div>
              </div>
              <div className={`flex-1 min-w-[200px] p-4 rounded-lg border ${isDark ? 'bg-[#161618] border-[#2A2A2D]' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-[#8A8A8F]' : 'text-blue-600'}`}>{t.duration || 'Duration'}</p>
                    <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-[#E0E0E2]' : 'text-blue-700'}`}>{executionResult.duration ? `${(executionResult.duration / 1000).toFixed(2)}s` : '−'}</p>
                  </div>
                  <Clock size={24} className={`opacity-50 ${isDark ? 'text-[#FBBF24]' : 'text-blue-600'}`} />
                </div>
              </div>
            </div>



            {executionResult.errorMessage && (
              <div className="p-3 bg-red-950/30 border border-red-700/40 rounded-lg text-red-400 text-sm mb-4">
                <strong>Error:</strong>
                <StepErrorDetail 
                  errorMessage={executionResult.errorMessage} 
                  onRetest={handleExecute}
                  step={executionResult.failedStepIndex !== undefined ? steps[executionResult.failedStepIndex] : null}
                  pageUrl={scenario?.url}
                  onApplyAIFix={executionResult.failedStepIndex !== undefined ? (locator) => handleApplyAIFix(steps[executionResult.failedStepIndex]?.id, locator) : null}
                  onAutoRetry={executionResult.failedStepIndex !== undefined ? (selector) => handleAutoRetry(steps[executionResult.failedStepIndex]?.id, selector) : null}
                  isAutoRetrying={isAutoRetrying}
                  executionId={executionResult.id}
                />
              </div>
            )}

            {/* Step Results - Collapsible */}
            {executionResult.stepResults && executionResult.stepResults.length > 0 && (
              <div>
                <button
                  onClick={() => setShowStepDetails(!showStepDetails)}
                  className="flex items-center gap-2 text-sm font-medium text-[#5E6AD2] hover:text-[#8B95E3] transition mb-3"
                >
                  <span>{showStepDetails ? '▼' : '▶'}</span>
                  <span>Detail Per-Step ({executionResult.stepResults.length})</span>
                </button>

                {showStepDetails && (
                  <div className="space-y-3">
                    {executionResult.stepResults.map((result, idx) => (
                      <div
                        key={result.id || idx}
                        className={`p-3 rounded-lg border ${
                          result.status === 'PASSED'
                            ? isDark ? 'bg-green-900/20 border-green-700/30' : 'bg-green-50 border-green-200'
                            : isDark ? 'bg-red-900/20 border-red-700/30' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-lg ${result.status === 'PASSED' ? isDark ? 'text-green-400' : 'text-green-600' : isDark ? 'text-red-400' : 'text-red-600'}`}>
                            {result.status === 'PASSED' ? '✓' : '✗'}
                          </span>
                          <div className="flex-1">
                            <p className={`font-medium ${isDark ? 'text-[#E0E0E2]' : 'text-gray-900'}`}>
                              Step {result.testStep?.stepNumber || idx + 1}: {result.testStep?.type || result.type} — {result.testStep?.description || result.description || '-'}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-[#888]' : 'text-gray-500'}`}>
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
                                onAutoRetry={result.testStep ? (selector) => handleAutoRetry(result.testStep.id, selector) : null}
                                isAutoRetrying={isAutoRetrying}
                                executionId={executionResult.id}
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
                              className="flex-shrink-0 border-2 border-[#2D2D2F] rounded-lg overflow-hidden hover:border-[#5E6AD2] transition cursor-pointer"
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
                )}
              </div>
            )}
          </Card>
          </div>
        )}

        {/* Screenshot Modal */}
        {screenshotModal && (
          <div
            className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4"
            onClick={() => setScreenshotModal(null)}
          >
            <div
              className="bg-[#1A1A1C] border border-[#2D2D2F] rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-[#2D2D2F]">
                <h3 className="text-lg font-semibold text-[#E0E0E2]">
                  📸 Step {screenshotModal.stepNumber}: {screenshotModal.description}
                </h3>
                <button
                  onClick={() => setScreenshotModal(null)}
                  className="text-[#666] hover:text-[#E0E0E2] text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <img
                  src={screenshotModal.url}
                  alt={`Screenshot step ${screenshotModal.stepNumber}`}
                  className="w-full rounded-lg border border-[#2D2D2F]"
                />
              </div>
              <div className="flex justify-end p-4 border-t border-[#2D2D2F]">
                <a
                  href={screenshotModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5E6AD2] hover:text-[#6B7AE8] text-sm font-medium mr-4"
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
