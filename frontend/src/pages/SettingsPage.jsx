import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Alert } from '../components/ui'
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
    displaySettings: 'DISPLAY SETTINGS',
    language: 'Language',
    theme: 'Theme',
    saveSettings: 'Save Settings',
    profileSaved: 'Profile updated successfully',
    settingsSaved: 'Settings saved successfully',
    photoSizeError: 'Image size must be less than 5MB',
  },
  id: {
    settings: 'Pengaturan',
    subtitle: 'Kelola akun dan pengaturan aplikasi Anda',
    profile: 'Profil',
    application: 'Aplikasi',
    about: 'Tentang',
    userProfile: 'PROFIL PENGGUNA',
    profilePicture: 'Foto Profil',
    changePhoto: 'Ubah Foto',
    uploadPhoto: 'Unggah Foto',
    name: 'Nama',
    email: 'Email',
    saveProfile: 'Simpan Profil',
    accountActions: 'AKSI AKUN',
    signOut: 'Keluar',
    executionSettings: 'PENGATURAN EKSEKUSI',
    executionTimeout: 'Batas Waktu Eksekusi (detik)',
    timeoutHint: 'Batas maksimal per langkah dalam detik (5–300)',
    captureScreenshot: 'Ambil screenshot setelah setiap langkah',
    captureDesc: 'Otomatis menyimpan screenshot saat eksekusi',
    displaySettings: 'PENGATURAN TAMPILAN',
    language: 'Bahasa',
    theme: 'Tema',
    saveSettings: 'Simpan Pengaturan',
    profileSaved: 'Profil berhasil diperbarui',
    settingsSaved: 'Pengaturan berhasil disimpan',
    photoSizeError: 'Ukuran gambar harus kurang dari 5MB',
  },
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const { theme, language, executionTimeout, autoScreenshot, setTheme, setLanguage, setExecutionTimeout, setAutoScreenshot } = useSettingsStore()

  const [activeTab, setActiveTab] = useState('profile')
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [name, setName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')
  const [profilePicture, setProfilePicture] = useState(JSON.parse(localStorage.getItem('profilePicture') || 'null'))

  const t = i18n[language] || i18n.en

  const tabs = [
    { id: 'profile', label: t.profile },
    { id: 'app', label: t.application },
    { id: 'about', label: t.about },
  ]

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

  const handleSaveAppSettings = () => {
    setSuccess(t.settingsSaved)
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
                        <div className={`w-24 h-24 rounded-lg flex items-center justify-center border-2 border-dashed ${
                          theme === 'dark' 
                            ? 'border-[#2D2D2F] bg-[#0F0E11]' 
                            : 'border-[#E0E0E2] bg-white'
                        } overflow-hidden`}>
                          {profilePicture ? (
                            <img 
                              src={profilePicture} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className={`text-3xl font-bold ${
                              theme === 'dark' 
                                ? 'text-[#4A4A52]' 
                                : 'text-[#A0A0A4]'
                            }`}>
                              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <label htmlFor="profile-picture-input" className="cursor-pointer">
                            <div className={`px-4 py-2 rounded-lg text-sm font-medium text-center transition ${
                              theme === 'dark'
                                ? 'bg-[#5E6AD2] hover:bg-[#6872e5] text-white'
                                : 'bg-[#5E6AD2] hover:bg-[#6872e5] text-white'
                            }`}>
                              {profilePicture ? t.changePhoto : t.uploadPhoto}
                            </div>
                          </label>
                          <input
                            id="profile-picture-input"
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePictureChange}
                            className="hidden"
                          />
                          <p className={`text-xs mt-2 ${
                            theme === 'dark' 
                              ? 'text-[#555]' 
                              : 'text-[#999]'
                          }`}>JPG, PNG or GIF (Max 5MB)</p>
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

                    {/* Save Button */}
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-[#5E6AD2] hover:bg-[#6872e5] text-white text-sm font-medium rounded-lg transition"
                    >
                      {t.saveProfile}
                    </button>
                  </div>
                </div>

                <div className={cardCls}>
                  <p className={sectionTitleCls}>{t.accountActions}</p>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium rounded-lg border border-red-500/20 transition"
                  >
                    {t.signOut}
                  </button>
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
                  </div>
                </div>

                <div className={cardCls}>
                  <p className={sectionTitleCls}>{t.displaySettings}</p>
                  <div className="space-y-5 max-w-md">
                    <div>
                      <label className={labelCls}>{t.language}</label>
                      <div className="flex gap-2">
                        {[{ value: 'en', label: 'English' }, { value: 'id', label: 'Bahasa Indonesia' }].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setLanguage(opt.value)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition ${
                              language === opt.value
                                ? 'bg-[#5E6AD2]/15 border-[#5E6AD2] text-[#5E6AD2]'
                                : 'bg-[#0F0E11] border-[#2D2D2F] text-[#A0A0A4] hover:border-[#555] hover:text-[#E0E0E2]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>{t.theme}</label>
                      <div className="flex gap-2">
                        {[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }].map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setTheme(opt.value)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition ${
                              theme === opt.value
                                ? 'bg-[#5E6AD2]/15 border-[#5E6AD2] text-[#5E6AD2]'
                                : 'bg-[#0F0E11] border-[#2D2D2F] text-[#A0A0A4] hover:border-[#555] hover:text-[#E0E0E2]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSaveAppSettings}
                      className="px-4 py-2 bg-[#5E6AD2] hover:bg-[#6872e5] text-white text-sm font-medium rounded-lg transition"
                    >
                      {t.saveSettings}
                    </button>
                  </div>
                </div>
              </>
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
                    <p className="text-xs font-semibold text-[#A0A0A4] uppercase tracking-wider">Tech Stack</p>
                    {[
                      ['Frontend', 'React 18 + Vite + TailwindCSS'],
                      ['Backend', 'Node.js + Express.js'],
                      ['Database', 'PostgreSQL 16 + Prisma ORM'],
                      ['Test Runner', 'Playwright (Chromium)'],
                      ['State', 'Zustand'],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center">
                        <span className="text-sm text-[#666]">{k}</span>
                        <span className="text-sm text-[#E0E0E2]">{v}</span>
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
