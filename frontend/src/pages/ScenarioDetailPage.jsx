import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Layout from '../components/Layout'
import { Card, Badge, Spinner, Alert, Tooltip } from '../components/ui'
import BrowserSelector from '../components/BrowserSelector'
import StepErrorDetail from '../components/StepErrorDetail'
import StepResultCard, { StepResultsSummary } from '../components/StepResultCard'
import TestStepList from '../components/TestStepList'
import { scenarioAPI, executionAPI, recorderAPI, agentAPI } from '../services/api'
import ExportFormatButton from '../components/ExportFormatButton'
import { CheckCircle2, XCircle, ClipboardList, Clock, HelpCircle, Globe, Play, Circle, Square, ChevronDown, ListTree, Plus, Copy, Trash2, Save, Loader2, Zap, Link2, ImagePlus, Upload } from 'lucide-react'
import ShareRunModal from '../components/ShareRunModal'
import TargetKindBanner, { defaultTargetKindLabels } from '../components/TargetKindBanner'
import ManualRunPanel from '../components/ManualRunPanel'
import CaseAttachmentsPanel from '../components/CaseAttachmentsPanel'
import AttachmentPreviewModal from '../components/AttachmentPreviewModal'
import CaseRunsPanel from '../components/CaseRunsPanel'
import CaseHistoryPanel from '../components/CaseHistoryPanel'
import { useFolderStore } from '../store/folderStore'
import toast from 'react-hot-toast'

const RecordIcon = (props) => <Circle {...props} className="text-red-500 fill-red-500" />

const i18n = {
    loadScenarioError: 'Failed to load scenario',
    loadStepsError: 'Failed to load test steps',
    typeRequired: 'Type and description are required',
    navigateUrlRequired: 'NAVIGATE steps need a URL in Value (or set the scenario target URL first)',
    invalidNavigateUrl: 'NAVIGATE value must be a valid http(s) URL',
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
    recordingStarted: (msg) => `Recording started\n${msg}`,
    recordingPopupBlocked: 'Popup diblokir browser. Izinkan popup untuk situs ini, lalu mulai recording lagi.',
    browserRunnerPopupBlocked: 'Popup Browser Runner diblokir. Izinkan popup untuk situs ini, lalu Run lagi.',
    startingBrowserRunner: 'Opening Browser Runner...',
    runBlockedInternal:
      'Target URL berada di jaringan internal/VPN. Run di cloud production tidak bisa membuka halaman ini (akan timeout). Rekam dari PC Anda tetap bisa; untuk playback jalankan backend di jaringan yang sama atau pakai URL publik.',
    runWarnInternal:
      'URL target tampak internal/VPN. Run hanya akan berhasil jika server runner ada di jaringan yang sama. Lanjutkan?',
    targetPublic: 'Publik',
    targetInternal: 'Internal / VPN',
    targetInternalRunHint: 'Cloud Run diblokir untuk URL internal — pakai backend lokal di LAN yang sama, atau Queue local agent.',
    queueLocalAgent: 'Queue local agent',
    queueLocalAgentHint:
      'Job masuk antrean. Shared VPN runner (install-windows-task) akan mengambilnya — atau jalankan npm run agent di PC VPN.',
    queueLocalAgentError: 'Gagal mengantrekan job local agent',
    agentJobStatus: 'Local agent job',
    agentJobQueued: 'Menunggu agent…',
    agentJobClaimed: 'Agent sedang menjalankan…',
    agentJobCompleted: 'Local agent selesai',
    agentJobFailed: 'Local agent gagal',
    agentJobCancelled: 'Job dibatalkan',
    cancelAgentJob: 'Batalkan antrean',
    viewAgentExecution: 'Buka hasil execution',
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
    runScenario: 'Jalankan',
    runOnThisPc: 'Jalankan di PC ini',
    manualRun: 'Manual Run',
    manualRunHint: 'Checklist Pass/Fail di browser Anda — cocok untuk staging internal tanpa agent.',
    manualRunStarted: 'Manual run dimulai — tandai Pass/Fail per step.',
    manualRunFinished: (status) => `Manual run selesai: ${status}`,
    manualRunCancelled: 'Manual run dibatalkan',
    liveRunIsolatedHint:
      'Run memakai browser bersih (tanpa cookie dari run sebelumnya).',
    stopRecording: 'Stop',
    recordingActive: 'Sedang merekam…',
    recordingMode: 'Rekam skenario',
    startRecordingHint: 'Masukkan URL, lalu Rekam. Interaksi di tab target akan jadi step.',
    urlTarget: 'URL target',
    openingBrowser: 'Membuka browser…',
    startRecording: 'Rekam',
    recordingOverviewDirectTitle: 'Situs asli (default)',
    recordingOverviewDirectBody:
      'Buka website asli di tab baru. Cocok untuk hampir semua kasus, termasuk target internal.',
    recordingOverviewDirectCsp:
      'Kalau situs memblokir recorder: salin script di panel → paste di Console tab target.',
    recordingSetupTitle: 'Pasang recorder di tab target',
    recordingSetupStep1: 'Tab target sudah dibuka (bukan halaman panduan).',
    recordingSetupStep2: 'Di tab target: F12 → Console. Jika diminta, ketik allow pasting lalu Enter.',
    recordingSetupStep3: 'Klik Salin script di bawah, lalu Ctrl+V → Enter di Console.',
    recordingSetupStep4: 'Jika muncul “Hubungkan bridge”, klik sekali dan izinkan popup (jendela jembatan kecil).',
    recordingCopyScript: 'Salin script',
    recordingScriptCopied: 'Script disalin — paste di Console tab target.',
    recordingCopyScriptError: 'Gagal menyalin script. Coba lagi atau buka panduan cadangan.',
    recordingOpenGuide: 'Buka panduan cadangan',
    recordingBridgeHint: 'Kalau bridge terbuka: boleh dikecilkan, jangan ditutup sampai Stop.',
    recordingOverviewProxyTitle: 'Lewat proxy app',
    recordingOverviewProxyBody:
      'Satu tab di domain aplikasi. Lebih cepat, tapi tampilan beberapa situs bisa kurang lengkap.',
    recordingOverviewProxyWarn:
      'Tampilan proxy bisa berbeda dari web asli → selector kadang rapuh saat Play.',
    recordingOverviewInternalLock:
      'Target internal: mode dikunci ke situs asli (proxy cloud tidak dipakai).',
    recordingOverviewSelectMode: 'Mode rekam lanjutan',
    recordingAdvanced: 'Advanced',
    recordingAdvancedHide: 'Sembunyikan advanced',
    stepsRecorded: (c) => `${c} step${c !== 1 ? 's' : ''} terekam`,
    interactionHint: '— interaksi di tab target…',
    waitingForInteraction: 'Menunggu interaksi di tab rekaman…',
    saving: 'Menyimpan…',
    saveSteps: (c) => `Simpan ${c} step`,
    discard: 'Buang',
    deleting: 'Menghapus…',
    deleteSelectedSteps: (c) => `Hapus ${c}`,
    copySteps: 'Salin',
    copySelectedSteps: (c) => `Salin ${c}`,
    deleteSteps: 'Hapus',
    copying: 'Menyalin…',
    stepsCopied: (c) => `${c} step disalin`,
    copyStepsError: 'Gagal menyalin step',
    addStep: 'Tambah Step',
    editStep: 'Edit Step',
    addNewStep: 'Tambah Step Baru',
    stepDescriptionPlaceholder: 'Deskripsi step',
    saveStepBtn: 'Simpan Step',
    updateStepBtn: 'Update Step',
    cancel: 'Batal',
    executionResults: 'Hasil eksekusi',
    shareRun: 'Bagikan',
    shareRunHint: 'Buat link baca-saja untuk run ini',
    passed: 'Lulus',
    failed: 'Gagal',
    duration: 'Durasi',
    fixing: 'Memperbaiki…',
    autoRetryError: 'Auto-retry gagal',
    hints: {
      NAVIGATE: '💡 Isi URL di field Value',
      CLICK: '💡 Isi CSS selector atau XPath elemen yang diklik',
      FILL: '💡 Isi selector input dan teks yang diketik',
      SCREENSHOT: '💡 Ambil screenshot halaman saat ini',
      WAIT: '💡 Isi waktu tunggu dalam ms (1000 = 1 detik)',
      ASSERTION: '💡 Pastikan elemen ada di halaman, opsional cek teks',
      API_CALL: '💡 Isi endpoint URL dan metadata (JSON)',
    },
    goBackToScenarios: 'Kembali ke Scenarios',
    fieldType: 'Type',
    fieldDescription: 'Description',
    fieldExpectedResult: 'Expected result',
    expectedResultPlaceholder: 'Apa yang harus terlihat / terjadi setelah step ini',
    fieldSelector: 'Selector',
    selectorHelpTooltip: 'Cara dapat selector:\n1. Klik kanan elemen → Inspect\n2. Ada id? Pakai #id\n3. Atau Copy → Copy XPath',
    selectorHelpShort: 'Tip: Inspect elemen di browser, lalu pakai #id atau Copy XPath.',
    fieldValue: 'Value',
    fieldMetadata: 'Metadata (JSON)',
    required: 'wajib',
    optional: 'opsional',
    closeDialog: 'Tutup',
    descriptionRequired: 'Description wajib diisi',
    manualStepHint: '💡 Mode manual: tulis aksi tester + expected result. Selector / Navigate tidak perlu.',
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

/** Human-friendly types for manual checklist — still maps to existing StepType enum */
const MANUAL_STEP_TYPES = [
  { value: 'ASSERTION', label: 'Verify', icon: '✅', fields: [], placeholder: {} },
  { value: 'CLICK', label: 'Action', icon: '👉', fields: [], placeholder: {} },
  { value: 'WAIT', label: 'Setup', icon: '📋', fields: [], placeholder: {} },
  { value: 'SCREENSHOT', label: 'Observe', icon: '👁️', fields: [], placeholder: {} },
]

const emptyStep = {
  type: 'NAVIGATE',
  description: '',
  expectedResult: '',
  selector: '',
  value: '',
  metadata: '',
}

const emptyManualStep = {
  type: 'ASSERTION',
  description: '',
  expectedResult: '',
  selector: '',
  value: '',
  metadata: '',
}

const PRIORITY_SELECT_COLORS = {
  LOW: 'border-sky-300 bg-sky-50 text-sky-800',
  MEDIUM: 'border-amber-300 bg-amber-50 text-amber-900',
  HIGH: 'border-orange-400 bg-orange-50 text-orange-900',
  CRITICAL: 'border-red-400 bg-red-50 text-red-800',
}

const CASE_TYPE_SELECT_COLORS = {
  Functional: 'border-indigo-300 bg-indigo-50 text-indigo-900',
  Regression: 'border-violet-300 bg-violet-50 text-violet-900',
  Smoke: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  Other: 'border-slate-300 bg-slate-50 text-slate-700',
}

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
  // Default headless — safer in Docker/production
  const [headlessMode, setHeadlessMode] = useState(true)
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
  const [recordingModeChoice, setRecordingModeChoice] = useState('client-direct')
  const [showRecordAdvanced, setShowRecordAdvanced] = useState(false)
  const [recordingMethod, setRecordingMethod] = useState(null) // 'client-direct' | 'proxy' | null
  const [injectScriptText, setInjectScriptText] = useState('')
  const [clientGuideUrl, setClientGuideUrl] = useState(null)
  const [isCopyingInjectScript, setIsCopyingInjectScript] = useState(false)
  const [targetKind, setTargetKind] = useState(null) // 'public' | 'internal' | null
  const [targetInfoMessage, setTargetInfoMessage] = useState('')
  const [targetAddresses, setTargetAddresses] = useState([])
  const [executionBlocked, setExecutionBlocked] = useState(false)
  const [isProbingTarget, setIsProbingTarget] = useState(false)
  const [agentJob, setAgentJob] = useState(null)
  const [isQueueingAgent, setIsQueueingAgent] = useState(false)
  const [shareExecutionId, setShareExecutionId] = useState(null)
  const [manualRun, setManualRun] = useState(null) // { executionId, recorded: { [stepId]: {...} } }
  const [isStartingManualRun, setIsStartingManualRun] = useState(false)
  /** automated = Playwright; manual = checklist QA */
  const [runMode, setRunMode] = useState('manual')
  const [caseMeta, setCaseMeta] = useState({
    precondition: '',
    expectedResult: '',
    priority: 'MEDIUM',
    caseType: 'Functional',
  })
  const [isSavingCaseMeta, setIsSavingCaseMeta] = useState(false)
  const [uploadingExpectedImage, setUploadingExpectedImage] = useState(false)
  const [deletingExpectedImageId, setDeletingExpectedImageId] = useState(null)
  const [previewAttachment, setPreviewAttachment] = useState(null)
  const expectedImageInputRef = useRef(null)
  /** Testiny-style case tabs */
  const [caseTab, setCaseTab] = useState('details') // details | attachments | runs | history
  const [caseAttachments, setCaseAttachments] = useState([])
  const agentPollRef = useRef(null)
  const targetProbeRef = useRef(0)
  const recordTokenRef = useRef(null)
  const bridgeWinRef = useRef(null)
  const targetWinRef = useRef(null)

  // Probe scenario URL for Run badge (public vs internal) whenever scenario loads
  useEffect(() => {
    const url = (scenario?.url || '').trim()
    if (!url || !/^https?:\/\//i.test(url)) {
      setTargetKind(null)
      setTargetInfoMessage('')
      setTargetAddresses([])
      setExecutionBlocked(false)
      return
    }

    const probeId = ++targetProbeRef.current
    const timer = setTimeout(async () => {
      setIsProbingTarget(true)
      try {
        const res = await recorderAPI.targetInfo(url)
        if (probeId !== targetProbeRef.current) return
        const kind = res.data.targetKind === 'internal' ? 'internal' : 'public'
        setTargetKind(kind)
        setTargetInfoMessage(res.data.reachability?.message || '')
        setTargetAddresses(Array.isArray(res.data.reachability?.addresses) ? res.data.reachability.addresses : [])
        setExecutionBlocked(Boolean(res.data.executionBlocked))
      } catch {
        if (probeId !== targetProbeRef.current) return
        setTargetKind(null)
        setTargetInfoMessage('')
        setTargetAddresses([])
        setExecutionBlocked(false)
      } finally {
        if (probeId === targetProbeRef.current) setIsProbingTarget(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [scenario?.url])

  // Legacy ?autoRecord=1 — open panel in automated mode (Record is automation-only)
  useEffect(() => {
    const params = new URLSearchParams(routeLocation.search)
    if (params.get('autoRecord') === '1') {
      setRunMode('automated')
      setShowRecordingPanel(true)
      setRecordingUrl(scenario?.url || '')
      window.history.replaceState(null, '', routeLocation.pathname)
    }
  }, [routeLocation, scenario])

  // Probe public vs internal when recording URL changes (for overview auto-select)
  useEffect(() => {
    if (!showRecordingPanel || isRecording) return
    const url = (recordingUrl.trim() || scenario?.url || '').trim()
    if (!url || !/^https?:\/\//i.test(url)) {
      setTargetKind(null)
      setTargetInfoMessage('')
      setTargetAddresses([])
      return
    }

    const probeId = ++targetProbeRef.current
    const timer = setTimeout(async () => {
      setIsProbingTarget(true)
      try {
        const res = await recorderAPI.targetInfo(url)
        if (probeId !== targetProbeRef.current) return
        const kind = res.data.targetKind === 'internal' ? 'internal' : 'public'
        setTargetKind(kind)
        setTargetInfoMessage(res.data.reachability?.message || '')
        setTargetAddresses(Array.isArray(res.data.reachability?.addresses) ? res.data.reachability.addresses : [])
        setExecutionBlocked(Boolean(res.data.executionBlocked))
        // Always recommend client-direct; lock to it for internal
        setRecordingModeChoice('client-direct')
      } catch {
        if (probeId !== targetProbeRef.current) return
        setTargetKind(null)
        setTargetInfoMessage('')
        setTargetAddresses([])
        setExecutionBlocked(false)
      } finally {
        if (probeId === targetProbeRef.current) setIsProbingTarget(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [recordingUrl, scenario?.url, showRecordingPanel, isRecording])

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
    toast.success(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const showActionError = (msg) => {
    setError(msg)
    toast.error(msg)
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
      const sc = res.data.scenario || res.data
      setScenario(sc)
      setCaseAttachments(sc.attachments || [])
      setCaseMeta({
        precondition: sc.precondition || '',
        expectedResult: sc.expectedResult || '',
        priority: sc.priority || 'MEDIUM',
        caseType: sc.caseType || 'Functional',
      })
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
      try {
        const activeRes = await executionAPI.getActiveManualRun(id)
        const execution = activeRes.data?.execution
        if (execution?.id) {
          const recorded = {}
          for (const sr of execution.stepResults || []) {
            if (sr.testStepId) {
              recorded[sr.testStepId] = {
                status: sr.status,
                notes: sr.errorMessage || '',
              }
            }
          }
          setManualRun({ executionId: execution.id, recorded })
        } else {
          setManualRun(null)
        }
      } catch {
        /* ignore */
      }
    }
    load()
  }, [loadScenario, loadSteps, id])

  // Get step type config
  const isManualMode = runMode === 'manual'
  const formStepTypes = isManualMode ? MANUAL_STEP_TYPES : STEP_TYPES
  const displayStepTypes = isManualMode
    ? [
        ...MANUAL_STEP_TYPES,
        ...STEP_TYPES.filter((st) => !MANUAL_STEP_TYPES.some((m) => m.value === st.value)),
      ]
    : STEP_TYPES

  const getStepTypeConfig = (type) =>
    formStepTypes.find((t) => t.value === type) ||
    STEP_TYPES.find((t) => t.value === type) ||
    formStepTypes[0] ||
    STEP_TYPES[0]

  // Step form handlers
  const openAddForm = () => {
    setEditingStep(null)
    if (runMode === 'manual') {
      setStepForm({ ...emptyManualStep })
    } else {
      // Only prefill Navigate+URL for the very first step — later adds stay blank
      // so we don't look like we're duplicating an existing Navigate step.
      const isFirstStep = (steps?.length || 0) === 0
      setStepForm(
        isFirstStep && scenario?.url
          ? {
              ...emptyStep,
              type: 'NAVIGATE',
              value: scenario.url,
              description: `Navigate to ${scenario.url}`,
            }
          : { ...emptyStep, type: 'CLICK', description: '', value: '', selector: '', expectedResult: '', metadata: '' }
      )
    }
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
      expectedResult: step.expectedResult || '',
      selector: step.selector || '',
      value: step.value || '',
      metadata: step.metadata || ''
    })
    setShowStepForm(true)
    setTimeout(() => {
      stepFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleSaveCaseMeta = async () => {
    if (!scenario) return
    setIsSavingCaseMeta(true)
    setError(null)
    try {
      const res = await scenarioAPI.update(
        id,
        scenario.name,
        scenario.description || '',
        scenario.url || '',
        {
          precondition: caseMeta.precondition,
          expectedResult: caseMeta.expectedResult,
          priority: caseMeta.priority,
          caseType: caseMeta.caseType,
          ownerId: scenario.ownerId || undefined,
        }
      )
      const updated = res.data.scenario || res.data
      setScenario((prev) => ({ ...prev, ...updated }))
      showSuccess('Detail test case disimpan')
    } catch (err) {
      showActionError(err.response?.data?.error || err.response?.data?.message || 'Gagal simpan detail case')
    } finally {
      setIsSavingCaseMeta(false)
    }
  }

  const refreshCaseAttachments = async () => {
    const res = await scenarioAPI.listAttachments(id)
    setCaseAttachments(res.data.attachments || [])
  }

  const expectedResultImages = (caseAttachments || []).filter(
    (a) => (a.kind || 'GENERAL') === 'EXPECTED_RESULT'
  )
  const generalAttachments = (caseAttachments || []).filter(
    (a) => (a.kind || 'GENERAL') !== 'EXPECTED_RESULT'
  )

  const handleUploadExpectedImages = async (fileList) => {
    const files = [...(fileList || [])]
    if (!files.length || !id) return
    setUploadingExpectedImage(true)
    setError(null)
    try {
      await scenarioAPI.uploadAttachments(id, files, { kind: 'EXPECTED_RESULT' })
      await refreshCaseAttachments()
      showSuccess('Gambar expected result diunggah')
    } catch (err) {
      showActionError(err.response?.data?.message || err.message || 'Gagal upload gambar expected result')
    } finally {
      setUploadingExpectedImage(false)
      if (expectedImageInputRef.current) expectedImageInputRef.current.value = ''
    }
  }

  const handleDeleteExpectedImage = async (attachmentId) => {
    if (!id || !attachmentId) return
    setDeletingExpectedImageId(attachmentId)
    setError(null)
    try {
      await scenarioAPI.deleteAttachment(id, attachmentId)
      await refreshCaseAttachments()
      showSuccess('Gambar expected result dihapus')
    } catch (err) {
      showActionError(err.response?.data?.message || err.message || 'Gagal hapus gambar')
    } finally {
      setDeletingExpectedImageId(null)
    }
  }

  const cancelForm = () => {
    setShowStepForm(false)
    setEditingStep(null)
    setStepForm({ ...emptyStep })
  }

  const handleSaveStep = async () => {
    const manualSteps = runMode === 'manual'
    const description = (stepForm.description || '').trim()
    const stepType = stepForm.type || (manualSteps ? 'ASSERTION' : '')

    if (!description) {
      setError(t.descriptionRequired)
      return
    }
    if (!manualSteps && !stepType) {
      setError(t.typeRequired)
      return
    }

    // Navigate URL validation only matters for automated playback
    if (!manualSteps && stepType === 'NAVIGATE') {
      const navUrl = String(stepForm.value || scenario?.url || '').trim()
      if (!navUrl) {
        setError(t.navigateUrlRequired)
        return
      }
      try {
        const u = new URL(navUrl)
        if (!/^https?:$/i.test(u.protocol)) {
          setError(t.invalidNavigateUrl)
          return
        }
      } catch {
        setError(t.invalidNavigateUrl)
        return
      }
    }

    // Manual form hides automation fields; keep existing values on edit, leave blank on create
    const valueToSave = manualSteps
      ? (stepForm.value || null)
      : stepType === 'NAVIGATE' && !String(stepForm.value || '').trim() && scenario?.url
        ? scenario.url
        : (stepForm.value || null)

    const selectorToSave = stepForm.selector || null

    setIsSaving(true)
    setError(null)

    try {
      let parsedMetadata = null
      if (stepForm.metadata) {
        try {
          parsedMetadata = JSON.parse(stepForm.metadata)
        } catch {
          // Ignore invalid metadata in manual mode (field is hidden); block in automated
          if (!manualSteps) {
            setError(t.invalidMetadata)
            setIsSaving(false)
            return
          }
          parsedMetadata = null
        }
      }

      if (editingStep) {
        await scenarioAPI.updateStep(id, editingStep.id, {
          type: stepType,
          description,
          expectedResult: stepForm.expectedResult?.trim() || null,
          selector: selectorToSave,
          value: valueToSave,
          metadata: parsedMetadata
        })
        showSuccess(t.stepUpdated)
      } else {
        await scenarioAPI.createStep(
          id,
          null,
          stepType,
          description,
          selectorToSave,
          valueToSave,
          parsedMetadata,
          stepForm.expectedResult?.trim() || null
        )
        showSuccess(t.stepAdded)
      }

      cancelForm()
      await loadSteps()
    } catch (err) {
      showActionError(err.response?.data?.error || t.saveStepError)
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
      showActionError(err.response?.data?.error || t.deleteStepError)
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
      showActionError(err.response?.data?.error || t.deleteStepsError)
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
      showActionError(err.response?.data?.error || err.response?.data?.message || t.copyStepsError)
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

  const stopAgentPoll = useCallback(() => {
    if (agentPollRef.current) {
      clearTimeout(agentPollRef.current)
      agentPollRef.current = null
    }
  }, [])

  const pollAgentJob = useCallback(
    async (jobId) => {
      stopAgentPoll()
      try {
        const res = await agentAPI.getJob(jobId)
        const job = res.data.job
        setAgentJob(job)
        const terminal = ['COMPLETED', 'FAILED', 'CANCELLED'].includes(job?.status)
        if (terminal && job?.executionId) {
          try {
            const detailRes = await executionAPI.getDetails(job.executionId)
            const result = detailRes.data.execution || detailRes.data
            setExecutionResult(result)
            if (job.status === 'FAILED' || result.status === 'FAILED') {
              setError(t.executionFailed(result.failedSteps ?? 0))
            } else if (job.status === 'COMPLETED') {
              showSuccess(t.agentJobCompleted)
            }
            setTimeout(() => {
              executionResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 200)
          } catch {
            /* execution detail optional */
          }
          return
        }
        agentPollRef.current = setTimeout(() => pollAgentJob(jobId), 2000)
      } catch {
        agentPollRef.current = setTimeout(() => pollAgentJob(jobId), 4000)
      }
    },
    [stopAgentPoll, t]
  )

  useEffect(() => () => stopAgentPoll(), [stopAgentPoll])

  useEffect(() => {
    if (!id || targetKind !== 'internal') return
    let cancelled = false
    ;(async () => {
      try {
        const res = await agentAPI.listJobs({ scenarioId: id, limit: 1 })
        const latest = res.data.jobs?.[0]
        if (cancelled || !latest) return
        setAgentJob(latest)
        if (['QUEUED', 'CLAIMED'].includes(latest.status)) {
          pollAgentJob(latest.id)
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, targetKind, pollAgentJob])

  const handleQueueLocalAgent = async () => {
    try {
      setError(null)
      setIsQueueingAgent(true)
      const res = await agentAPI.queue(id, {
        browser: selectedBrowser,
        headless: headlessMode,
      })
      const job = res.data.job
      setAgentJob(job)
      showSuccess(t.queueLocalAgentHint)
      if (job?.id) pollAgentJob(job.id)
    } catch (err) {
      setError(err.response?.data?.message || t.queueLocalAgentError)
    } finally {
      setIsQueueingAgent(false)
    }
  }

  const handleCancelAgentJob = async () => {
    if (!agentJob?.id) return
    try {
      const res = await agentAPI.cancelJob(agentJob.id)
      setAgentJob(res.data.job)
      stopAgentPoll()
      showSuccess(t.agentJobCancelled)
    } catch (err) {
      setError(err.response?.data?.message || t.queueLocalAgentError)
    }
  }

  const needsLocalRun = targetKind === 'internal' && executionBlocked
  const agentBusy = agentJob?.status === 'QUEUED' || agentJob?.status === 'CLAIMED'

  const handlePrimaryRun = async () => {
    if (runMode === 'manual') {
      await handleStartManualRun()
      return
    }
    if (needsLocalRun) {
      await handleQueueLocalAgent()
      return
    }
    await handleExecute()
  }

  const handleStartManualRun = async () => {
    if (steps.length === 0) {
      setError(t.addStepFirst)
      return
    }
    setIsStartingManualRun(true)
    setError(null)
    try {
      const res = await executionAPI.startManualRun(id)
      const execution = res.data.execution
      const recorded = {}
      setManualRun({ executionId: execution.id, recorded })
      showSuccess(t.manualRunStarted)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mulai Manual Run')
    } finally {
      setIsStartingManualRun(false)
    }
  }

  const handleManualStepRecorded = (stepId, payload) => {
    setManualRun((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        recorded: {
          ...prev.recorded,
          [stepId]: payload,
        },
      }
    })
  }

  const handleManualRunFinished = (execution) => {
    setManualRun(null)
    setExecutionResult(execution)
    setExecutionIteration((n) => n + 1)
    const base = t.manualRunFinished(execution?.status || 'DONE')
    showSuccess(
      execution?.status === 'FAILED'
        ? `${base} — cek menu Bugs jika ada issue yang dibuat.`
        : base
    )
  }

  const handleCancelManualRun = async () => {
    if (!manualRun?.executionId) {
      setManualRun(null)
      return
    }
    try {
      await executionAPI.cancelManualRun(manualRun.executionId)
      showSuccess(t.manualRunCancelled)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membatalkan Manual Run')
    } finally {
      setManualRun(null)
    }
  }

  const handleExecute = async () => {
    if (steps.length === 0) {
      setError(t.addStepFirst)
      return
    }

    // Cloud cannot reach private targets — primary CTA should use local agent instead
    if (needsLocalRun) {
      setError(t.runBlockedInternal)
      return
    }

    if (targetKind === 'internal' && !executionBlocked) {
      if (!window.confirm(t.runWarnInternal)) return
    }

    if (!window.confirm(t.confirmExecute(scenario.name))) return

    // Open Browser Runner before await (user gesture) so popup blockers don't block it
    const runnerWindow = window.open('', '_blank', 'width=1400,height=900,menubar=no,toolbar=no,scrollbars=yes,resizable=yes')
    if (runnerWindow) {
      runnerWindow.document.write(`<html><body style="font-family:Segoe UI,sans-serif;padding:40px;background:#111827;color:#e5e7eb"><p>${t.startingBrowserRunner || 'Opening Browser Runner...'}</p></body></html>`)
    } else {
      setError(t.browserRunnerPopupBlocked)
      return
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

      if (res.data.liveViewUrl && runnerWindow && !runnerWindow.closed) {
        runnerWindow.location.href = res.data.liveViewUrl
      }

      const pollExecution = async () => {
        try {
          const detailRes = await executionAPI.getDetails(execution.id)
          const result = detailRes.data.execution || detailRes.data
          setExecutionResult(result)

          if (result.stepResults && Array.isArray(result.stepResults)) {
            const completedCount = result.stepResults.filter(sr => sr && sr.status).length
            const currentIndex = Math.min(completedCount, steps.length - 1)
            if (completedCount > 0) {
              setCurrentStepIndex(currentIndex)
            }
          }

          if (result.status === 'RUNNING' || result.status === 'PENDING') {
            setTimeout(pollExecution, 500)
          } else {
            setCurrentStepIndex(null)

            if (result.status === 'FAILED') {
              setError(t.executionFailed(result.failedSteps))
            } else {
              showSuccess(t.executionSuccess(result.status))
            }

            setTimeout(() => {
              executionResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 100)
          }
        } catch (pollErr) {
          console.debug('Polling error (execution may still be running):', pollErr.message)
          setTimeout(pollExecution, 1000)
        }
      }

      pollExecution()
    } catch (err) {
      if (runnerWindow && !runnerWindow.closed) runnerWindow.close()
      const errData = err.response?.data
      let errMsg = errData?.message || t.executionError

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errMsg = t.executionTimeout
      }

      setError(errMsg)

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

  // Live sync from client-gate: postMessage (opener) + BroadcastChannel
  useEffect(() => {
    if (!isRecording || !id) return undefined

    const applySync = (payload) => {
      if (!payload || payload.type !== '__REC_UI_SYNC__') return
      if (String(payload.sessionId) !== String(id)) return
      if (Array.isArray(payload.steps) && payload.steps.length > 0) {
        setRecordingSteps(payload.steps)
        return
      }
      if (payload.step && typeof payload.step === 'object') {
        setRecordingSteps((prev) => {
          const key = `${payload.step.type}|${payload.step.selector || ''}|${payload.step.timestamp || ''}`
          if (prev.some((s) => `${s.type}|${s.selector || ''}|${s.timestamp || ''}` === key)) {
            return prev
          }
          return [...prev, payload.step]
        })
      }
    }

    const onMessage = (event) => {
      const data = event.data
      if (!data || typeof data !== 'object') return

      if (data.type === '__REC_UI_SYNC__') {
        applySync(data)
        return
      }

      // Legacy/backup: target or gate may still post raw steps here
      if (data.type !== '__REC_STEP__') return
      if (String(data.sessionId) !== String(id)) return
      if (!data.data || typeof data.data !== 'object') return
      const rt = data.recordToken || recordTokenRef.current
      if (rt) {
        recorderAPI.receiveClientStep(id, data.data, rt)
          .then((res) => {
            if (Array.isArray(res.data?.steps)) setRecordingSteps(res.data.steps)
          })
          .catch(() => {})
        return
      }
      recorderAPI.receiveStep(id, data.data).catch(() => {})
    }

    window.addEventListener('message', onMessage)

    let channel = null
    try {
      channel = new BroadcastChannel(`tsn-recorder-${id}`)
      channel.onmessage = (ev) => applySync(ev.data)
    } catch (_) {
      channel = null
    }

    return () => {
      window.removeEventListener('message', onMessage)
      try { channel?.close() } catch (_) { /* ignore */ }
    }
  }, [isRecording, id])

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
        setRunMode('automated')
        setIsRecording(true)
        setRecordingSteps(res.data.steps || [])
        setShowRecordingPanel(true)
        startPollingSteps()
      }
    }).catch(() => {})
  }, [id, startPollingSteps])

  const closeRecordingWindows = useCallback(() => {
    for (const ref of [bridgeWinRef, targetWinRef]) {
      try {
        if (ref.current && !ref.current.closed) ref.current.close()
      } catch (_) { /* ignore */ }
      ref.current = null
    }
  }, [])

  const writeLoadingDoc = (win, message) => {
    if (!win) return
    try {
      win.document.write(
        `<html><body style="font-family:sans-serif;padding:24px;background:#0f172a;color:#e2e8f0"><p>${message}</p></body></html>`
      )
    } catch (_) { /* ignore */ }
  }

  const loadInjectScriptText = async (injectScriptUrl) => {
    if (!injectScriptUrl) return ''
    const u = new URL(injectScriptUrl, window.location.origin)
    if (!u.searchParams.get('origin')) {
      u.searchParams.set('origin', u.origin)
    }
    const res = await fetch(u.toString(), { credentials: 'omit' })
    if (!res.ok) throw new Error(`inject script HTTP ${res.status}`)
    return res.text()
  }

  const handleCopyInjectScript = async () => {
    if (!injectScriptText) {
      setError(t.recordingCopyScriptError)
      return
    }
    setIsCopyingInjectScript(true)
    try {
      await navigator.clipboard.writeText(injectScriptText)
      showSuccess(t.recordingScriptCopied)
    } catch (_) {
      try {
        window.prompt('Salin script ini (Ctrl+A, Ctrl+C):', injectScriptText)
      } catch (e2) {
        setError(t.recordingCopyScriptError)
      }
    } finally {
      setIsCopyingInjectScript(false)
    }
  }

  const handleStartRecording = async () => {
    const url = (recordingUrl.trim() || scenario?.url || '').trim()
    if (!url) {
      setError(t.enterUrlForRecording)
      return
    }

    const selectedMode =
      targetKind === 'internal' ? 'client-direct' : (recordingModeChoice || 'client-direct')

    // Open target in the same user gesture (avoid popup blockers).
    // client-direct: open real target only — no full guide page.
    // Bridge popup appears later only if user clicks Hubungkan bridge (CSP).
    // proxy: single proxy tab.
    const targetWin = window.open(
      '',
      'tsn_rec_target',
      'width=1280,height=800,menubar=no,toolbar=no,scrollbars=yes,resizable=yes'
    )
    targetWinRef.current = targetWin
    bridgeWinRef.current = null
    writeLoadingDoc(targetWin, t.openingBrowser)

    setIsStartingRecording(true)
    setError(null)
    setInjectScriptText('')
    setClientGuideUrl(null)
    setRecordingMethod(null)
    try {
      const res = await recorderAPI.start(id, url, selectedMode)
      const method = res.data.method || selectedMode
      if (res.data.targetKind === 'internal' || res.data.targetKind === 'public') {
        setTargetKind(res.data.targetKind)
      }
      if (res.data.modeForced) {
        setRecordingModeChoice('client-direct')
      }

      recordTokenRef.current = res.data.recordToken || null
      setRecordingMethod(method)
      setClientGuideUrl(res.data.clientGateUrl || null)

      if (!targetWin || targetWin.closed) {
        try { await recorderAPI.stop(id) } catch (_) { /* ignore */ }
        closeRecordingWindows()
        setError(t.recordingPopupBlocked)
        setIsRecording(false)
        return
      }

      if (method === 'client-direct') {
        targetWin.location.href = url
        try { targetWin.focus() } catch (_) { /* ignore */ }

        try {
          const script = await loadInjectScriptText(res.data.injectScriptUrl)
          setInjectScriptText(script || '')
        } catch (scriptErr) {
          console.warn('inject script fetch failed', scriptErr)
          setInjectScriptText('')
        }
      } else {
        const proxyUrl = res.data.proxyUrl || res.data.clientGateUrl
        if (!proxyUrl) {
          try { await recorderAPI.stop(id) } catch (_) { /* ignore */ }
          closeRecordingWindows()
          setError(t.startRecordingError)
          setIsRecording(false)
          return
        }
        targetWin.location.href = proxyUrl
      }

      setIsRecording(true)
      setRecordingSteps([])
      setShowRecordingPanel(true)
      showSuccess(t.recordingStarted(res.data.message || ''))
      startPollingSteps()

    } catch (err) {
      closeRecordingWindows()
      const errorMsg = err.response?.data?.message || err.response?.data?.error || t.startRecordingError
      setError(errorMsg)
      console.error('Recording start error:', err.response?.data || err.message)
      setIsRecording(false)
      setRecordingMethod(null)
      setInjectScriptText('')
    } finally {
      setIsStartingRecording(false)
    }
  }

  const handleStopRecording = async () => {
    setIsStoppingRecording(true)
    stopPolling() // Stop polling steps from backend
    recordTokenRef.current = null
    closeRecordingWindows()
    setInjectScriptText('')
    setClientGuideUrl(null)
    try {
      // ═══ Stop Playwright-based Recording ═══
      const res = await recorderAPI.stop(id)
      const stoppedSteps = res.data.steps || []
      
      setRecordingSteps(stoppedSteps)
      setIsRecording(false)
      setRecordingMethod(null)

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
    closeRecordingWindows()
    setRecordingSteps([])
    setShowRecordingPanel(false)
    setRecordingMethod(null)
    setInjectScriptText('')
    setClientGuideUrl(null)
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
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div className="w-full xl:flex-1 xl:min-w-0">
            <nav className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted mb-2">
              <button
                type="button"
                onClick={() => {
                  useFolderStore.getState().setSelectedKey('all')
                  navigate('/scenarios')
                }}
                className="text-brand hover:text-brand-hover font-medium"
              >
                Repository
              </button>
              <span className="text-ink-subtle">/</span>
              <button
                type="button"
                onClick={() => {
                  const folderId = scenario.folderId || scenario.folder?.id || null
                  useFolderStore.getState().setSelectedKey(folderId || 'unfiled')
                  if (folderId && scenario.folder?.parentId) {
                    useFolderStore.getState().expandMany([scenario.folder.parentId])
                  }
                  navigate('/scenarios')
                }}
                className="hover:text-brand font-medium truncate max-w-[180px]"
                title={
                  scenario.folder?.name
                    ? `Buka feature folder “${scenario.folder.name}”`
                    : 'Buka case tanpa folder'
                }
              >
                {scenario.folder?.name || 'No folder'}
              </button>
              <span className="text-ink-subtle">/</span>
              <span className="text-ink font-medium truncate max-w-[220px]">{scenario.name}</span>
            </nav>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#E0E0E2] break-words">{scenario.name}</h1>
            {scenario.scenarioCode && (
              <p className="text-xs font-mono text-brand mt-1">{scenario.scenarioCode}</p>
            )}
            {scenario.description && (
              <p className="text-[#A0A0A4] mt-1 break-words">{scenario.description}</p>
            )}
            <div className="mt-2 space-y-1.5 text-sm text-[#888]">
              <div className="rounded-lg border border-surface-border bg-white/60 px-3 py-2 overflow-x-auto">
                <p className="text-xs font-mono text-ink whitespace-nowrap">🌐 {scenario.url}</p>
              </div>
              <p>📋 {steps.length} steps</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full xl:w-auto xl:max-w-md">
            <ExportFormatButton
              format="primary"
              icon={Globe}
              onClick={() => setShowBrowserSelector(!showBrowserSelector)}
              disabled={isExecuting}
              className="capitalize"
            >
              {selectedDevice || selectedBrowser}
            </ExportFormatButton>

            {runMode === 'automated' && (
              !isRecording ? (
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
              )
            )}

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-ink-muted whitespace-nowrap">Mode</label>
              <select
                value={runMode}
                onChange={(e) => {
                  const next = e.target.value
                  setRunMode(next)
                  if (next === 'manual') {
                    setShowRecordingPanel(false)
                  }
                }}
                disabled={!!manualRun || isExecuting || isRecording}
                className="text-xs font-semibold rounded-lg border border-surface-border bg-white text-ink px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="manual">Manual checklist</option>
                <option value="automated">Automated (Playwright)</option>
              </select>
            </div>
            <ExportFormatButton
              format="csv"
              icon={
                isExecuting || isQueueingAgent || isStartingManualRun
                  ? Loader2
                  : runMode === 'manual'
                    ? ClipboardList
                    : (needsLocalRun ? Zap : Play)
              }
              onClick={handlePrimaryRun}
              disabled={
                isExecuting ||
                isQueueingAgent ||
                isStartingManualRun ||
                steps.length === 0 ||
                isRecording ||
                !!manualRun ||
                (runMode === 'automated' && needsLocalRun && agentBusy)
              }
              className={
                isExecuting || isQueueingAgent || isStartingManualRun ? '[&_svg]:animate-spin' : ''
              }
            >
              {isExecuting || isQueueingAgent || isStartingManualRun
                ? t.running
                : runMode === 'manual'
                  ? t.manualRun
                  : needsLocalRun
                    ? t.runOnThisPc
                    : t.runScenario}
            </ExportFormatButton>
            <p className="text-xs text-ink-muted basis-full max-w-sm sm:text-right">
              {manualRun
                ? t.manualRunHint
                : runMode === 'manual'
                  ? t.manualRunHint
                  : needsLocalRun
                    ? 'Automated internal: butuh local agent di PC VPN.'
                    : t.liveRunIsolatedHint}
            </p>
          </div>
        </div>

        {/* Target kind sits under URL/actions — not buried below steps */}
        {(targetKind || isProbingTarget) && (
          <TargetKindBanner
            variant="compact"
            targetKind={targetKind}
            executionBlocked={executionBlocked}
            isProbing={isProbingTarget}
            message={targetInfoMessage}
            addresses={targetAddresses}
            url={scenario.url}
            labels={defaultTargetKindLabels}
          />
        )}

        {agentJob && targetKind === 'internal' && (
          <Card className="border border-amber-200/80 bg-amber-50/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{t.agentJobStatus}</p>
                <p className="text-sm text-slate-600 mt-0.5">
                  {agentJob.status === 'QUEUED' && t.agentJobQueued}
                  {agentJob.status === 'CLAIMED' && t.agentJobClaimed}
                  {agentJob.status === 'COMPLETED' && t.agentJobCompleted}
                  {agentJob.status === 'FAILED' && (agentJob.error || t.agentJobFailed)}
                  {agentJob.status === 'CANCELLED' && t.agentJobCancelled}
                </p>
                {agentJob.executionId && (
                  <button
                    type="button"
                    className="text-xs text-brand hover:underline mt-1 font-mono truncate max-w-full"
                    onClick={() => navigate(`/execution/${agentJob.executionId}`)}
                  >
                    execution: {agentJob.executionId}
                    {['COMPLETED', 'FAILED'].includes(agentJob.status) ? ` — ${t.viewAgentExecution}` : ''}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    agentJob.status === 'COMPLETED'
                      ? 'success'
                      : agentJob.status === 'FAILED' || agentJob.status === 'CANCELLED'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {agentJob.status}
                </Badge>
                {agentJob.status === 'QUEUED' && (
                  <button
                    type="button"
                    onClick={handleCancelAgentJob}
                    className="text-xs px-2.5 py-1 rounded border border-slate-300 text-slate-700 hover:bg-white"
                  >
                    {t.cancelAgentJob}
                  </button>
                )}
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div className="flex flex-wrap items-center gap-1 mb-4 border-b border-surface-border pb-2">
            {[
              { id: 'details', label: 'Details' },
              { id: 'attachments', label: `Attachments${generalAttachments.length ? ` (${generalAttachments.length})` : ''}` },
              { id: 'runs', label: 'Runs' },
              { id: 'history', label: 'History' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCaseTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  caseTab === tab.id
                    ? 'bg-brand-soft text-brand'
                    : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {caseTab === 'attachments' && (
            <CaseAttachmentsPanel
              scenarioId={id}
              attachments={generalAttachments}
              onRefresh={refreshCaseAttachments}
            />
          )}

          {caseTab === 'runs' && <CaseRunsPanel scenarioId={id} />}

          {caseTab === 'history' && <CaseHistoryPanel scenarioId={id} />}

          {caseTab === 'details' && (
          <>
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Test case details</h2>
              <p className="text-xs text-ink-muted mt-0.5">
                Owner, priority, type, precondition, dan test steps — mirip Testiny Details.
              </p>
            </div>
            <ExportFormatButton
              format="primary"
              icon={isSavingCaseMeta ? Loader2 : Save}
              onClick={handleSaveCaseMeta}
              disabled={isSavingCaseMeta}
              className={isSavingCaseMeta ? '[&_svg]:animate-spin' : ''}
            >
              Simpan detail
            </ExportFormatButton>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Priority</label>
              <select
                value={caseMeta.priority}
                onChange={(e) => setCaseMeta((m) => ({ ...m, priority: e.target.value }))}
                className={`w-full text-sm font-semibold rounded-lg border px-3 py-2 transition-colors ${
                  PRIORITY_SELECT_COLORS[caseMeta.priority] ||
                  'border-surface-border bg-white text-ink'
                }`}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Type</label>
              <select
                value={caseMeta.caseType}
                onChange={(e) => setCaseMeta((m) => ({ ...m, caseType: e.target.value }))}
                className={`w-full text-sm font-semibold rounded-lg border px-3 py-2 transition-colors ${
                  CASE_TYPE_SELECT_COLORS[caseMeta.caseType] ||
                  'border-surface-border bg-white text-ink'
                }`}
              >
                <option value="Functional">Functional</option>
                <option value="Regression">Regression</option>
                <option value="Smoke">Smoke</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">PIC / Owner</label>
              <div className="text-sm rounded-lg border border-surface-border px-3 py-2 bg-surface-muted text-ink">
                {scenario?.owner?.name || scenario?.owner?.email || 'Anda (creator)'}
              </div>
            </div>
          </div>
          <div className="mb-5">
            <label className="block text-xs font-medium text-ink-muted mb-1">Precondition</label>
            <textarea
              value={caseMeta.precondition}
              onChange={(e) => setCaseMeta((m) => ({ ...m, precondition: e.target.value }))}
              rows={3}
              placeholder="Kondisi awal sebelum step dijalankan…"
              className="w-full text-sm rounded-lg border border-surface-border px-3 py-2 bg-white text-ink"
            />
          </div>

          <div className="mb-5">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
              <div>
                <label className="block text-xs font-medium text-ink-muted">Expected result</label>
                <p className="text-[11px] text-ink-subtle mt-0.5">
                  Hasil yang diharapkan untuk test case ini — teks dan/atau screenshot.
                </p>
              </div>
              <div>
                <input
                  ref={expectedImageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(e) => handleUploadExpectedImages(e.target.files)}
                />
                <ExportFormatButton
                  format="primary"
                  icon={uploadingExpectedImage ? Loader2 : ImagePlus}
                  onClick={() => expectedImageInputRef.current?.click()}
                  disabled={uploadingExpectedImage}
                  className={uploadingExpectedImage ? '[&_svg]:animate-spin' : ''}
                >
                  {uploadingExpectedImage ? 'Uploading…' : 'Tambah gambar'}
                </ExportFormatButton>
              </div>
            </div>
            <textarea
              value={caseMeta.expectedResult}
              onChange={(e) => setCaseMeta((m) => ({ ...m, expectedResult: e.target.value }))}
              rows={3}
              placeholder="Mis. User berhasil login dan diarahkan ke dashboard…"
              className="w-full text-sm rounded-lg border border-surface-border px-3 py-2 bg-white text-ink"
            />
            {expectedResultImages.length > 0 ? (
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {expectedResultImages.map((img) => (
                  <li
                    key={img.id}
                    className="relative group rounded-xl border border-surface-border bg-white overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewAttachment(img)}
                      className="block w-full text-left"
                      title="Preview gambar"
                    >
                      <img
                        src={img.url}
                        alt={img.originalName}
                        className="w-full h-28 object-cover"
                      />
                    </button>
                    <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewAttachment(img)}
                        className="text-[11px] text-ink-muted truncate hover:text-brand text-left"
                        title={img.originalName}
                      >
                        {img.originalName}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpectedImage(img.id)}
                        disabled={deletingExpectedImageId === img.id}
                        className="shrink-0 text-[11px] text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingExpectedImageId === img.id ? '…' : 'Hapus'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <button
                type="button"
                onClick={() => expectedImageInputRef.current?.click()}
                disabled={uploadingExpectedImage}
                className="mt-3 w-full rounded-xl border border-dashed border-surface-border bg-surface-muted/40 px-4 py-6 text-center hover:bg-surface-muted/70 transition-colors"
              >
                <Upload size={18} className="mx-auto text-ink-subtle mb-1.5" />
                <p className="text-xs text-ink-muted">Belum ada gambar — klik untuk upload screenshot expected result</p>
              </button>
            )}
          </div>

          {/* Steps — same Details panel as Testiny */}
          <div className="border-t border-surface-border pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Steps</h3>
                <p className="text-xs text-ink-muted mt-0.5">{steps.length} step dalam test case ini</p>
              </div>
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

            {showStepForm && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop">
                <div
                  className="absolute inset-0 backdrop-blur-sm bg-black/40"
                  onClick={cancelForm}
                  aria-label={t.closeDialog}
                />
                <div
                  ref={stepFormRef}
                  role="dialog"
                  aria-modal="true"
                  aria-label={editingStep ? t.editStep : t.addNewStep}
                  className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl border bg-white border-gray-200 pb-[env(safe-area-inset-bottom)]"
                >
                  <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#0F766E]/15 flex items-center justify-center shrink-0">
                        <span className="text-[#0F766E] text-sm">{editingStep ? '✏️' : '+'}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {editingStep ? t.editStep : t.addNewStep}
                      </h3>
                    </div>
                    <button
                      onClick={cancelForm}
                      aria-label={t.closeDialog}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="px-4 sm:px-6 py-4 sm:py-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                          {t.fieldType}{' '}
                          {isManualMode ? (
                            <span className="text-xs text-ink-subtle font-normal">{t.optional}</span>
                          ) : (
                            <span className="text-xs text-red-600">*{t.required}</span>
                          )}
                        </label>
                        <select
                          value={stepForm.type || formStepTypes[0]?.value || ''}
                          onChange={(e) => setStepForm({ ...stepForm, type: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#0F766E] focus:outline-none bg-white border-gray-300 text-gray-900"
                        >
                          {/* Keep current type visible when editing a step outside the manual shortlist */}
                          {isManualMode &&
                            stepForm.type &&
                            !formStepTypes.some((st) => st.value === stepForm.type) && (
                              <option value={stepForm.type}>
                                {(STEP_TYPES.find((st) => st.value === stepForm.type)?.icon || '•')}{' '}
                                {STEP_TYPES.find((st) => st.value === stepForm.type)?.label || stepForm.type}
                              </option>
                            )}
                          {formStepTypes.map((st) => (
                            <option key={st.value} value={st.value}>
                              {st.icon} {st.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                          {t.fieldDescription}{' '}
                          <span className="text-xs text-red-600">*{t.required}</span>
                        </label>
                        <input
                          type="text"
                          value={stepForm.description}
                          onChange={(e) => setStepForm({ ...stepForm, description: e.target.value })}
                          placeholder={t.stepDescriptionPlaceholder}
                          autoFocus
                          className="w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#0F766E] focus:outline-none bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium mb-1 text-gray-700">
                          {t.fieldExpectedResult}{' '}
                          {isManualMode ? (
                            <span className="text-xs text-ink-subtle font-normal">{t.optional}</span>
                          ) : null}
                        </label>
                        <input
                          type="text"
                          value={stepForm.expectedResult}
                          onChange={(e) => setStepForm({ ...stepForm, expectedResult: e.target.value })}
                          placeholder={t.expectedResultPlaceholder}
                          className="w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#0F766E] focus:outline-none bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                        />
                      </div>

                      {!isManualMode && getStepTypeConfig(stepForm.type).fields.includes('selector') && (
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <label className="text-sm font-medium text-gray-700">{t.fieldSelector}</label>
                            <Tooltip text={t.selectorHelpTooltip} position="right" multiline>
                              <HelpCircle
                                size={14}
                                className="text-gray-400 hover:text-[#0F766E] cursor-help shrink-0"
                                aria-label="How to find a selector"
                              />
                            </Tooltip>
                          </div>
                          <input
                            type="text"
                            value={stepForm.selector}
                            onChange={(e) => setStepForm({ ...stepForm, selector: e.target.value })}
                            placeholder={getStepTypeConfig(stepForm.type).placeholder.selector}
                            className="w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#0F766E] focus:outline-none bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                          />
                          <p className="mt-1 text-xs text-gray-500">{t.selectorHelpShort}</p>
                        </div>
                      )}

                      {!isManualMode && getStepTypeConfig(stepForm.type).fields.includes('value') && (
                        <div>
                          <label className="block text-sm font-medium mb-1 text-gray-700">{t.fieldValue}</label>
                          <input
                            type="text"
                            value={stepForm.value}
                            onChange={(e) => setStepForm({ ...stepForm, value: e.target.value })}
                            placeholder={getStepTypeConfig(stepForm.type).placeholder.value}
                            className="w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#0F766E] focus:outline-none bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                          />
                        </div>
                      )}

                      {!isManualMode && getStepTypeConfig(stepForm.type).fields.includes('metadata') && (
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium mb-1 text-gray-700">{t.fieldMetadata}</label>
                          <textarea
                            value={stepForm.metadata}
                            onChange={(e) => setStepForm({ ...stepForm, metadata: e.target.value })}
                            placeholder={getStepTypeConfig(stepForm.type).placeholder.metadata}
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border focus:ring-1 focus:ring-[#0F766E] focus:outline-none font-mono text-sm bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                          />
                        </div>
                      )}
                    </div>

                    {(isManualMode || t.hints[stepForm.type]) && (
                      <div className="mt-4 px-3 py-2 rounded-lg text-sm bg-blue-50 text-blue-700 border border-blue-200">
                        {isManualMode ? t.manualStepHint : t.hints[stepForm.type]}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row flex-wrap gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 sticky bottom-0 bg-white">
                    <ExportFormatButton
                      format="primary"
                      icon={isSaving ? Loader2 : Save}
                      onClick={handleSaveStep}
                      disabled={isSaving}
                      className={`w-full sm:w-auto sm:flex-none justify-center ${isSaving ? '[&_svg]:animate-spin' : ''}`}
                    >
                      {isSaving ? t.saving : editingStep ? t.updateStepBtn : t.saveStepBtn}
                    </ExportFormatButton>
                    <ExportFormatButton format="json" icon={null} onClick={cancelForm} className="w-full sm:w-auto sm:flex-none justify-center">
                      {t.cancel}
                    </ExportFormatButton>
                  </div>
                </div>
              </div>
            )}

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
              STEP_TYPES={displayStepTypes}
              isDeletingBulk={isDeletingBulk}
            />
          </div>
          </>
          )}
        </Card>

        {manualRun && (
          <Card className="border border-teal-200/80 bg-teal-50/30">
            <ManualRunPanel
              steps={steps}
              executionId={manualRun.executionId}
              recordedByStepId={manualRun.recorded}
              onRecorded={handleManualStepRecorded}
              onFinished={handleManualRunFinished}
              onCancel={handleCancelManualRun}
              stepTypes={displayStepTypes}
              scenarioName={scenario?.name || 'Scenario'}
              scenarioCode={scenario?.scenarioCode || scenario?.code || ''}
              precondition={scenario?.precondition || caseMeta.precondition}
              expectedResult={scenario?.expectedResult || caseMeta.expectedResult}
              expectedResultImages={expectedResultImages}
              assigneeOverride={scenario?.owner || null}
            />
          </Card>
        )}

        {/* Alerts */}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {successMsg && <Alert type="success" message={successMsg} />}

        <AttachmentPreviewModal
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />

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
        {showRecordingPanel && runMode === 'automated' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                {isRecording && <span className="inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse" />}
                {isRecording ? t.recordingActive : t.recordingMode}
              </h2>
              {!isRecording && recordingSteps.length === 0 && (
                <button
                  onClick={() => setShowRecordingPanel(false)}
                  className="text-ink-muted hover:text-ink text-xl leading-none"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Start recording controls — simple primary path */}
            {!isRecording && recordingSteps.length === 0 && (
              <div className="space-y-4">
                <p className="text-ink-muted text-sm leading-relaxed">
                  {t.startRecordingHint}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-ink-muted mb-1">{t.urlTarget}</label>
                    <input
                      type="url"
                      value={recordingUrl}
                      onChange={(e) => setRecordingUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 bg-white border border-surface-border text-ink placeholder-ink-subtle rounded-lg focus:ring-1 focus:ring-brand focus:outline-none"
                    />
                  </div>
                  <ExportFormatButton
                    format="pdf"
                    icon={isStartingRecording ? Loader2 : RecordIcon}
                    onClick={handleStartRecording}
                    disabled={isStartingRecording}
                    className={isStartingRecording ? '[&_svg]:animate-spin' : ''}
                  >
                    {isStartingRecording ? t.openingBrowser : t.startRecording}
                  </ExportFormatButton>
                </div>

                {(targetKind || isProbingTarget) && (
                  <TargetKindBanner
                    variant="compact"
                    targetKind={targetKind}
                    executionBlocked={executionBlocked}
                    isProbing={isProbingTarget}
                    message={targetInfoMessage}
                    addresses={targetAddresses}
                    url={(recordingUrl.trim() || scenario?.url || '').trim()}
                    labels={defaultTargetKindLabels}
                  />
                )}

                <div>
                  <button
                    type="button"
                    onClick={() => setShowRecordAdvanced((v) => !v)}
                    className="text-xs font-semibold text-ink-muted hover:text-ink inline-flex items-center gap-1"
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${showRecordAdvanced ? 'rotate-180' : ''}`}
                    />
                    {showRecordAdvanced ? t.recordingAdvancedHide : t.recordingAdvanced}
                  </button>

                  {showRecordAdvanced && (
                    <div className="mt-3 space-y-3 rounded-lg border border-surface-border bg-surface-muted/40 p-3">
                      {targetKind === 'internal' && (
                        <p className="text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                          {t.recordingOverviewInternalLock}
                        </p>
                      )}
                      <p className="text-xs font-medium text-ink-muted">{t.recordingOverviewSelectMode}</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setRecordingModeChoice('client-direct')}
                          className={`text-left rounded-lg border p-3 transition ${
                            recordingModeChoice === 'client-direct'
                              ? 'border-brand bg-brand-soft'
                              : 'border-surface-border bg-white hover:border-brand/40'
                          }`}
                        >
                          <div className="text-sm font-semibold text-ink mb-1">
                            {t.recordingOverviewDirectTitle}
                          </div>
                          <p className="text-xs text-ink-muted leading-relaxed">
                            {t.recordingOverviewDirectBody}
                          </p>
                          <p className="text-xs text-teal-800 mt-2 leading-relaxed font-medium">
                            {t.recordingOverviewDirectCsp}
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (targetKind === 'internal') return
                            setRecordingModeChoice('proxy')
                          }}
                          disabled={targetKind === 'internal'}
                          className={`text-left rounded-lg border p-3 transition ${
                            targetKind === 'internal'
                              ? 'border-surface-border bg-surface-muted cursor-not-allowed'
                              : recordingModeChoice === 'proxy'
                                ? 'border-brand bg-brand-soft'
                                : 'border-surface-border bg-white hover:border-brand/40'
                          }`}
                        >
                          <div className={`text-sm font-semibold mb-1 ${
                            targetKind === 'internal' ? 'text-ink-muted' : 'text-ink'
                          }`}>
                            {t.recordingOverviewProxyTitle}
                          </div>
                          <p className={`text-xs leading-relaxed ${
                            targetKind === 'internal' ? 'text-ink-subtle' : 'text-ink-muted'
                          }`}>
                            {t.recordingOverviewProxyBody}
                          </p>
                          <p className={`text-xs mt-2 leading-relaxed font-medium ${
                            targetKind === 'internal' ? 'text-amber-800/80' : 'text-amber-900'
                          }`}>
                            {t.recordingOverviewProxyWarn}
                          </p>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Live recorded steps */}
            {(isRecording || recordingSteps.length > 0) && (
              <div>
                {isRecording && recordingMethod === 'client-direct' && (
                  <div className="mb-4 rounded-lg border border-surface-border bg-surface-muted/50 p-4 space-y-3">
                    <p className="text-sm font-semibold text-ink">{t.recordingSetupTitle}</p>
                    <ol className="list-decimal pl-5 text-xs text-ink-muted space-y-1.5 leading-relaxed">
                      <li>{t.recordingSetupStep1}</li>
                      <li>{t.recordingSetupStep2}</li>
                      <li>{t.recordingSetupStep3}</li>
                      <li>{t.recordingSetupStep4}</li>
                    </ol>
                    <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 leading-relaxed">
                      {t.recordingBridgeHint}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <ExportFormatButton
                        format="csv"
                        icon={isCopyingInjectScript ? Loader2 : Copy}
                        onClick={handleCopyInjectScript}
                        disabled={isCopyingInjectScript || !injectScriptText}
                        className={isCopyingInjectScript ? '[&_svg]:animate-spin' : ''}
                      >
                        {t.recordingCopyScript}
                      </ExportFormatButton>
                      {clientGuideUrl && (
                        <a
                          href={clientGuideUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink px-3 py-2 rounded-lg border border-surface-border"
                        >
                          <Link2 size={14} />
                          {t.recordingOpenGuide}
                        </a>
                      )}
                    </div>
                  </div>
                )}
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
                        <span className="flex-shrink-0 w-6 h-6 bg-[#0F766E]/15 text-[#0F766E] rounded-full flex items-center justify-center text-xs font-bold">
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

        {/* Execution Result */}
        {executionResult && (
          <div ref={executionResultRef}>
          <Card>
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div>
                <h2 className={`text-xl font-bold ${'text-gray-900'}`}>{t.executionResults}</h2>
                <p className={`text-xs mt-0.5 ${'text-gray-500'}`}>
                  {`Run #${executionIteration}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {executionResult.id && ['PASSED', 'FAILED'].includes(executionResult.status) && (
                  <ExportFormatButton
                    format="json"
                    icon={Link2}
                    onClick={() => setShareExecutionId(executionResult.id)}
                    title={t.shareRunHint}
                  >
                    {t.shareRun}
                  </ExportFormatButton>
                )}
                <Badge variant={executionResult.status === 'PASSED' ? 'success' : 'danger'}>
                  {executionResult.status === 'PASSED' ? '✓' : '✗'} {executionResult.status}
                </Badge>
              </div>
            </div>

            {/* Simple 2-Column Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className={`p-4 rounded-lg border min-w-0 ${'bg-green-50 border-green-200'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${'text-green-600'}`}>{t.passed || 'Passed'}</p>
                    <p className={`text-2xl font-bold mt-1 ${'text-green-700'}`}>{executionResult.passedSteps || 0}</p>
                  </div>
                  <CheckCircle2 size={24} className={`opacity-50 shrink-0 ${'text-green-600'}`} />
                </div>
              </div>
              <div className={`p-4 rounded-lg border min-w-0 ${'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${'text-red-600'}`}>{t.failed || 'Failed'}</p>
                    <p className={`text-2xl font-bold mt-1 ${'text-red-700'}`}>{executionResult.failedSteps || 0}</p>
                  </div>
                  <XCircle size={24} className={`opacity-50 shrink-0 ${'text-red-600'}`} />
                </div>
              </div>
              <div className={`p-4 rounded-lg border min-w-0 ${'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${'text-blue-600'}`}>{t.duration || 'Duration'}</p>
                    <p className={`text-2xl font-bold mt-1 ${'text-blue-700'}`}>{executionResult.duration ? `${(executionResult.duration / 1000).toFixed(2)}s` : '−'}</p>
                  </div>
                  <Clock size={24} className={`opacity-50 shrink-0 ${'text-blue-600'}`} />
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
                  className="text-[#0F766E] hover:text-[#0D9488] text-sm font-medium mr-4"
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

        <ShareRunModal
          executionId={shareExecutionId}
          open={Boolean(shareExecutionId)}
          onClose={() => setShareExecutionId(null)}
        />
      </div>
    </Layout>
  )
}
