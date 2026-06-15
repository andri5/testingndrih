import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image, Save, LogOut } from 'lucide-react'
import Layout from '../components/Layout'
import { Alert } from '../components/ui'
import ExportFormatButton from '../components/ExportFormatButton'
import IntegrationsSettings from '../components/IntegrationsSettings'
import UserManagement from '../components/UserManagement'
import UserActivityLog from '../components/UserActivityLog'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'

const inputCls = 'w-full px-3 py-2 bg-[#0F0E11] border border-[#2D2D2F] rounded-lg text-[#E0E0E2] text-sm placeholder-[#666] focus:outline-none focus:border-[#5E6AD2] transition'
const labelCls = 'block text-sm font-medium text-[#A0A0A4] mb-1.5'
const sectionTitleCls = 'text-sm font-semibold text-[#E0E0E2] uppercase tracking-wider mb-4'
const cardCls = 'bg-[#1A1A1C] border border-[#2D2D2F] rounded-xl p-6'

const i18n = {
  en: {
    settings: 'Settings',
    subtitle: 'Manage your account and application settings',
    profile: 'Profile',
    application: 'Application',
    about: 'About',
    integrations: 'Integrations',
    userProfile: 'USER PROFILE',
    profilePicture: 'Profile Picture',
    changePhoto: 'Change Photo',
    uploadPhoto: 'Upload Photo',
    name: 'Name',
    email: 'Email',
    saveProfile: 'Save Profile',
    accountActions: 'ACCOUNT ACTIONS',
    signOut: 'Sign out',
    executionSettings: 'EXECUTION SETTINGS',
    executionTimeout: 'Execution Timeout (seconds)',
    timeoutHint: 'Max timeout per step in seconds (5–300)',
    captureScreenshot: 'Capture screenshot after each step',
    captureDesc: 'Automatically saves screenshots during execution',
    saveSettings: 'Save Settings',
    profileSaved: 'Profile updated successfully',
    settingsSaved: 'Settings saved successfully',
    photoSizeError: 'Image size must be less than 5MB',
    users: 'Users',
    userManagement: 'USER MANAGEMENT',
    userManagementDesc: 'View, add, edit, and delete registered users',
    userActivity: 'User Activity',
    userActivityDesc: 'Monitor what USER accounts are doing and their latest actions',
  },
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const { executionTimeout, autoScreenshot, setExecutionTimeout, setAutoScreenshot } = useSettingsStore()

  const [activeTab, setActiveTab] = useState('profile')
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [name, setName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')
  const [profilePicture, setProfilePicture] = useState(JSON.parse(localStorage.getItem('profilePicture') || 'null'))
  const fileInputRef = useRef(null)

  const t = i18n.en

  const isAdmin = user?.role === 'ADMIN'

  const tabs = [
    { id: 'profile', label: t.profile },
    { id: 'app', label: t.application },
    ...(isAdmin ? [
      { id: 'integrations', label: t.integrations },
      { id: 'users', label: t.users },
      { id: 'activity', label: t.userActivity },
    ] : []),
    { id: 'about', label: t.about },
  ]

  useEffect(() => {
    if (!isAdmin && ['integrations', 'users', 'activity'].includes(activeTab)) {
      setActiveTab('profile')
    }
  }, [isAdmin, activeTab])

  const handleProfilePictureChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t.photoSizeError)
      setTimeout(() => setError(null), 3000)
      return
    }

    // Read file as base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result
      setProfilePicture(base64String)
      localStorage.setItem('profilePicture', JSON.stringify(base64String))
      // Emit custom event to notify other components (like Layout) about profile picture change
      window.dispatchEvent(new CustomEvent('profilePictureUpdated', { detail: base64String }))
      setSuccess(t.profileSaved)
      setTimeout(() => setSuccess(null), 3000)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = () => {
    const updatedUser = { ...user, name }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setSuccess(t.profileSaved)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-xl font-semibold text-[#E0E0E2]">{t.settings}</h1>
          <p className="text-sm text-[#666] mt-0.5">{t.subtitle}</p>
        </div>

        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-44 md:shrink-0">
            <div className="flex md:flex-col gap-1 flex-wrap">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                    activeTab === tab.id
                      ? 'bg-[#5E6AD2]/15 text-[#5E6AD2] font-medium'
                      : 'text-[#A0A0A4] hover:text-[#E0E0E2] hover:bg-[#1A1A1C]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-4">

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <>
                <div className={cardCls}>
                  <p className={sectionTitleCls}>{t.userProfile}</p>
                  <div className="space-y-6 max-w-md">
                    {/* Profile Picture Section */}
                    <div>
                      <label className={labelCls}>{t.profilePicture}</label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-lg flex items-center justify-center border-2 border-dashed border-[#2D2D2F] bg-[#0F0E11] overflow-hidden">
                          {profilePicture ? (
                            <img 
                              src={profilePicture} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-3xl font-bold text-[#4A4A52]">
                              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <ExportFormatButton
                            format="primary"
                            icon={Image}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full justify-center"
                          >
                            {profilePicture ? t.changePhoto : t.uploadPhoto}
                          </ExportFormatButton>
                          <input
                            ref={fileInputRef}
                            id="profile-picture-input"
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                            className="hidden"
                          />
                          <p className="text-xs mt-2 text-[#555]">JPG, PNG or GIF (Max 5MB)</p>
                        </div>
                      </div>
                    </div>

                    {/* Name Field */}
                    <div>
                      <label className={labelCls}>{t.name}</label>
                      <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.name} />
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className={labelCls}>{t.email}</label>
                      <input className={inputCls + ' opacity-50 cursor-not-allowed'} value={email} disabled />
                    </div>

                    <div>
                      <label className={labelCls}>Role</label>
                      <span
                        className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold border ${
                          user?.role === 'ADMIN'
                            ? 'bg-[#5E6AD2]/15 text-[#5E6AD2] border-[#5E6AD2]/25'
                            : 'bg-[#2D2D2F] text-[#A0A0A4] border-[#3D3D3F]'
                        }`}
                      >
                        {user?.role || 'USER'}
                      </span>
                    </div>

                    {/* Save Button */}
                    <ExportFormatButton format="primary" icon={Save} onClick={handleSaveProfile}>
                      {t.saveProfile}
                    </ExportFormatButton>
                  </div>
                </div>

                <div className={cardCls}>
                  <p className={sectionTitleCls}>{t.accountActions}</p>
                  <ExportFormatButton format="pdf" icon={LogOut} onClick={handleLogout}>
                    {t.signOut}
                  </ExportFormatButton>
                </div>
              </>
            )}

            {/* Application Tab */}
            {activeTab === 'app' && (
              <>
                <div className={cardCls}>
                  <p className={sectionTitleCls}>{t.executionSettings}</p>
                  <div className="space-y-5 max-w-md">
                    <div>
                      <label className={labelCls}>{t.executionTimeout}</label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={executionTimeout}
                        onChange={(e) => setExecutionTimeout(e.target.value)}
                        className={inputCls}
                      />
                      <p className="text-xs text-[#555] mt-1.5">{t.timeoutHint}</p>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-sm font-medium text-[#E0E0E2]">{t.captureScreenshot}</p>
                        <p className="text-xs text-[#666] mt-0.5">{t.captureDesc}</p>
                      </div>
                      <button
                        onClick={() => setAutoScreenshot(!autoScreenshot)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                          autoScreenshot ? 'bg-[#5E6AD2]' : 'bg-[#2D2D2F]'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                          autoScreenshot ? 'translate-x-4' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    <p className="text-xs text-[#555] flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 bg-[#5E6AD2] rounded-full"></span>
                      Auto-saved
                    </p>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'integrations' && isAdmin && (
              <IntegrationsSettings />
            )}

            {activeTab === 'users' && isAdmin && (
              <div className={cardCls}>
                <p className={sectionTitleCls}>{t.userManagement}</p>
                <p className="text-sm text-[#666] mb-4">{t.userManagementDesc}</p>
                <UserManagement />
              </div>
            )}

            {activeTab === 'activity' && isAdmin && (
              <div className={cardCls}>
                <p className={sectionTitleCls}>{t.userActivity}</p>
                <p className="text-sm text-[#666] mb-4">{t.userActivityDesc}</p>
                <UserActivityLog />
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className={cardCls}>
                <p className={sectionTitleCls}>About Test Sambil Ngopi</p>
                <div className="space-y-4">
                  <div className="bg-[#0F0E11] rounded-lg p-4 space-y-3">
                    {[
                      ['Application', 'Test Sambil Ngopi'],
                      ['Version', '1.0.0'],
                      ['Description', 'Automated Web Testing Platform'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center">
                        <span className="text-sm text-[#666]">{k}</span>
                        <span className="text-sm text-[#E0E0E2] font-medium">{v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#0F0E11] rounded-lg p-4 space-y-3">
                    <p className="text-xs font-semibold text-[#A0A0A4] uppercase tracking-wider">Supported Step Types</p>
                    <div className="flex flex-wrap gap-2">
                      {['NAVIGATE', 'CLICK', 'FILL', 'WAIT', 'ASSERTION', 'SCREENSHOT', 'API_CALL'].map(t => (
                        <span key={t} className="px-2 py-1 bg-[#5E6AD2]/15 text-[#5E6AD2] rounded text-xs font-mono border border-[#5E6AD2]/20">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </Layout>
  )
}
