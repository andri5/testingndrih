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
import { scenarioAPI } from '../services/api'
import { useFolderStore } from '../store/folderStore'
import {
  LayoutDashboard,
  ClipboardList,
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
  Globe,
  HelpCircle,
  Activity,
  Gauge,
  GitBranch,
  Layers,
  Image,
  Wrench,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
} from 'lucide-react'

const SIDEBAR_EXPANDED_KEY = 'tsn.sidebarExpanded'

function readSidebarExpanded() {
  try {
    const raw = localStorage.getItem(SIDEBAR_EXPANDED_KEY)
    if (raw === null) return false
    return raw === 'true'
  } catch {
    return false
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
  const [profilePicture, setProfilePicture] = useState(null)
  const [mobileFoldersOpen, setMobileFoldersOpen] = useState(false)
  const userMenuRef = useRef(null)
  const toolsRef = useRef(null)
  const allowedMenuKeys = useMemo(() => new Set(resolveUserMenuKeys(user)), [user])

  const onScenarios = location.pathname.startsWith('/scenarios')
  const folderPaneVisible = showFolderPane || onScenarios

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
      const picture = localStorage.getItem('profilePicture')
      if (!picture) return
      try { setProfilePicture(JSON.parse(picture)) } catch { /* ignore */ }
    }
    const handleProfilePictureUpdate = (event) => setProfilePicture(event.detail)
    loadProfilePicture()
    window.addEventListener('storage', loadProfilePicture)
    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate)
    return () => {
      window.removeEventListener('storage', loadProfilePicture)
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate)
    }
  }, [])

  useEffect(() => {
    setMobileFoldersOpen(false)
  }, [location.pathname])

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_EXPANDED_KEY, String(sidebarExpanded))
    } catch {
      /* ignore */
    }
  }, [sidebarExpanded])

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
      } catch (e) {
        window.alert(e.response?.data?.message || e.message || 'Failed to move scenario')
        return
      }
    }
    onFolderDrop?.(payload)
  }

  const toggleSidebar = () => setSidebarExpanded((v) => !v)

  const mainItems = [
    { key: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { key: 'scenarios', name: 'Scenarios', path: '/scenarios', icon: ClipboardList },
    { key: 'execution', name: 'Execution', path: '/execution', icon: PlayCircle },
    { key: 'environments', name: 'Environments', path: '/environments', icon: Layers },
    { key: 'reports', name: 'Reports', path: '/reports', icon: FileBarChart2 },
    { key: 'analytics', name: 'Analytics', path: '/analytics', icon: PieChart },
    { key: 'issues', name: 'Bugs', path: '/issues', icon: Bug },
  ].filter((item) => allowedMenuKeys.has(item.key))

  const toolItems = [
    { key: 'visual-regression', name: 'Visual Regression', path: '/visual-regression', icon: Image },
    { key: 'chains', name: 'Chains', path: '/chains', icon: Link2 },
    { key: 'api-testing', name: 'API Testing', path: '/api-testing', icon: Globe },
    { key: 'scheduler', name: 'Scheduler', path: '/scheduler', icon: Clock },
    { key: 'parallel', name: 'Parallel', path: '/parallel', icon: GitBranch },
    { key: 'smoke-test', name: 'Smoke Test', path: '/smoke-test', icon: Activity },
    { key: 'stress-test', name: 'Stress Test', path: '/stress-test', icon: Gauge },
    { key: 'security-test', name: 'Security Test', path: '/security-test', icon: Shield },
    { key: 'browser-matrix', name: 'Browser Test', path: '/browser-matrix', icon: Globe },
  ].filter((item) => allowedMenuKeys.has(item.key))

  const pageTitle =
    [...mainItems, ...toolItems].find((m) => location.pathname.startsWith(m.path))?.name ?? ''

  const toolsActive = toolItems.some((t) => location.pathname.startsWith(t.path))

  const RailLink = ({ item }) => {
    const Icon = item.icon
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    return (
      <Link
        to={item.path}
        title={sidebarExpanded ? undefined : item.name}
        className={[
          'rounded-lg flex items-center transition-colors',
          sidebarExpanded
            ? 'w-full h-10 px-2.5 gap-2.5 justify-start'
            : 'w-10 h-10 justify-center',
          isActive
            ? 'bg-brand text-white shadow-sm'
            : 'text-white/70 hover:bg-white/10 hover:text-white',
        ].join(' ')}
      >
        <Icon size={18} className="shrink-0" />
        {sidebarExpanded && (
          <span className="text-sm font-medium truncate">{item.name}</span>
        )}
      </Link>
    )
  }

  return (
    <div className="flex h-screen bg-surface-muted overflow-hidden">
      {/* Sidebar rail */}
      <aside
        className={[
          'shrink-0 flex flex-col py-3 gap-1 bg-[#0E2F30] text-white z-30 transition-[width] duration-200 ease-out',
          sidebarExpanded ? 'w-52 px-2' : 'w-14 items-center',
        ].join(' ')}
      >
        <div className={[
          'flex items-center mb-2',
          sidebarExpanded ? 'justify-between px-1' : 'flex-col gap-1',
        ].join(' ')}>
          <Link
            to="/dashboard"
            title="Test Sambil Ngopi"
            className={['flex items-center gap-2 min-w-0', sidebarExpanded ? '' : ''].join(' ')}
          >
            <BrandLogo size="xs" />
            {sidebarExpanded && (
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

        <nav className={[
          'flex-1 flex flex-col gap-1 overflow-y-auto py-1 w-full',
          sidebarExpanded ? '' : 'items-center px-2',
        ].join(' ')}>
          {mainItems.map((item) => (
            <RailLink key={item.path} item={item} />
          ))}

          {toolItems.length > 0 && (
            <div className={['relative mt-1', sidebarExpanded ? 'w-full' : ''].join(' ')} ref={toolsRef}>
              <button
                type="button"
                title={sidebarExpanded ? undefined : 'Tools'}
                onClick={() => setToolsOpen((v) => !v)}
                className={[
                  'rounded-lg flex items-center transition-colors',
                  sidebarExpanded
                    ? 'w-full h-10 px-2.5 gap-2.5 justify-start'
                    : 'w-10 h-10 justify-center',
                  toolsActive
                    ? 'bg-brand text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                ].join(' ')}
              >
                <Wrench size={18} className="shrink-0" />
                {sidebarExpanded && (
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
                sidebarExpanded ? (
                  <div className="mt-1 ml-2 pl-2 border-l border-white/15 space-y-0.5 max-h-[min(50vh,18rem)] overflow-y-auto">
                    {toolItems.map((item) => {
                      const Icon = item.icon
                      const isActive =
                        location.pathname === item.path || location.pathname.startsWith(item.path + '/')
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setToolsOpen(false)}
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
                  <div className="absolute left-12 top-0 w-52 max-h-[min(70vh,24rem)] overflow-y-auto rounded-lg border border-surface-border bg-white shadow-xl py-1 z-50">
                    {toolItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setToolsOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
                        >
                          <Icon size={14} />
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                )
              )}
            </div>
          )}
        </nav>

        <div className={[
          'flex flex-col gap-1 pb-1',
          sidebarExpanded ? '' : 'items-center px-2',
        ].join(' ')}>
          <button
            type="button"
            title={sidebarExpanded ? undefined : 'How to use'}
            onClick={() => setHelpOpen(true)}
            className={[
              'rounded-lg flex items-center transition-colors text-white/70 hover:bg-white/10 hover:text-white',
              sidebarExpanded ? 'w-full h-10 px-2.5 gap-2.5' : 'w-10 h-10 justify-center',
            ].join(' ')}
          >
            <HelpCircle size={18} className="shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium">How to use</span>}
          </button>
          <Link
            to="/settings"
            title={sidebarExpanded ? undefined : 'Settings'}
            className={[
              'rounded-lg flex items-center transition-colors',
              sidebarExpanded ? 'w-full h-10 px-2.5 gap-2.5' : 'w-10 h-10 justify-center',
              location.pathname.startsWith('/settings')
                ? 'bg-brand text-white'
                : 'text-white/70 hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            <Settings size={18} className="shrink-0" />
            {sidebarExpanded && <span className="text-sm font-medium">Settings</span>}
          </Link>
        </div>
      </aside>

      {/* Folder pane (scenarios) */}
      {folderPaneVisible && (
        <>
          {mobileFoldersOpen && (
            <div
              className="fixed inset-0 bg-ink/40 z-40 lg:hidden"
              onClick={() => setMobileFoldersOpen(false)}
            />
          )}
          <aside
            className={[
              'w-64 shrink-0 z-40 bg-surface-sidebar',
              'fixed inset-y-0 lg:static lg:translate-x-0',
              sidebarExpanded ? 'left-52' : 'left-14',
              mobileFoldersOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
              'transition-[transform,left] duration-200',
            ].join(' ')}
          >
            <ScenarioFolderTree
              onSelectionChange={(key) => {
                onFolderSelectionChange?.(key)
                setMobileFoldersOpen(false)
              }}
              onDropScenario={handleFolderDrop}
            />
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex items-center justify-between px-4 py-2.5 shrink-0 app-header-bar">
          <div className="flex items-center gap-2 min-w-0">
            {folderPaneVisible && (
              <button
                type="button"
                className="lg:hidden px-2 py-1 text-xs rounded-md border border-surface-border text-ink-muted"
                onClick={() => setMobileFoldersOpen((v) => !v)}
              >
                Folders
              </button>
            )}
            <span className="text-sm font-semibold text-ink truncate">{pageTitle}</span>
          </div>

          <div className="flex items-center gap-2" ref={userMenuRef}>
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
                        user.role === 'ADMIN' ? 'bg-brand-soft text-brand' : 'bg-surface-muted text-ink-muted'
                      }`}>
                        {user.role}
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
          <div className={`app-page mx-auto w-full ${folderPaneVisible ? 'max-w-none' : 'max-w-[1600px]'}`}>
            {children}
          </div>
        </main>
      </div>

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  )
}
