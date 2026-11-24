import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  resolveUserMenuKeys,
  pathToMenuKey,
  menuKeyToPath,
} from '../constants/menuPermissions'
import HelpModal from './HelpModal'
import BrandLogo from './BrandLogo'
import ScenarioFolderTree from './ScenarioFolderTree'
import toast from 'react-hot-toast'
import { scenarioAPI } from '../services/api'
import { useFolderStore } from '../store/folderStore'
import {
  LayoutDashboard,
  ClipboardList,
  ListChecks,
  PlayCircle,
  FileBarChart2,
  PieChart,
  Bug,
  Link2,
  Settings,
  LogOut,
  User,
  Clock,
  Shield,
  HelpCircle,
  Activity,
  Gauge,
  GitBranch,
  Layers,
  ImageIcon,
  Network,
  AppWindow,
  Wrench,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
} from 'lucide-react'
import {
  getProfilePicture,
  claimLegacyProfilePicture,
} from '../utils/profilePictureStorage'

const SIDEBAR_EXPANDED_KEY = 'tsn.sidebarExpanded'
const FOLDER_PANE_OPEN_KEY = 'tsn.folderPaneOpen'
const COMPACT_MQ = '(max-width: 1279px)'

function readSidebarExpanded() {
  try {
    const raw = localStorage.getItem(SIDEBAR_EXPANDED_KEY)
    if (raw === null) return false
    return raw === 'true'
  } catch {
    return false
  }
}

function readFolderPaneOpen() {
  try {
    const raw = localStorage.getItem(FOLDER_PANE_OPEN_KEY)
    if (raw === null) return true
    return raw === 'true'
  } catch {
    return true
  }
}

export default function Layout({ children, showFolderPane = false, onFolderSelectionChange, onFolderDrop }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(readSidebarExpanded)
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(COMPACT_MQ).matches : true
  )
  const [profilePicture, setProfilePicture] = useState(null)
  const [folderPaneOpen, setFolderPaneOpen] = useState(readFolderPaneOpen)
  const userMenuRef = useRef(null)
  const toolsRef = useRef(null)
  const allowedMenuKeys = useMemo(() => new Set(resolveUserMenuKeys(user)), [user])

  // Folder tree only on the repository list — not on /scenarios/:id detail
  const onScenariosList = /^\/scenarios\/?$/.test(location.pathname)
  const folderPaneVisible = showFolderPane || onScenariosList
  /** On compact screens, expanded nav is an overlay — in-flow rail stays icon-only. */
  const inFlowExpanded = sidebarExpanded && !isCompact
  const overlayNavOpen = sidebarExpanded && isCompact
  const showNavLabels = sidebarExpanded

  useEffect(() => {
    const mq = window.matchMedia(COMPACT_MQ)
    const onChange = () => setIsCompact(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!user || user.role === 'ADMIN') return
    const pathname = location.pathname
    if (pathname.startsWith('/settings')) return
    const menuKey = pathToMenuKey(pathname)
    if (!menuKey) return
    if (!allowedMenuKeys.has(menuKey)) {
      const fallbackKey = resolveUserMenuKeys(user)[0]
      navigate(menuKeyToPath(fallbackKey) || '/dashboard', { replace: true })
    }
  }, [location.pathname, user, allowedMenuKeys, navigate])

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
      if (toolsRef.current && !toolsRef.current.contains(e.target)) setToolsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const loadProfilePicture = () => {
      try {
        if (user?.id) claimLegacyProfilePicture(user.id)
        setProfilePicture(getProfilePicture(user?.id))
      } catch {
        setProfilePicture(null)
      }
    }
    const handleProfilePictureUpdate = (event) => {
      const detail = event.detail
      if (detail && typeof detail === 'object' && 'picture' in detail) {
        if (detail.userId && user?.id && detail.userId !== user.id) return
        setProfilePicture(detail.picture || null)
        return
      }
      // Legacy event payload was a raw base64 string
      if (user?.id) setProfilePicture(detail || null)
    }
    loadProfilePicture()
    window.addEventListener('storage', loadProfilePicture)
    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate)
    return () => {
      window.removeEventListener('storage', loadProfilePicture)
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate)
    }
  }, [user?.id])

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_EXPANDED_KEY, String(sidebarExpanded))
    } catch {
      /* ignore */
    }
  }, [sidebarExpanded])

  useEffect(() => {
    try {
      localStorage.setItem(FOLDER_PANE_OPEN_KEY, String(folderPaneOpen))
    } catch {
      /* ignore */
    }
  }, [folderPaneOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleFolderDrop = async (payload) => {
    const { scenarioId, targetFolderId } = payload || {}
    if (scenarioId) {
      try {
        await scenarioAPI.move([scenarioId], targetFolderId ?? null)
        await useFolderStore.getState().fetchFolders()
        toast.success(
          targetFolderId ? 'Case dipindahkan ke folder' : 'Case dipindahkan ke No folder'
        )
      } catch (e) {
        toast.error(e.response?.data?.message || e.message || 'Failed to move scenario')
        return
      }
    }
    onFolderDrop?.(payload)
  }

  const toggleSidebar = () => {
    setSidebarExpanded((v) => {
      const next = !v
      if (next && isCompact) setFolderPaneOpen(false)
      return next
    })
  }

  const toggleFolderPane = () => {
    setFolderPaneOpen((v) => {
      const next = !v
      if (next && isCompact) setSidebarExpanded(false)
      return next
    })
  }

  const mainItems = [
    { key: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { key: 'scenarios', name: 'Cases', path: '/scenarios', icon: ClipboardList },
    { key: 'test-runs', name: 'Test Runs', path: '/test-runs', icon: ListChecks },
    { key: 'execution', name: 'Execution', path: '/execution', icon: PlayCircle },
    { key: 'reports', name: 'Reports', path: '/reports', icon: FileBarChart2 },
    { key: 'analytics', name: 'Analytics', path: '/analytics', icon: PieChart },
    { key: 'issues', name: 'Bugs', path: '/issues', icon: Bug },
  ].filter((item) => allowedMenuKeys.has(item.key))

  const toolItems = [
    { key: 'environments', name: 'Environments', path: '/environments', icon: Layers },
    { key: 'visual-regression', name: 'Visual Regression', path: '/visual-regression', icon: ImageIcon },
    { key: 'chains', name: 'Chains', path: '/chains', icon: Link2 },
    { key: 'api-testing', name: 'API Testing', path: '/api-testing', icon: Network },
    { key: 'scheduler', name: 'Scheduler', path: '/scheduler', icon: Clock },
    { key: 'parallel', name: 'Parallel', path: '/parallel', icon: GitBranch },
    { key: 'smoke-test', name: 'Smoke Test', path: '/smoke-test', icon: Activity },
    { key: 'stress-test', name: 'Stress Test', path: '/stress-test', icon: Gauge },
    { key: 'security-test', name: 'Security Test', path: '/security-test', icon: Shield },
    { key: 'browser-matrix', name: 'Browser Test', path: '/browser-matrix', icon: AppWindow },
  ].filter((item) => allowedMenuKeys.has(item.key))

  const pageTitle =
    [...mainItems, ...toolItems].find((m) => location.pathname.startsWith(m.path))?.name ?? ''

  const toolsActive = toolItems.some((t) => location.pathname.startsWith(t.path))

  const RailLink = ({ item, onNavigate }) => {
    const Icon = item.icon
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    return (
      <Link
        to={item.path}
        title={showNavLabels ? undefined : item.name}
        onClick={() => {
          onNavigate?.()
        }}
        className={[
          'rounded-lg flex items-center transition-colors',
          showNavLabels
            ? 'w-full h-10 px-2.5 gap-2.5 justify-start'
            : 'w-10 h-10 justify-center',
          isActive
            ? 'bg-brand text-white shadow-sm'
            : 'text-white/70 hover:bg-white/10 hover:text-white',
        ].join(' ')}
      >
        <Icon size={18} className="shrink-0" />
        {showNavLabels && (
          <span className="text-sm font-medium truncate">{item.name}</span>
        )}
      </Link>
    )
  }

  const renderToolsMenu = ({ onNavigate, labels = false } = {}) => {
    if (toolItems.length === 0) return null
    return (
      <div
        className={['relative shrink-0', labels ? 'w-full mt-1' : 'mt-1']}
        ref={toolsRef}
      >
        <button
          type="button"
          title={labels ? undefined : 'Tools'}
          aria-expanded={toolsOpen}
          aria-haspopup="menu"
          onClick={() => setToolsOpen((v) => !v)}
          className={[
            'rounded-lg flex items-center transition-colors',
            labels
              ? 'w-full h-10 px-2.5 gap-2.5 justify-start'
              : 'w-10 h-10 justify-center',
            toolsActive
              ? 'bg-brand text-white'
              : 'text-white/70 hover:bg-white/10 hover:text-white',
          ].join(' ')}
        >
          <Wrench size={18} className="shrink-0" strokeWidth={2} />
          {labels && (
            <>
              <span className="text-sm font-medium flex-1 text-left truncate">Tools</span>
              <ChevronDown
                size={14}
                className={`shrink-0 opacity-70 transition-transform ${toolsOpen ? 'rotate-180' : ''}`}
              />
            </>
          )}
        </button>
        {toolsOpen && (
          labels ? (
            <div className="mt-1 ml-2 pl-2 border-l border-white/15 space-y-0.5 max-h-[min(40vh,16rem)] overflow-y-auto">
              {toolItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      setToolsOpen(false)
                      onNavigate?.()
                    }}
                    className={[
                      'flex items-center gap-2 px-2.5 py-2 rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-brand/80 text-white'
                        : 'text-white/65 hover:bg-white/10 hover:text-white',
                    ].join(' ')}
                  >
                    <Icon size={14} className="shrink-0" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div
              role="menu"
              className="fixed z-[80] w-56 max-h-[min(70vh,24rem)] overflow-y-auto rounded-lg border border-surface-border bg-white shadow-xl py-1"
              style={{
                left: '3.75rem',
                bottom: '5.5rem',
              }}
            >
              {toolItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    role="menuitem"
                    to={item.path}
                    onClick={() => {
                      setToolsOpen(false)
                      onNavigate?.()
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
                  >
                    <Icon size={15} className="shrink-0 text-brand" />
                    <span className="truncate">{item.name}</span>
                  </Link>
                )
              })}
            </div>
          )
        )}
      </div>
    )
  }

  const renderNavBody = ({ onNavigate, forceLabels = false } = {}) => {
    const labels = forceLabels || showNavLabels
    return (
      <>
        <nav className={[
          'flex-1 flex flex-col gap-1 overflow-y-auto py-1 w-full min-h-0',
          labels ? '' : 'items-center px-2',
        ].join(' ')}>
          {mainItems.map((item) => (
            <RailLink
              key={item.path}
              item={item}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        {renderToolsMenu({ onNavigate, labels })}

        <div className={[
          'flex flex-col gap-1 pb-1 shrink-0',
          labels ? '' : 'items-center px-2',
        ].join(' ')}>
          <button
            type="button"
            title={labels ? undefined : 'How to use'}
            onClick={() => {
              setHelpOpen(true)
              onNavigate?.()
            }}
            className={[
              'rounded-lg flex items-center transition-colors text-white/70 hover:bg-white/10 hover:text-white',
              labels ? 'w-full h-10 px-2.5 gap-2.5' : 'w-10 h-10 justify-center',
            ].join(' ')}
          >
            <HelpCircle size={18} className="shrink-0" />
            {labels && <span className="text-sm font-medium">How to use</span>}
          </button>
          <Link
            to="/settings"
            title={labels ? undefined : 'Settings'}
            onClick={() => onNavigate?.()}
            className={[
              'rounded-lg flex items-center transition-colors',
              labels ? 'w-full h-10 px-2.5 gap-2.5' : 'w-10 h-10 justify-center',
              location.pathname.startsWith('/settings')
                ? 'bg-brand text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            <Settings size={18} className="shrink-0" />
            {labels && <span className="text-sm font-medium">Settings</span>}
          </Link>
        </div>
      </>
    )
  }

  return (
    <div className="flex h-screen bg-surface-muted overflow-hidden">
      {/* In-flow rail: icons only on compact; expanded width only on xl+ */}
      <aside
        className={[
          'shrink-0 flex flex-col py-3 gap-1 bg-[#0E2F30] text-white z-30 transition-[width] duration-200 ease-out',
          inFlowExpanded ? 'w-52 px-2' : 'w-14 items-center',
        ].join(' ')}
      >
        <div className={[
          'flex items-center mb-2',
          inFlowExpanded ? 'justify-between px-1 w-full' : 'flex-col gap-1',
        ].join(' ')}>
          <Link
            to="/dashboard"
            title="Test Sambil Ngopi"
            className="flex items-center gap-2 min-w-0"
          >
            <BrandLogo size="xs" />
            {inFlowExpanded && (
              <span className="text-xs font-semibold tracking-wide truncate text-white/90">
                Test Sambil Ngopi
              </span>
            )}
          </Link>
          <button
            type="button"
            title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarExpanded}
            onClick={toggleSidebar}
            className="w-8 h-8 rounded-md flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white shrink-0"
          >
            {sidebarExpanded ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
          </button>
        </div>

        {/* Compact: always icon rail. Desktop expanded: full labels in-flow */}
        {inFlowExpanded
          ? renderNavBody()
          : (
            <>
              <nav className="flex-1 flex flex-col items-center gap-1 overflow-y-auto py-1 w-full px-2 min-h-0">
                {mainItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={item.name}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        isActive ? 'bg-brand text-white shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon size={18} />
                    </Link>
                  )
                })}
              </nav>
              <div className="flex flex-col items-center gap-1 px-2 pb-1 shrink-0">
                {!overlayNavOpen && renderToolsMenu({ labels: false })}
                <button
                  type="button"
                  title="How to use"
                  onClick={() => setHelpOpen(true)}
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <HelpCircle size={18} />
                </button>
                <Link
                  to="/settings"
                  title="Settings"
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    location.pathname.startsWith('/settings')
                      ? 'bg-brand text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Settings size={18} />
                </Link>
              </div>
            </>
          )}
      </aside>

      {/* Compact expanded nav overlay — does not shrink main content */}
      {overlayNavOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-ink/40 border-0 cursor-default"
            aria-label="Close sidebar"
            onClick={() => setSidebarExpanded(false)}
          />
          <aside className="fixed inset-y-0 left-14 z-50 w-52 flex flex-col py-3 px-2 gap-1 bg-[#0E2F30] text-white shadow-2xl">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-xs font-semibold tracking-wide truncate text-white/90 pl-1">
                Menu
              </span>
              <button
                type="button"
                title="Collapse sidebar"
                onClick={() => setSidebarExpanded(false)}
                className="w-8 h-8 rounded-md flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
            {renderNavBody({
              forceLabels: true,
              onNavigate: () => setSidebarExpanded(false),
            })}
          </aside>
        </>
      )}

      {/* Folder pane: push layout — collapsible on all breakpoints */}
      {folderPaneVisible && (
        <aside
          className={[
            'folder-pane shrink-0 z-20 bg-surface-sidebar border-r border-surface-border overflow-hidden',
            'transition-[width] duration-200 ease-out',
            folderPaneOpen ? 'w-[min(16rem,75vw)] xl:w-64' : 'w-0',
          ].join(' ')}
          data-folder-pane
        >
          <div className="w-[min(16rem,75vw)] xl:w-64 h-full overflow-y-auto">
            <ScenarioFolderTree
              onSelectionChange={(key) => {
                onFolderSelectionChange?.(key)
                if (isCompact) setFolderPaneOpen(false)
              }}
              onDropScenario={handleFolderDrop}
              onCollapse={() => setFolderPaneOpen(false)}
            />
          </div>
        </aside>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex items-center justify-between px-3 sm:px-4 py-2.5 shrink-0 app-header-bar gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {folderPaneVisible && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border border-surface-border text-ink-muted hover:text-ink hover:bg-surface-muted shrink-0"
                onClick={toggleFolderPane}
                title={folderPaneOpen ? 'Sembunyikan feature folders' : 'Tampilkan feature folders'}
              >
                {folderPaneOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
                <span className="hidden sm:inline">{folderPaneOpen ? 'Hide folders' : 'Folders'}</span>
              </button>
            )}
            <span className="text-sm font-semibold text-ink truncate">{pageTitle}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0" ref={userMenuRef}>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-8 h-8 rounded-full bg-brand flex items-center justify-center text-white text-[11px] font-bold hover:bg-brand-hover overflow-hidden"
                title={user?.name || 'User'}
              >
                {profilePicture ? (
                  <img src={profilePicture} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  (user?.name || 'U')[0].toUpperCase()
                )}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-10 w-52 rounded-lg shadow-xl z-50 user-dropdown">
                  <div className="px-3 py-2.5 user-dropdown-header">
                    <p className="text-xs font-semibold text-ink truncate">{user?.name || 'User'}</p>
                    <p className="text-[11px] text-ink-muted truncate">{user?.email || ''}</p>
                    {user?.role && (
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        user.role === 'ADMIN'
                          ? 'bg-brand-soft text-brand'
                          : user.role === 'LEAD'
                            ? 'bg-[#0F766E]/15 text-[#5EEAD4]'
                            : user.role === 'VIEWER'
                              ? 'bg-surface-muted text-ink-muted'
                              : 'bg-surface-muted text-ink-muted'
                      }`}>
                        {user.role === 'USER' ? 'TESTER' : user.role}
                      </span>
                    )}
                  </div>
                  <div className="p-1">
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-ink-muted hover:text-ink hover:bg-surface-muted"
                    >
                      <User size={13} />
                      Profile & Settings
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout() }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-ink-muted hover:text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={13} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-main flex-1 overflow-auto overflow-x-hidden p-3 sm:p-4 md:p-5 bg-surface-muted">
          <div className={`app-page mx-auto w-full min-w-0 ${folderPaneVisible ? 'max-w-none' : 'max-w-[1600px]'}`}>
            {children}
          </div>
        </main>
      </div>

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  )
}
