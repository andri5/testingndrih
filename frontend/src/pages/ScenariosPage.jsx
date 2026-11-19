import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, HelpCircle, Plus, PenLine, Zap, LayoutTemplate, FileSpreadsheet, FolderInput } from 'lucide-react'
import Layout from '../components/Layout'
import { Card, Button, Alert, Spinner } from '../components/ui'
import ExportFormatButton, { SoftIconBadge } from '../components/ExportFormatButton'
import { ScenarioForm } from '../components/ScenarioForm'
import { ScenarioSearch } from '../components/ScenarioSearch'
import ScenarioRepositoryTable, { flattenFolderOptions } from '../components/ScenarioRepositoryTable'
import { TemplatePickerModal } from '../components/TemplatePickerModal'
import { QuickRecordModal } from '../components/QuickRecordModal'
import { ImportPreviewModal } from '../components/ImportPreviewModal'
import { Tooltip } from '../components/ui'
import { useScenarioStore } from '../store/scenarioStore'
import { useFolderStore } from '../store/folderStore'
import { executionAPI, testRunAPI, scenarioAPI } from '../services/api'
import toast from 'react-hot-toast'
const i18n = {
    title: 'Test Repository',
    subtitle: '1 folder = 1 fitur → buat case di dalamnya → isi steps di detail',
    createScenarioBtn: 'Create',
    selectedCount: (n) => `${n} scenario${n !== 1 ? 's' : ''} selected`,
    runningBulk: 'Running executions sequentially (headless)...',
    close: 'Close',
    cancel: 'Cancel',
    quickRecordTitle: 'Enter URL → Start. One window records; steps appear in the modal.',
    templatesTitle: 'Create scenario from ready-made template',
    // Menu items
    createManual: 'Create Manual',
    createManualDesc: 'Form-based creation',
    createManualTooltip: 'Create a new scenario using the form. Fill in name, URL, and add steps manually.',
    quickRecord: 'Quick Record',
    quickRecordDesc: '1 window · steps in modal',
    quickRecordTooltip: 'One click starts recording in a single target window. Live steps show in the modal — Stop & Save when done.',
    templates: 'Templates',
    templatesDesc: 'Pre-made templates',
    templatesMenuTooltip: 'Choose from ready-made scenario templates (Login, E-Commerce, Navigation, Form Testing).',
    importExcel: 'Import Excel',
    importExcelDesc: 'Bulk import',
    importExcelTooltip: 'Upload an Excel file with test scenarios. Use Ctrl+Click to view template.',
}

export default function ScenariosPage() {
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingScenario, setEditingScenario] = useState(null)
  const [searchTimeout, setSearchTimeout] = useState(null)
  const [showCreateMenu, setShowCreateMenu] = useState(false)

  // New feature state
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [showQuickRecord, setShowQuickRecord] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importPreviewData, setImportPreviewData] = useState(null)
  const [importIsLoading, setImportIsLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkExecuteStatus, setBulkExecuteStatus] = useState(null) // null | 'running' | 'done'
  const [bulkResults, setBulkResults] = useState([]) // [{id, name, status, executionId}]

  const {
    scenarios,
    isLoading,
    error,
    pagination,
    fetchScenarios,
    createScenario,
    updateScenario,
    deleteScenario,
    duplicateScenario,
    setSelectedScenario,
    clearError,
    favoritesOnly,
    filterTag,
    availableTags,
    fetchTags,
    toggleFavorite,
    updateScenarioTags,
    setFavoritesOnly,
    setFilterTag,
    moveScenarios,
  } = useScenarioStore()
  const selectedFolderKey = useFolderStore((s) => s.selectedKey)
  const folderTree = useFolderStore((s) => s.tree)
  const fetchFolders = useFolderStore((s) => s.fetchFolders)
  const activeFolderId =
    selectedFolderKey === 'all' || selectedFolderKey === 'unfiled' ? null : selectedFolderKey
  const folderOptions = useMemo(() => flattenFolderOptions(folderTree), [folderTree])
  const t = i18n
  const pageSize = pagination.take || 50

  const refreshList = useCallback(
    (search = '') => {
      fetchScenarios(0, pageSize, search, { favoritesOnly, tag: filterTag })
      fetchFolders()
    },
    [fetchScenarios, fetchFolders, pageSize, favoritesOnly, filterTag]
  )

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowCreateMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load scenarios when folder / filters change
  useEffect(() => {
    fetchScenarios(0, pageSize, '', { favoritesOnly, tag: filterTag })
    fetchTags()
  }, [selectedFolderKey])

  const handleSearch = (query) => {
    if (searchTimeout) clearTimeout(searchTimeout)
    const timeout = setTimeout(() => {
      if (query.trim()) {
        fetchScenarios(0, pageSize, query)
      } else {
        fetchScenarios(0, pageSize)
      }
    }, 300)
    setSearchTimeout(timeout)
  }

  const handleFavoritesChange = (value) => {
    setFavoritesOnly(value)
    fetchScenarios(0, pageSize, '', { favoritesOnly: value, tag: filterTag })
  }

  const handleTagFilterChange = (tag) => {
    setFilterTag(tag)
    fetchScenarios(0, pageSize, '', { favoritesOnly, tag })
  }

  const handleFolderDrop = async () => {
    // Layout already moved via API; refresh filtered list for active folder
    await fetchScenarios(0, pageSize, '', { favoritesOnly, tag: filterTag })
  }

  const handleMoveRequest = async (scenarioId, folderId) => {
    try {
      await moveScenarios([scenarioId], folderId)
      toast.success('Case dipindahkan')
    } catch (err) {
      toast.error(err.message || 'Gagal memindahkan case')
    }
  }

  const handleReorder = async (draggedId, targetId) => {
    // Sort order applies inside a feature folder or No folder (not on "All")
    if (selectedFolderKey === 'all') return
    const dragged = scenarios.find((s) => s.id === draggedId)
    const target = scenarios.find((s) => s.id === targetId)
    if (!dragged || !target) return

    const folderId = target.folderId ?? null
    const sameFolder = (dragged.folderId ?? null) === folderId
    const siblings = scenarios.filter((s) => (s.folderId ?? null) === folderId)
    const ids = sameFolder
      ? siblings.map((s) => s.id)
      : siblings.filter((s) => s.id !== draggedId).map((s) => s.id)

    if (sameFolder) {
      const from = ids.indexOf(draggedId)
      const to = ids.indexOf(targetId)
      if (from < 0 || to < 0 || from === to) return
      ids.splice(from, 1)
      ids.splice(to, 0, draggedId)
    } else {
      const to = ids.indexOf(targetId)
      if (to >= 0) ids.splice(to, 0, draggedId)
      else ids.push(draggedId)
    }

    const sortOrders = ids.map((id, index) => ({ id, sortOrder: index }))
    const byId = Object.fromEntries(scenarios.map((s) => [s.id, s]))
    const optimistic = ids.map((id) => byId[id]).filter(Boolean)
    const rest = scenarios.filter((s) => !ids.includes(s.id))
    // Instant UI reorder; API persists sortOrder
    useScenarioStore.setState({ scenarios: [...optimistic, ...rest] })

    try {
      await moveScenarios(ids, folderId, sortOrders)
      toast.success('Urutan case disimpan')
    } catch (err) {
      await fetchScenarios(0, pageSize, '', { favoritesOnly, tag: filterTag })
      toast.error(err.message || 'Gagal mengubah urutan')
    }
  }

  const handleBulkMove = async () => {
    if (selectedIds.size === 0) return
    const choice = window.prompt(
      'Move selected to folder ID (leave empty for No folder). Or pick from: ' +
        folderOptions.map((f) => `${f.label}=${f.id}`).slice(0, 8).join(', '),
      activeFolderId || ''
    )
    if (choice === null) return
    const folderId = choice.trim() === '' ? null : choice.trim()
    try {
      await moveScenarios([...selectedIds], folderId)
      setSelectedIds(new Set())
      toast.success('Case terpilih dipindahkan')
    } catch (err) {
      toast.error(err.message || 'Gagal memindahkan case')
    }
  }

  const handleCreateTestRun = async () => {
    if (selectedIds.size === 0) return
    const title = window.prompt(
      'Judul Test Run (multi-case):',
      `Run ${new Date().toLocaleDateString('id-ID')} (${selectedIds.size} cases)`
    )
    if (title === null) return
    if (!title.trim()) {
      toast.error('Judul wajib diisi')
      return
    }
    try {
      const res = await testRunAPI.create({
        title: title.trim(),
        scenarioIds: [...selectedIds],
      })
      setSelectedIds(new Set())
      toast.success('Test Run dibuat')
      navigate(`/test-runs/${res.data.run.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Gagal membuat Test Run')
    }
  }

  const handleBulkAssignOwner = async () => {
    if (selectedIds.size === 0) return
    const ownerId = window.prompt(
      'Set PIC / ownerId (user id) untuk case terpilih. Kosongkan untuk batal.'
    )
    if (ownerId === null || !ownerId.trim()) return
    try {
      await scenarioAPI.bulkAssignOwner([...selectedIds], ownerId.trim())
      setSelectedIds(new Set())
      refreshList()
      toast.success('PIC diperbarui')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Gagal assign PIC')
    }
  }

  const handleToggleFavorite = async (scenarioId) => {
    try {
      await toggleFavorite(scenarioId)
    } catch {
      // error shown via store
    }
  }

  const handleEditTags = async (scenario) => {
    const input = window.prompt(
      'Enter tags (comma-separated, max 20):',
      (scenario.tags || []).join(', ')
    )
    if (input === null) return
    const tags = input.split(',').map((t) => t.trim()).filter(Boolean)
    try {
      await updateScenarioTags(scenario.id, tags)
      toast.success('Tags disimpan')
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan tags')
    }
  }

  const handleFilterChange = async (filter) => {
    if (filter === 'recent') {
      fetchScenarios(0, pageSize)
    } else if (filter === 'active') {
      try {
        const response = await fetch('/api/scenarios/stats', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        })
        await response.json()
      } catch (err) {
        console.error('Failed to fetch scenario stats')
      }
    }
  }

  const handleCreateScenario = async (formData) => {
    try {
      await createScenario(formData.name, formData.description, formData.url, {
        folderId: activeFolderId || undefined,
      })
      setShowCreateForm(false)
      refreshList()
      toast.success('Case berhasil dibuat')
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Gagal membuat case')
    }
  }

  const handleUpdateScenario = async (formData) => {
    try {
      await updateScenario(editingScenario.id, formData.name, formData.description, formData.url)
      setEditingScenario(null)
      refreshList()
      fetchFolders()
      toast.success('Case berhasil diperbarui')
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Gagal memperbarui case')
    }
  }

  const handleViewScenario = (scenario) => {
    setSelectedScenario(scenario)
    navigate(`/scenarios/${scenario.id}`)
  }

  const handleEditScenario = (scenario) => {
    setEditingScenario(scenario)
    setShowCreateForm(false)
  }

  const handleDeleteScenario = async (scenarioOrId) => {
    const scenarioId = typeof scenarioOrId === 'object' ? scenarioOrId.id : scenarioOrId
    if (!window.confirm('Delete this scenario?')) return
    try {
      await deleteScenario(scenarioId)
      setSelectedIds(prev => { const n = new Set(prev); n.delete(scenarioId); return n })
      fetchFolders()
      toast.success('Case berhasil dihapus')
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Gagal menghapus case')
    }
  }

  const handleDuplicateScenario = async (scenarioOrId) => {
    const scenarioId = typeof scenarioOrId === 'object' ? scenarioOrId.id : scenarioOrId
    try {
      await duplicateScenario(scenarioId)
      fetchFolders()
      toast.success('Case berhasil diduplikasi')
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Gagal menduplikasi case')
    }
  }

  const handleMarkSmoke = async (scenarioId, isSmoking) => {
    try {
      const token = localStorage.getItem('authToken')
      const endpoint = isSmoking 
        ? `/api/smoke/mark/${scenarioId}` 
        : `/api/smoke/mark/${scenarioId}`
      const method = isSmoking ? 'POST' : 'DELETE'
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to mark scenario')
      }

      refreshList()
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleMarkStress = async (scenarioId, isStressing) => {
    try {
      const token = localStorage.getItem('authToken')
      const endpoint = isStressing 
        ? `/api/stress/mark/${scenarioId}` 
        : `/api/stress/mark/${scenarioId}`
      const method = isStressing ? 'POST' : 'DELETE'
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to mark scenario')
      }

      refreshList()
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleMarkSecurity = async (scenarioId, isSecurity) => {
    try {
      const token = localStorage.getItem('authToken')
      const endpoint = isSecurity 
        ? `/api/security/mark/${scenarioId}` 
        : `/api/security/mark/${scenarioId}`
      const method = isSecurity ? 'POST' : 'DELETE'
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to mark scenario')
      }

      refreshList()
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleLoadMore = () => {
    const newSkip = pagination.skip + pagination.take
    fetchScenarios(newSkip, pagination.take)
  }

  // ── Template Library ────────────────────────────────────────────────────────
  const handleTemplateCreated = (scenario) => {
    setShowTemplatePicker(false)
    refreshList()
    navigate(`/scenarios/${scenario.id}`)
  }

  // ── Quick Record Studio (create + record in modal; no autoRecord hop) ───────
  const handleQuickRecordFinished = (scenario, meta = {}) => {
    setShowQuickRecord(false)
    refreshList()
    fetchTags()
    if (scenario?.id && !meta.cancelled) {
      navigate(`/scenarios/${scenario.id}`)
      return
    }
    if (scenario?.id && meta.cancelled) {
      // Scenario may exist with 0 steps — still open detail so QA can retry/edit
      navigate(`/scenarios/${scenario.id}`)
    }
  }

  // ── Excel Import ────────────────────────────────────────────────────────────
  const handleFileUpload = async (file) => {
    if (!file) return

    setImportIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import/preview', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to preview Excel file')
      }

      const data = await response.json()
      setImportPreviewData(data.preview)
    } catch (error) {
      alert(`Error: ${error.message}`)
    } finally {
      setImportIsLoading(false)
    }
  }

  const handleConfirmImport = async (editedData) => {
    setImportIsLoading(true)
    try {
      const response = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          ...editedData,
          folderId: activeFolderId || null,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to import scenarios')
      }

      const result = await response.json()
      setShowImportModal(false)
      setImportPreviewData(null)
      refreshList()
      alert(`Success! Created ${result.scenarios.length} scenario(s)`)
    } catch (error) {
      alert(`Error: ${error.message}`)
    } finally {
      setImportIsLoading(false)
    }
  }

  const handleCloseImport = () => {
    if (!importIsLoading) {
      setShowImportModal(false)
      setImportPreviewData(null)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/import/template', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download template')
      }

      // Get the blob from response
      const blob = await response.blob()
      
      // Create a temporary URL and download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'scenario-template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  // ── Bulk Select ─────────────────────────────────────────────────────────────
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  const handleSelectAll = () => {
    if (scenarios.length > 0 && scenarios.every((s) => selectedIds.has(s.id))) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(scenarios.map((s) => s.id)))
    }
  }

  const folderLabel =
    selectedFolderKey === 'all'
      ? 'All scenarios'
      : selectedFolderKey === 'unfiled'
        ? 'No folder'
        : folderOptions.find((f) => f.id === selectedFolderKey)?.label || 'Folder'

  const emptyState =
    selectedFolderKey === 'all'
      ? {
          title: 'Belum ada test case',
          hint: 'Buat feature folder di sidebar (1 folder = 1 fitur), lalu Create Manual di dalamnya.',
        }
      : selectedFolderKey === 'unfiled'
        ? {
            title: 'Tidak ada case tanpa folder',
            hint: 'Case di sini belum digabung ke fitur. Pindahkan ke feature folder, atau Create Manual.',
          }
        : {
            title: `Belum ada test case di fitur “${folderLabel}”`,
            hint: 'Create Manual akan menaruh case baru di fitur ini. Satu case = satu flow.',
          }

  // ── Bulk Execute ─────────────────────────────────────────────────────────────
  const handleBulkExecute = async () => {
    const ids = [...selectedIds]
    const scenarioMap = Object.fromEntries(scenarios.map(s => [s.id, s.name]))
    setBulkResults(ids.map(id => ({ id, name: scenarioMap[id] || id, status: 'pending', executionId: null })))
    setBulkExecuteStatus('running')

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      setBulkResults(prev => prev.map(r => r.id === id ? { ...r, status: 'running' } : r))
      try {
        const res = await executionAPI.executeScenario(id, { browser: 'chromium', headless: true })
        const execution = res.data.execution
        setBulkResults(prev => prev.map(r =>
          r.id === id ? { ...r, status: execution.status === 'FAILED' ? 'failed' : 'passed', executionId: execution.id } : r
        ))
      } catch {
        setBulkResults(prev => prev.map(r => r.id === id ? { ...r, status: 'error' } : r))
      }
    }
    setBulkExecuteStatus('done')
  }

  const clearBulkState = () => {
    setSelectedIds(new Set())
    setBulkExecuteStatus(null)
    setBulkResults([])
  }

  return (
    <Layout onFolderSelectionChange={() => refreshList()} onFolderDrop={handleFolderDrop}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-subtle mb-1">
              Repository · {folderLabel}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink">{t.title}</h1>
            <p className="text-ink-muted mt-1">{t.subtitle}</p>
            {selectedFolderKey !== 'all' ? (
              <p className="text-xs text-ink-subtle mt-1">
                Urutan case: drag <span className="font-semibold">⋮⋮</span> ke baris atas/bawah.
                (Di “All scenarios” urutan ikut tanggal — buka feature folder untuk sort manual.)
              </p>
            ) : null}
          </div>
          {!showCreateForm && !editingScenario && (
            <div className="flex flex-wrap gap-2 self-start" ref={menuRef}>
              {/* Create Scenario Dropdown Menu */}
              <div className="relative">
                <input
                  type="file"
                  id="excel-upload"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0])
                      setShowImportModal(true)
                      setShowCreateMenu(false)
                    }
                  }}
                  className="hidden"
                />
                <ExportFormatButton
                  format="primary"
                  icon={Plus}
                  onClick={() => setShowCreateMenu(!showCreateMenu)}
                  className="text-sm !px-3 !py-2"
                  iconSize={16}
                  data-testid="create-scenario-btn"
                  trailing={
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${showCreateMenu ? 'rotate-180' : ''}`}
                    />
                  }
                >
                  {t.createScenarioBtn}
                </ExportFormatButton>

                {/* Dropdown Menu */}
                {showCreateMenu && (
                  <div className="absolute top-full right-0 mt-2 w-60 bg-white dark:bg-[#1F1E22] html.theme-light:bg-white border border-[#DDDDE0] dark:border-[rgba(255,255,255,0.12)] html.theme-light:border-[#DDDDE0] rounded-xl shadow-lg z-10 overflow-hidden p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(true)
                        setShowCreateMenu(false)
                      }}
                      title={t.createManualTooltip}
                      className="w-full px-2.5 py-2 text-left rounded-lg text-[#1A1A1C] dark:text-[#E0E0E2] html.theme-light:text-[#1A1A1C] hover:bg-[#F5F5F7] dark:hover:bg-[#2A2A2D] html.theme-light:hover:bg-[#F5F5F7] transition-colors flex items-center gap-2.5 group"
                    >
                      <SoftIconBadge variant="json" icon={PenLine} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium flex items-center gap-1">
                          {t.createManual}
                          <Tooltip text={t.createManualTooltip} position="right">
                            <HelpCircle size={13} className="text-[#999] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Tooltip>
                        </div>
                        <div className="text-xs text-[#666] dark:text-[#A0A0A4]">{t.createManualDesc}</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickRecord(true)
                        setShowCreateMenu(false)
                      }}
                      title={t.quickRecordTooltip}
                      className="w-full px-2.5 py-2 text-left rounded-lg text-[#1A1A1C] dark:text-[#E0E0E2] hover:bg-[#F5F5F7] dark:hover:bg-[#2A2A2D] html.theme-light:hover:bg-[#F5F5F7] transition-colors flex items-center gap-2.5 group mt-0.5"
                    >
                      <SoftIconBadge variant="csv" icon={Zap} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium flex items-center gap-1">
                          {t.quickRecord}
                          <Tooltip text={t.quickRecordTooltip} position="right">
                            <HelpCircle size={13} className="text-[#999] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Tooltip>
                        </div>
                        <div className="text-xs text-[#666] dark:text-[#A0A0A4]">{t.quickRecordDesc}</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowTemplatePicker(true)
                        setShowCreateMenu(false)
                      }}
                      title={t.templatesMenuTooltip}
                      className="w-full px-2.5 py-2 text-left rounded-lg text-[#1A1A1C] dark:text-[#E0E0E2] hover:bg-[#F5F5F7] dark:hover:bg-[#2A2A2D] html.theme-light:hover:bg-[#F5F5F7] transition-colors flex items-center gap-2.5 group mt-0.5"
                    >
                      <SoftIconBadge variant="html" icon={LayoutTemplate} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium flex items-center gap-1">
                          {t.templates}
                          <Tooltip text={t.templatesMenuTooltip} position="right">
                            <HelpCircle size={13} className="text-[#999] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Tooltip>
                        </div>
                        <div className="text-xs text-[#666] dark:text-[#A0A0A4]">{t.templatesDesc}</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey) {
                          handleDownloadTemplate()
                        } else {
                          document.getElementById('excel-upload').click()
                        }
                        setShowCreateMenu(false)
                      }}
                      title={t.importExcelTooltip}
                      className="w-full px-2.5 py-2 text-left rounded-lg text-[#1A1A1C] dark:text-[#E0E0E2] hover:bg-[#F5F5F7] dark:hover:bg-[#2A2A2D] html.theme-light:hover:bg-[#F5F5F7] transition-colors flex items-center gap-2.5 group mt-0.5"
                    >
                      <SoftIconBadge variant="csv" icon={FileSpreadsheet} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium flex items-center gap-1">
                          {t.importExcel}
                          <Tooltip text={t.importExcelTooltip} position="right">
                            <HelpCircle size={13} className="text-[#999] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Tooltip>
                        </div>
                        <div className="text-xs text-[#666] dark:text-[#A0A0A4]">{t.importExcelDesc}</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert type="error" message={error} onClose={clearError} />
        )}

        {/* Create/Edit Form */}
        {(showCreateForm || editingScenario) && (
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-[#E0E0E2]">
                {editingScenario ? 'Edit Scenario' : 'Create New Scenario'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setShowCreateForm(false); setEditingScenario(null) }}
                  className="text-[#666] hover:text-[#E0E0E2] text-2xl leading-none px-1"
                  type="button"
                >✕</button>
              </div>
            </div>
            {editingScenario ? (
              <p className="text-sm text-[#8A8A8F] mb-4 -mt-2">
                Ubah <strong className="text-[#E0E0E2]">nama</strong>, deskripsi, dan URL target. Step tetap di halaman detail.
              </p>
            ) : (
              <p className="text-sm text-[#8A8A8F] mb-4 -mt-2">
                Isi nama skenario. URL boleh dikosongkan dulu — steps bisa ditambah manual di detail.
              </p>
            )}

            <ScenarioForm
              onSubmit={editingScenario ? handleUpdateScenario : handleCreateScenario}
              initialScenario={editingScenario}
              isLoading={isLoading}
            />
          </Card>
        )}

        {/* Bulk Execute Panel */}
        {!showCreateForm && !editingScenario && selectedIds.size > 0 && (
          <div className="bg-[#0F766E]/10 border border-[#0F766E]/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#E0E0E2]">
                {t.selectedCount(selectedIds.size)}
              </p>
              {bulkExecuteStatus === 'running' && (
                <p className="text-xs text-[#8A8A8F] mt-1">{t.runningBulk}</p>
              )}
            </div>

            {/* Bulk Results */}
            {bulkResults.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {bulkResults.map(r => (
                  <div key={r.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[#0F0E11] border border-[rgba(255,255,255,0.07)]">
                    {r.status === 'pending' && <span className="text-[#555]">⏳</span>}
                    {r.status === 'running' && <Spinner size="sm" />}
                    {r.status === 'passed' && <span className="text-green-400">✓</span>}
                    {r.status === 'failed' && <span className="text-red-400">✗</span>}
                    {r.status === 'error' && <span className="text-yellow-400">!</span>}
                    <span className={
                      r.status === 'passed' ? 'text-green-400' :
                      r.status === 'failed' ? 'text-red-400' :
                      r.status === 'running' ? 'text-[#0F766E]' :
                      'text-[#8A8A8F]'
                    }>{r.name.length > 20 ? r.name.slice(0, 20) + '…' : r.name}</span>
                    {r.executionId && (
                      <button
                        onClick={() => navigate(`/scenarios/${r.id}`)}
                        className="text-[#0F766E] hover:underline ml-1"
                      >↗</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {bulkExecuteStatus !== 'running' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateTestRun}
                    disabled={bulkExecuteStatus === 'running'}
                    className="flex-1 sm:flex-none"
                  >
                    Create Test Run ({selectedIds.size})
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleBulkExecute}
                    disabled={bulkExecuteStatus === 'running'}
                    className="flex-1 sm:flex-none"
                  >
                    ▶ Auto Run
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleBulkMove}>
                    <FolderInput size={14} className="inline mr-1" />
                    Move…
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleBulkAssignOwner}>
                    Set PIC…
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={clearBulkState}>
                {bulkExecuteStatus === 'done' ? t.close : t.cancel}
              </Button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        {!showCreateForm && !editingScenario && (
          <Card>
            <ScenarioSearch
              onSearch={handleSearch}
              onFilterChange={handleFilterChange}
              isLoading={isLoading}
              availableTags={availableTags}
              favoritesOnly={favoritesOnly}
              filterTag={filterTag}
              onFavoritesChange={handleFavoritesChange}
              onTagChange={handleTagFilterChange}
            />
          </Card>
        )}

        {/* Repository table */}
        {!showCreateForm && !editingScenario && (
          <>
            <ScenarioRepositoryTable
              scenarios={scenarios}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleSelectAll}
              onOpen={handleViewScenario}
              onEdit={handleEditScenario}
              onDuplicate={handleDuplicateScenario}
              onDelete={handleDeleteScenario}
              onToggleFavorite={handleToggleFavorite}
              onMoveRequest={handleMoveRequest}
              onReorder={selectedFolderKey === 'all' ? undefined : handleReorder}
              reorderEnabled={selectedFolderKey !== 'all'}
              folderOptions={folderOptions}
              isLoading={isLoading}
              emptyTitle={emptyState.title}
              emptyHint={emptyState.hint}
              onCreateEmpty={() => setShowCreateForm(true)}
              createEmptyLabel={t.createManual}
            />
            {pagination.hasMore && (
              <div className="flex justify-center">
                <Button variant="secondary" size="sm" onClick={handleLoadMore} disabled={isLoading}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showTemplatePicker && (
        <TemplatePickerModal
          onClose={() => setShowTemplatePicker(false)}
          onCreated={handleTemplateCreated}
          folderId={activeFolderId}
        />
      )}
      {showQuickRecord && (
        <QuickRecordModal
          onClose={() => setShowQuickRecord(false)}
          onFinished={handleQuickRecordFinished}
          folderId={activeFolderId}
        />
      )}
      {showImportModal && importPreviewData && (
        <ImportPreviewModal
          data={importPreviewData}
          isLoading={importIsLoading}
          onConfirm={handleConfirmImport}
          onCancel={handleCloseImport}
        />
      )}
    </Layout>
  )
}
