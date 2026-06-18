import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  resolveUserMenuKeys,
  pathToMenuKey,
  menuKeyToPath,
} from '../constants/menuPermissions'
import { GlobalLoading } from './Loading'
import HelpModal from './HelpModal'
import {
  LayoutDashboard,
  ClipboardList,
  PlayCircle,
  BarChart2,
  ArrowUpDown,
  Link2,
  Settings,
  LogOut,
  Menu,
  ChevronsUpDown,
  User,
  X,
  Clock,
  Zap,
  Shield,
  Globe,
  HelpCircle,
  Activity,
  Gauge,
  GitBranch,
  ChevronDown,
  Layers,
  Image,
} from 'lucide-react'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [profilePicture, setProfilePicture] = useState(null)
  const [toolsCollapsed, setToolsCollapsed] = useState(true)
  const userMenuRef = useRef(null)
  const isAdmin = user?.role === 'ADMIN'
  const allowedMenuKeys = useMemo(() => new Set(resolveUserMenuKeys(user)), [user])

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

  const labels = {
    main: 'Main',
    tools: 'Tools',
    dashboard: 'Dashboard',
    scenarios: 'Scenarios',
    chains: 'Chains',
    execution: 'Execution',
    reports: 'Reports',
    analytics: 'Analytics',
    apiTesting: 'API Testing',
    environments: 'Environments',
    visualRegression: 'Visual Regression',
    scheduler: 'Scheduler',
    parallel: 'Parallel',
    smokeTest: 'Smoke Test',
    stressTest: 'Stress Test',
    securityTest: 'Security Test',
    browserTest: 'Browser Test',
    signOut: 'Sign out',
    profileSettings: 'Profile & Settings',
    settings: 'Settings',
    toggleSidebar: 'Toggle sidebar',
    workspace: 'Workspace',
    howToUse: 'How to use',
  }
  const t = labels

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [location.pathname])

  // Close user dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Load profile picture from localStorage
  useEffect(() => {
    const loadProfilePicture = () => {
      const picture = localStorage.getItem('profilePicture')
      if (picture) {
        try {
          setProfilePicture(JSON.parse(picture))
        } catch (e) {
          console.error('Failed to parse profile picture:', e)
        }
      }
    }
    
    const handleProfilePictureUpdate = (event) => {
      setProfilePicture(event.detail)
    }
    
    loadProfilePicture()
    
    // Listen for storage changes (when profile picture is updated in another tab/window)
    window.addEventListener('storage', loadProfilePicture)
    
    // Listen for custom event (when profile picture is updated in the same tab)
    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate)
    
    return () => {
      window.removeEventListener('storage', loadProfilePicture)
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate)
    }
  }, [])

  const handleMenuToggle = () => {
    if (window.innerWidth < 1024) {
      setMobileSidebarOpen(v => !v)
    } else {
      setSidebarOpen(v => !v)
    }
  }

  const mainItems = [
    { key: 'dashboard', name: t.dashboard, path: '/dashboard', icon: <LayoutDashboard size={16} /> },
    { key: 'scenarios', name: t.scenarios, path: '/scenarios', icon: <ClipboardList size={16} /> },
    { key: 'execution', name: t.execution, path: '/execution', icon: <PlayCircle size={16} /> },
    { key: 'environments', name: t.environments, path: '/environments', icon: <Layers size={16} /> },
    { key: 'reports', name: t.reports, path: '/reports', icon: <BarChart2 size={16} /> },
    { key: 'analytics', name: t.analytics, path: '/analytics', icon: <BarChart2 size={16} /> },
  ].filter((item) => allowedMenuKeys.has(item.key))

  const workspaceItems = [
    { key: 'visual-regression', name: t.visualRegression, path: '/visual-regression', icon: <Image size={16} /> },
    { key: 'chains', name: t.chains, path: '/chains', icon: <Link2 size={16} /> },
    { key: 'api-testing', name: t.apiTesting, path: '/api-testing', icon: <Globe size={16} /> },
    { key: 'scheduler', name: t.scheduler, path: '/scheduler', icon: <Clock size={16} /> },
    { key: 'parallel', name: t.parallel, path: '/parallel', icon: <GitBranch size={16} /> },
    { key: 'smoke-test', name: t.smokeTest, path: '/smoke-test', icon: <Activity size={16} /> },
    { key: 'stress-test', name: t.stressTest, path: '/stress-test', icon: <Gauge size={16} /> },
    { key: 'security-test', name: t.securityTest, path: '/security-test', icon: <Shield size={16} /> },
    { key: 'browser-matrix', name: t.browserTest, path: '/browser-matrix', icon: <Globe size={16} /> },
  ].filter((item) => allowedMenuKeys.has(item.key))

  const visibleWorkspaceItems = workspaceItems
  const showToolsSection = visibleWorkspaceItems.length > 0
  const allItems = [...mainItems, ...visibleWorkspaceItems]

  const NavItem = ({ item, showLabel }) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    return (
      <Link
        to={item.path}
        title={!showLabel ? item.name : undefined}
        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs sm:text-sm transition-all duration-100
          ${isActive
            ? 'nav-item-active text-[#E0E0E2]'
            : 'text-[#8A8A8F] hover:text-[#E0E0E2] hover:bg-[rgba(255,255,255,0.04)]'
          }`}
      >
        <span className="shrink-0">{item.icon}</span>
        {showLabel && <span className="font-medium truncate">{item.name}</span>}
      </Link>
    )
  }

  // Labels shown: always on mobile overlay, on desktop based on sidebarOpen
  const showLabels = mobileSidebarOpen || sidebarOpen

  return (
    <div className="flex h-screen bg-[#0F0E11] overflow-hidden">

      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────────── */}
      <aside className={[
        // Mobile: fixed overlay, always w-56, slides in/out
        'fixed inset-y-0 left-0 z-50 w-56 flex flex-col sidebar-panel',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: relative, part of flex layout, no transform
        'lg:relative lg:inset-y-auto lg:left-auto lg:z-auto lg:translate-x-0',
        sidebarOpen ? 'lg:w-56' : 'lg:w-12',
        'transition-transform lg:transition-all duration-200 shrink-0',
      ].join(' ')}>

        {/* Workspace Switcher */}
        <div className="flex items-center gap-2.5 px-3 py-3.5 shrink-0 sidebar-top-divider">
          <div className="shrink-0 w-6 h-6 rounded-md bg-[#5E6AD2] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {showLabels && (
            <div className="flex-1 min-w-0 flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-[#E0E0E2] text-sm leading-tight truncate">Test Sambil Ngopi</p>
                <p className="text-[10px] text-[#8A8A8F] leading-tight">{t.workspace}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ChevronsUpDown size={14} className="text-[#4A4A52]" />
                {/* Close button on mobile */}
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="lg:hidden w-5 h-5 flex items-center justify-center rounded text-[#4A4A52] hover:text-[#E0E0E2] transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          <div className="space-y-0.5">
            {showLabels && (
              <p className="px-2.5 text-[10px] font-semibold text-[#4A4A52] uppercase tracking-widest mb-1.5">{t.main}</p>
            )}
            {mainItems.map(item => <NavItem key={item.path} item={item} showLabel={showLabels} />)}
          </div>

          {showToolsSection && (
            <div className="space-y-0.5">
              {showLabels && (
                <button
                  onClick={() => setToolsCollapsed(!toolsCollapsed)}
                  className="w-full flex items-center justify-between px-2.5 mb-1.5 hover:text-[#E0E0E2] transition-colors group"
                >
                  <p className="text-[10px] font-semibold text-[#4A4A52] uppercase tracking-widest group-hover:text-[#5E6AD2]">{t.tools}</p>
                  <ChevronDown size={13} className={`text-[#4A4A52] transition-transform duration-200 ${toolsCollapsed ? '' : 'rotate-180'}`} />
                </button>
              )}
              {!toolsCollapsed && visibleWorkspaceItems.map(item => (
                <NavItem key={item.path} item={item} showLabel={showLabels} />
              ))}
            </div>
          )}
        </nav>

        {/* Sign out */}
        <div className="shrink-0 px-2 py-3 sidebar-bottom-divider">
          <button
            onClick={handleLogout}
            title={t.signOut}
            className="nav-logout w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[#8A8A8F] hover:text-[#F87171] hover:bg-[rgba(248,113,113,0.06)] transition-all duration-100 text-sm"
          >
            <LogOut size={15} className="shrink-0" />
            {showLabels && <span className="font-medium">{t.signOut}</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Area ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2.5 shrink-0 app-header-bar">
          <button
            onClick={handleMenuToggle}
            className="w-7 h-7 flex items-center justify-center rounded-md text-[#4A4A52] hover:text-[#E0E0E2] hover:bg-[rgba(255,255,255,0.06)] transition-all"
            title={t.toggleSidebar}
          >
            <Menu size={16} />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#4A4A52] hidden sm:block mr-1">
              {allItems.find(m => location.pathname.startsWith(m.path))?.name ?? ''}
            </span>

            {/* Help icon */}
            <button
              onClick={() => setHelpOpen(true)}
              title={t.howToUse}
              className="w-7 h-7 flex items-center justify-center rounded-md text-[#4A4A52] hover:text-[#E0E0E2] hover:bg-[rgba(255,255,255,0.06)] transition-all"
            >
              <HelpCircle size={15} />
            </button>

            {/* Settings icon */}
            <Link
              to="/settings"
              title={t.settings}
              className={`w-7 h-7 flex items-center justify-center rounded-md transition-all
                ${location.pathname.startsWith('/settings')
                  ? 'text-[#5E6AD2] bg-[#5E6AD2]/10'
                  : 'text-[#4A4A52] hover:text-[#E0E0E2] hover:bg-[rgba(255,255,255,0.06)]'
                }`}
            >
              <Settings size={15} />
            </Link>

            {/* User avatar + dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-7 h-7 rounded-full bg-[#5E6AD2] flex items-center justify-center text-white text-[10px] font-bold hover:bg-[#6B7AE8] transition-all overflow-hidden"
                title={user?.name || 'User'}
              >
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt={user?.name || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (user?.name || 'U')[0].toUpperCase()
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-9 w-48 rounded-lg shadow-xl z-50 user-dropdown">
                  <div className="px-3 py-2.5 user-dropdown-header">
                    <p className="text-xs font-semibold text-[#E0E0E2] truncate">{user?.name || 'User'}</p>
                    <p className="text-[11px] text-[#8A8A8F] truncate">{user?.email || ''}</p>
                    {user?.role && (
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        user.role === 'ADMIN'
                          ? 'bg-[#5E6AD2]/15 text-[#5E6AD2]'
                          : 'bg-[#2D2D2F] text-[#8A8A8F]'
                      }`}>
                        {user.role}
                      </span>
                    )}
                  </div>
                  <div className="p-1">
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-[#A0A0A4] hover:text-[#E0E0E2] hover:bg-[rgba(255,255,255,0.06)] transition-all"
                    >
                      <User size={13} />
                      <span>{t.profileSettings}</span>
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout() }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-[#8A8A8F] hover:text-[#F87171] hover:bg-[rgba(248,113,113,0.06)] transition-all"
                    >
                      <LogOut size={13} />
                      <span>{t.signOut}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="app-main flex-1 overflow-auto overflow-x-hidden p-3 sm:p-4 md:p-6">
          <div className="app-page mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>

      {/* Help Modal */}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}

      {/* Global Loading Overlay */}
      <GlobalLoading />
    </div>
  )
}
