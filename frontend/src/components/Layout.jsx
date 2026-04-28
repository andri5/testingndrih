import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
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
  Globe,
} from 'lucide-react'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

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

  const handleMenuToggle = () => {
    if (window.innerWidth < 1024) {
      setMobileSidebarOpen(v => !v)
    } else {
      setSidebarOpen(v => !v)
    }
  }

  const mainItems = [
    { name: 'Dashboard',    path: '/dashboard',  icon: <LayoutDashboard size={16} /> },
    { name: 'Scenarios',    path: '/scenarios',  icon: <ClipboardList size={16} /> },
    { name: 'Chains',       path: '/chains',     icon: <Link2 size={16} /> },
    { name: 'Execution',    path: '/execution',  icon: <PlayCircle size={16} /> },
    { name: 'Reports',      path: '/reports',    icon: <BarChart2 size={16} /> },
  ]

  const workspaceItems = [
    { name: 'Scheduler',    path: '/scheduler',       icon: <Clock size={16} /> },
    { name: 'Parallel',     path: '/parallel',        icon: <Zap size={16} /> },
    { name: 'Browser Test', path: '/browser-matrix',  icon: <Globe size={16} /> },
  ]

  const allItems = [...mainItems, ...workspaceItems]

  const NavItem = ({ item, showLabel }) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
    return (
      <Link
        to={item.path}
        title={!showLabel ? item.name : undefined}
        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-all duration-100
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
                <p className="font-semibold text-[#E0E0E2] text-sm leading-tight truncate">Ini Test Sambil Ngopi Coy</p>
                <p className="text-[10px] text-[#8A8A8F] leading-tight">Workspace</p>
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
              <p className="px-2.5 text-[10px] font-semibold text-[#4A4A52] uppercase tracking-widest mb-1.5">Main</p>
            )}
            {mainItems.map(item => <NavItem key={item.path} item={item} showLabel={showLabels} />)}
          </div>

          <div className="space-y-0.5">
            {showLabels && (
              <p className="px-2.5 text-[10px] font-semibold text-[#4A4A52] uppercase tracking-widest mb-1.5">Tools</p>
            )}
            {workspaceItems.map(item => <NavItem key={item.path} item={item} showLabel={showLabels} />)}
          </div>
        </nav>

        {/* Sign out */}
        <div className="shrink-0 px-2 py-3 sidebar-bottom-divider">
          <button
            onClick={handleLogout}
            title="Sign out"
            className="nav-logout w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[#8A8A8F] hover:text-[#F87171] hover:bg-[rgba(248,113,113,0.06)] transition-all duration-100 text-sm"
          >
            <LogOut size={15} className="shrink-0" />
            {showLabels && <span className="font-medium">Sign out</span>}
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
            title="Toggle sidebar"
          >
            <Menu size={16} />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#4A4A52] hidden sm:block mr-1">
              {allItems.find(m => location.pathname.startsWith(m.path))?.name ?? ''}
            </span>

            {/* Settings icon */}
            <Link
              to="/settings"
              title="Settings"
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
                className="w-7 h-7 rounded-full bg-[#5E6AD2] flex items-center justify-center text-white text-[10px] font-bold hover:bg-[#6B7AE8] transition-all"
                title={user?.name || 'User'}
              >
                {(user?.name || 'U')[0].toUpperCase()}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-9 w-48 rounded-lg shadow-xl z-50 user-dropdown">
                  <div className="px-3 py-2.5 user-dropdown-header">
                    <p className="text-xs font-semibold text-[#E0E0E2] truncate">{user?.name || 'User'}</p>
                    <p className="text-[11px] text-[#8A8A8F] truncate">{user?.email || ''}</p>
                  </div>
                  <div className="p-1">
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-[#A0A0A4] hover:text-[#E0E0E2] hover:bg-[rgba(255,255,255,0.06)] transition-all"
                    >
                      <User size={13} />
                      <span>Profile & Settings</span>
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout() }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-[#8A8A8F] hover:text-[#F87171] hover:bg-[rgba(248,113,113,0.06)] transition-all"
                    >
                      <LogOut size={13} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
