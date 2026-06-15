import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Badge, Spinner, Alert, Tooltip } from '../components/ui'
import BrowserSelector from '../components/BrowserSelector'
import StepErrorDetail from '../components/StepErrorDetail'
import StepResultCard, { StepResultsSummary } from '../components/StepResultCard'
import TestStepList from '../components/TestStepList'
import { scenarioAPI, executionAPI, recorderAPI } from '../services/api'
import ExportFormatButton from '../components/ExportFormatButton'
import { CheckCircle2, XCircle, ClipboardList, Clock, HelpCircle, Globe, Play, Circle, Square, ChevronDown, ListTree, Plus, Copy, Trash2, Save, Loader2 } from 'lucide-react'

const RecordIcon = (props) => <Circle {...props} className="text-red-500 fill-red-500" />

const i18n = {
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
    runScenario: 'Run Scenario',
    stopRecording: 'Stop',
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
    deleteSelectedSteps: (c) => `Delete ${c}`,
    copySteps: 'Copy',
    copySelectedSteps: (c) => `Copy ${c}`,
    deleteSteps: 'Delete',
    copying: 'Copying...',
    stepsCopied: (c) => `${c} step${c !== 1 ? 's' : ''} copied`,
    copyStepsError: 'Failed to copy steps',
    addStep: 'Add Step',
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
    selectorHelpTooltip: 'How to find a selector:\n1. Right-click the element → Inspect\n2. Has id? Use #id (e.g. #search)\n3. Or right-click the HTML tag → Copy → Copy XPath',
    selectorHelpShort: 'Tip: Inspect the element in your browser, then use #id or Copy XPath.',
    fieldValue: 'Value',
    fieldMetadata: 'Metadata (JSON)',
    required: 'required',
    closeDialog: 'Close dialog',
  
}

const STEP_TYPES = [
  { value: 'NAVIGATE', label: 'Navigate', icon: '🌐', fields: ['value'], placeholder: { value: 'https://example.com' } },
  { value: 'CLICK', label: 'Click', icon: '👆', fields: ['selector', 'metadata'], placeholder: { selector: '#button-id, .class-name, or //xpath', metadata: '{"maxRetries":2} (optional)' } },
  { value: 'FILL', label: 'Fill', icon: '✏️', fields: ['selector', 'value', 'metadata'], placeholder: { selector: '#input-id or //xpath', value: 'Text to type', metadata: '{"maxRetries":2} (optional)' } },
  { value: 'HOVER', label: 'Hover', icon: '🖱️', fields: ['selector', 'metadata'], placeholder: { selector: '#element or //xpath', metadata: '{"maxRetries":1} (optional)' } },
  { value: 'SCROLL', label: 'Scroll', icon: '↕️', fields: ['selector', 'value'], placeholder: { selector: '#container (optional)', value: '300 (px, positif=bawah, negatif=atas)' } },
  { value: 'FILE_UPLOAD', label: 'File Upload', icon: '📁', fields: ['selector', 'value'], placeholder: { selector: 'input[type="file"]', value: '/path/to/file.pdf (pipe-separated for multiple)' } },
  { value: 'DRAG', label: 'Drag', icon: '🖱️', fields: ['selector', 'value', 'metadata'], placeholder: { selector: '#source-element (draggable)', value: '#target-element (drop zone)', metadata: '{"maxRetries":1} (optional)' } },
  { value: 'MOCK_ROUTE', label: 'Mock Route', icon: '🔀', fields: ['value', 'metadata'], placeholder: { value: '**/api/users* (URL glob pattern)', metadata: '{"status":200,"body":{"ok":true},"contentType":"application/json"}' } },
  { value: 'SCREENSHOT', label: 'Screenshot', icon: '📸', fields: [], placeholder: {} },
  { value: 'WAIT', label: 'Wait', icon: '⏱️', fields: ['value'], placeholder: { value: '1000 (ms)' } },
  { value: 'ASSERTION', label: 'Assertion', icon: '✅', fields: ['selector', 'value', 'metadata'], placeholder: { selector: '#element or //xpath', value: 'Expected text, regex:/pattern/, count:3, visible, not-exists', metadata: '{"maxRetries":2} (optional)' } },
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
  const [isCopyingBulk, setIsCopyingBulk] = useState(false)

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }
  const t = i18n
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

  const parseStepMetadata = (metadata) => {
    if (!metadata) return null
    if (typeof metadata === 'object') return metadata
    try {
      return JSON.parse(metadata)
    } catch {
      return null
    }
  }

  const handleBulkCopy = async () => {
    const count = selectedStepIds.size
    if (count === 0) return

    const stepsToCopy = steps.filter((s) => selectedStepIds.has(s.id))
    if (stepsToCopy.length === 0) return

    setIsCopyingBulk(true)
    setError(null)
    try {
      for (const step of stepsToCopy) {
        await scenarioAPI.createStep(
          id,
          null,
          step.type,
          step.description,
          step.selector || null,
          step.value || null,
          parseStepMetadata(step.metadata)
        )
      }
      showSuccess(t.stepsCopied(count))
      setSelectedStepIds(new Set())
      await loadSteps()
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || t.copyStepsError)
      await loadSteps()
    } finally {
      setIsCopyingBulk(false)
    }
  }

  const handleReorderSteps = async (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    if (fromIndex < 0 || toIndex < 0 || fromIndex >= steps.length || toIndex >= steps.length) return

    const newSteps = [...steps]
    const [moved] = newSteps.splice(fromIndex, 1)
    newSteps.splice(toIndex, 0, moved)

    const stepOrders = newSteps.map((s, i) => ({
      stepId: s.id,
      sequenceNumber: i + 1,
    }))

    setSteps(newSteps.map((s, i) => ({ ...s, stepNumber: i + 1 })))

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
    }, 400)
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
            <ExportFormatButton format="primary" onClick={() => navigate('/scenarios')}>
              {t.goBackToScenarios}
            </ExportFormatButton>
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

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <ExportFormatButton
              format="primary"
              icon={Globe}
              onClick={() => setShowBrowserSelector(!showBrowserSelector)}
              disabled={isExecuting}
              className="capitalize"
            >
              {selectedDevice || selectedBrowser}
            </ExportFormatButton>

            {!isRecording ? (
              <ExportFormatButton
                format="pdf"
                icon={RecordIcon}
                onClick={() => {
                  setRecordingUrl(scenario.url || '')
                  setShowRecordingPanel(true)
                }}
                disabled={isExecuting}
              >
                Record
              </ExportFormatButton>
            ) : (
              <ExportFormatButton
                format="pdf"
                icon={isStoppingRecording ? Loader2 : Square}
                onClick={handleStopRecording}
                disabled={isStoppingRecording}
                className={isStoppingRecording ? '[&_svg]:animate-spin' : ''}
              >
                {isStoppingRecording ? '…' : t.stopRecording}
              </ExportFormatButton>
            )}

            <ExportFormatButton
              format="csv"
              icon={isExecuting ? Loader2 : Play}
              onClick={handleExecute}
              disabled={isExecuting || steps.length === 0 || isRecording}
              className={isExecuting ? '[&_svg]:animate-spin' : ''}
            >
              {isExecuting ? t.running : t.runScenario}
            </ExportFormatButton>
          </div>
        </div>

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {successMsg && <Alert type="success" message={successMsg} />}

        {/* Browser Selector */}
        {showBrowserSelector && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-base font-bold ${'text-slate-900'}`}>Browser &amp; Device</h2>
              <button
                onClick={() => setShowBrowserSelector(false)}
                className={`text-xl leading-none ${'text-slate-400 hover:text-slate-600'}`}
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
                  <ExportFormatButton
                    format="pdf"
                    icon={isStartingRecording ? Loader2 : RecordIcon}
                    onClick={handleStartRecording}
                    disabled={isStartingRecording}
                    className={isStartingRecording ? '[&_svg]:animate-spin' : ''}
                  >
                    {isStartingRecording ? t.openingBrowser : 'Start Recording'}
                  </ExportFormatButton>
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
                    <div className="flex flex-wrap gap-2">
                      <ExportFormatButton
                        format="csv"
                        icon={isSavingRecording ? Loader2 : Save}
                        onClick={handleSaveRecordedSteps}
                        disabled={isSavingRecording}
                        className={isSavingRecording ? '[&_svg]:animate-spin' : ''}
                      >
                        {isSavingRecording ? t.saving : t.saveSteps(recordingSteps.length)}
                      </ExportFormatButton>
                      <ExportFormatButton format="json" icon={null} onClick={handleDiscardRecording}>
                        {t.discard}
                      </ExportFormatButton>
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
            {!showStepForm && (
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Test step actions">
                <ExportFormatButton
                  format="json"
                  icon={isCopyingBulk ? Loader2 : Copy}
                  onClick={handleBulkCopy}
                  disabled={selectedStepIds.size === 0 || isCopyingBulk || isDeletingBulk}
                  className={isCopyingBulk ? '[&_svg]:animate-spin' : ''}
                >
                  {isCopyingBulk
                    ? t.copying
                    : selectedStepIds.size > 0
                      ? t.copySelectedSteps(selectedStepIds.size)
                      : t.copySteps}
                </ExportFormatButton>
                <ExportFormatButton
                  format="pdf"
                  icon={isDeletingBulk ? Loader2 : Trash2}
                  onClick={handleBulkDelete}
                  disabled={selectedStepIds.size === 0 || isDeletingBulk || isCopyingBulk}
                  className={isDeletingBulk ? '[&_svg]:animate-spin' : ''}
                >
                  {isDeletingBulk
                    ? t.deleting
                    : selectedStepIds.size > 0
                      ? t.deleteSelectedSteps(selectedStepIds.size)
                      : t.deleteSteps}
                </ExportFormatButton>
                <ExportFormatButton format="primary" icon={Plus} onClick={openAddForm}>
                  {t.addStep}
                </ExportFormatButton>
              </div>
            )}
          </div>

          {/* Step Form Modal */}
          {showStepForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
              {/* Backdrop */}
              <div
                className={`absolute inset-0 backdrop-blur-sm ${
                  'bg-black/40'
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
                  'bg-white border-gray-200'
                }`}
              >
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${
                  'border-gray-100'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#5E6AD2]/15 flex items-center justify-center">
                      <span className="text-[#5E6AD2] text-sm">{editingStep ? '✏️' : '+'}</span>
                    </div>
                    <h3 className={`text-lg font-semibold ${
                      'text-gray-900'
                    }`}>
                      {editingStep ? t.editStep : t.addNewStep}
                    </h3>
                  </div>
                  <button
                    onClick={cancelForm}
                    aria-label={t.closeDialog}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
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
                        'text-gray-700'
                      }`}>
                        {t.fieldType} <span className={`text-xs ${'text-red-600'}`}>*{t.required}</span>
                      </label>
                      <select
                        value={stepForm.type}
                        onChange={(e) => setStepForm({ ...stepForm, type: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#5E6AD2] focus:outline-none transition-colors ${
                          'bg-white border-gray-300 text-gray-900'
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
                        'text-gray-700'
                      }`}>
                        {t.fieldDescription} <span className={`text-xs ${'text-red-600'}`}>*{t.required}</span>
                      </label>
                      <input
                        type="text"
                        value={stepForm.description}
                        onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
                        placeholder={t.stepDescriptionPlaceholder}
                        autoFocus
                        className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#5E6AD2] focus:outline-none transition-colors ${
                          'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>

                    {/* Selector */}
                    {getStepTypeConfig(stepForm.type).fields.includes('selector') && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <label className="text-sm font-medium text-gray-700">
                            {t.fieldSelector}
                          </label>
                          <Tooltip text={t.selectorHelpTooltip} position="right" multiline>
                            <HelpCircle
                              size={14}
                              className="text-gray-400 hover:text-[#5E6AD2] cursor-help shrink-0"
                              aria-label="How to find a selector"
                            />
                          </Tooltip>
                        </div>
                        <input
                          type="text"
                          value={stepForm.selector}
                          onChange={(e) => setStepForm({ ...stepForm, selector: e.target.value })}
                          placeholder={getStepTypeConfig(stepForm.type).placeholder.selector}
                          className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#5E6AD2] focus:outline-none transition-colors ${
                            'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                        <p className="mt-1 text-xs text-gray-500">{t.selectorHelpShort}</p>
                      </div>
                    )}

                    {/* Value */}
                    {getStepTypeConfig(stepForm.type).fields.includes('value') && (
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${
                          'text-gray-700'
                        }`}>
                          {t.fieldValue}
                        </label>
                        <input
                          type="text"
                          value={stepForm.value}
                          onChange={(e) => setStepForm({ ...stepForm, value: e.target.value })}
                          placeholder={getStepTypeConfig(stepForm.type).placeholder.value}
                          className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#5E6AD2] focus:outline-none transition-colors ${
                            'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                      </div>
                    )}

                    {/* Metadata */}
                    {getStepTypeConfig(stepForm.type).fields.includes('metadata') && (
                      <div className="md:col-span-2">
                        <label className={`block text-sm font-medium mb-1 ${
                          'text-gray-700'
                        }`}>
                          {t.fieldMetadata}
                        </label>
                        <textarea
                          value={stepForm.metadata}
                          onChange={(e) => setStepForm({ ...stepForm, metadata: e.target.value })}
                          placeholder={getStepTypeConfig(stepForm.type).placeholder.metadata}
                          rows={3}
                          className={`w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#5E6AD2] focus:outline-none font-mono text-sm transition-colors ${
                            'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Type hint */}
                  {t.hints[stepForm.type] && (
                    <div className={`mt-4 px-3 py-2 rounded-lg text-sm ${
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {t.hints[stepForm.type]}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className={`flex flex-wrap gap-3 px-6 py-4 border-t ${
                  'border-gray-100'
                }`}>
                  <ExportFormatButton
                    format="primary"
                    icon={isSaving ? Loader2 : Save}
                    onClick={handleSaveStep}
                    disabled={isSaving}
                    className={`flex-1 sm:flex-none justify-center ${isSaving ? '[&_svg]:animate-spin' : ''}`}
                  >
                    {isSaving ? t.saving : editingStep ? t.updateStepBtn : t.saveStepBtn}
                  </ExportFormatButton>
                  <ExportFormatButton format="json" icon={null} onClick={cancelForm} className="flex-1 sm:flex-none justify-center">
                    {t.cancel}
                  </ExportFormatButton>
                </div>
              </div>
            </div>
          )}

          {/* Steps List */}
          <TestStepList
            steps={steps}
            onReorderSteps={handleReorderSteps}
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
                <h2 className={`text-xl font-bold ${'text-gray-900'}`}>{t.executionResults}</h2>
                <p className={`text-xs mt-0.5 ${'text-gray-500'}`}>
                  {`Run #${executionIteration}`}
                </p>
              </div>
              <Badge variant={executionResult.status === 'PASSED' ? 'success' : 'danger'}>
                {executionResult.status === 'PASSED' ? '✓' : '✗'} {executionResult.status}
              </Badge>
            </div>

            {/* Simple 2-Column Stats Row */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className={`flex-1 min-w-[200px] p-4 rounded-lg border ${'bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${'text-green-600'}`}>{t.passed || 'Passed'}</p>
                    <p className={`text-2xl font-bold mt-1 ${'text-green-700'}`}>{executionResult.passedSteps || 0}</p>
                  </div>
                  <CheckCircle2 size={24} className={`opacity-50 ${'text-green-600'}`} />
                </div>
              </div>
              <div className={`flex-1 min-w-[200px] p-4 rounded-lg border ${'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${'text-red-600'}`}>{t.failed || 'Failed'}</p>
                    <p className={`text-2xl font-bold mt-1 ${'text-red-700'}`}>{executionResult.failedSteps || 0}</p>
                  </div>
                  <XCircle size={24} className={`opacity-50 ${'text-red-600'}`} />
                </div>
              </div>
              <div className={`flex-1 min-w-[200px] p-4 rounded-lg border ${'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${'text-blue-600'}`}>{t.duration || 'Duration'}</p>
                    <p className={`text-2xl font-bold mt-1 ${'text-blue-700'}`}>{executionResult.duration ? `${(executionResult.duration / 1000).toFixed(2)}s` : '−'}</p>
                  </div>
                  <Clock size={24} className={`opacity-50 ${'text-blue-600'}`} />
                </div>
              </div>
            </div>



            {executionResult.errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm mb-4">
                <strong className="font-semibold">Error:</strong>
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
                <ExportFormatButton
                  format="primary"
                  icon={ListTree}
                  onClick={() => setShowStepDetails(!showStepDetails)}
                  className="mb-3"
                  trailing={
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${showStepDetails ? 'rotate-180' : ''}`}
                    />
                  }
                >
                  Detail Per-Step ({executionResult.stepResults.length})
                </ExportFormatButton>

                {showStepDetails && (
                  <div className="space-y-3">
                    <StepResultsSummary stepResults={executionResult.stepResults} />
                    {executionResult.stepResults.map((result, idx) => (
                      <StepResultCard
                        key={result.id || idx}
                        result={result}
                        index={idx}
                        onScreenshotClick={
                          result.screenshot
                            ? () =>
                                setScreenshotModal({
                                  url: result.screenshot.url,
                                  stepNumber: result.testStep?.stepNumber || idx + 1,
                                  description: result.testStep?.description || '',
                                })
                            : undefined
                        }
                        onRetest={handleExecute}
                        onApplyAIFix={
                          result.testStep
                            ? (locator) => handleApplyAIFix(result.testStep.id, locator)
                            : null
                        }
                        onAutoRetry={
                          result.testStep
                            ? (selector) => handleAutoRetry(result.testStep.id, selector)
                            : null
                        }
                        isAutoRetrying={isAutoRetrying}
                        executionId={executionResult.id}
                      />
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
                <ExportFormatButton format="json" icon={null} onClick={() => setScreenshotModal(null)}>
                  Tutup
                </ExportFormatButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
