import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image, LogOut } from 'lucide-react'
import Layout from '../components/Layout'
import { Alert } from '../components/ui'
import ExportFormatButton from '../components/ExportFormatButton'
import { useAuthStore } from '../store/authStore'
import { useSettingsStore } from '../store/settingsStore'
import {
  getProfilePicture,
  setProfilePicture as persistProfilePicture,
  compressProfilePicture,
} from '../utils/profilePictureStorage'
import { APP_VERSION } from '../constants/appVersion'

const inputCls =
  'w-full px-3 py-2 bg-[#0F0E11] border border-[#2D2D2F] rounded-lg text-[#E0E0E2] text-sm placeholder-[#666] focus:outline-none focus:border-[#0F766E] transition'
const labelCls = 'block text-sm font-medium text-[#A0A0A4] mb-1.5'
const sectionTitleCls = 'text-sm font-semibold text-[#E0E0E2] uppercase tracking-wider mb-4'
const cardCls = 'bg-[#1A1A1C] border border-[#2D2D2F] rounded-xl p-6'

export default function SettingsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const setUser = useAuthStore((state) => state.setUser)
  const { reminderTone, setReminderTone } = useSettingsStore()

  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [name, setName] = useState(user?.name || '')
  const [email] = useState(user?.email || '')
  const [profilePicture, setProfilePictureState] = useState(() => getProfilePicture(user?.id))
  const fileInputRef = useRef(null)
  const nameSaveTimer = useRef(null)

  useEffect(() => {
    setName(user?.name || '')
    setProfilePictureState(getProfilePicture(user?.id))
  }, [user?.id, user?.name])

  useEffect(() => {
    return () => {
      if (nameSaveTimer.current) clearTimeout(nameSaveTimer.current)
    }
  }, [])

  const persistName = (nextName) => {
    if (!user) return
    const trimmed = nextName.trim()
    if (!trimmed || trimmed === user.name) return
    setUser({ ...user, name: trimmed })
    setSuccess('Profil disimpan')
    setTimeout(() => setSuccess(null), 2500)
  }

  const handleNameChange = (e) => {
    const next = e.target.value
    setName(next)
    if (nameSaveTimer.current) clearTimeout(nameSaveTimer.current)
    nameSaveTimer.current = setTimeout(() => persistName(next), 600)
  }

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB')
      setTimeout(() => setError(null), 3000)
      return
    }

    try {
      const compressed = await compressProfilePicture(file)
      if (!user?.id) {
        setProfilePictureState(compressed)
        return
      }
      const result = persistProfilePicture(user.id, compressed)
      if (!result.ok) {
        setError(result.error || 'Could not save profile photo in this browser')
        setTimeout(() => setError(null), 5000)
        return
      }
      setProfilePictureState(compressed)
      window.dispatchEvent(
        new CustomEvent('profilePictureUpdated', {
          detail: { userId: user.id, picture: compressed },
        })
      )
      setSuccess('Foto profil disimpan')
      setTimeout(() => setSuccess(null), 3000)
    } catch {
      setError('Could not save profile photo in this browser')
      setTimeout(() => setError(null), 4000)
    } finally {
      e.target.value = ''
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-xl">
        <div>
          <h1 className="text-xl font-semibold text-[#E0E0E2]">Settings</h1>
          <p className="text-sm text-[#666] mt-0.5">Akun dan preferensi pribadi Anda.</p>
        </div>

        {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}
        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

        <div className={cardCls}>
          <p className={sectionTitleCls}>Profil</p>
          <div className="space-y-5">
            <div>
              <label className={labelCls}>Foto</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-20 h-20 rounded-lg flex items-center justify-center border-2 border-dashed border-[#2D2D2F] bg-[#0F0E11] overflow-hidden shrink-0">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-2xl font-bold text-[#4A4A52]">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <ExportFormatButton
                    format="primary"
                    icon={Image}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto justify-center"
                  >
                    {profilePicture ? 'Ganti foto' : 'Upload foto'}
                  </ExportFormatButton>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                  <p className="text-xs mt-2 text-[#555]">JPG, PNG atau GIF (maks. 5MB)</p>
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Nama</label>
              <input
                className={inputCls}
                value={name}
                onChange={handleNameChange}
                onBlur={() => persistName(name)}
                placeholder="Nama"
              />
              <p className="text-[11px] text-[#555] mt-1">Autosave saat selesai ketik.</p>
            </div>

            <div>
              <label className={labelCls}>Email</label>
              <input className={`${inputCls} opacity-50 cursor-not-allowed`} value={email} disabled />
            </div>

            <div>
              <label className={labelCls}>Role</label>
              <span
                className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold border ${
                  user?.role === 'ADMIN'
                    ? 'bg-[#0F766E]/15 text-[#0F766E] border-[#0F766E]/25'
                    : 'bg-[#2D2D2F] text-[#A0A0A4] border-[#3D3D3F]'
                }`}
              >
                {user?.role === 'USER' ? 'TESTER' : user?.role || 'USER'}
              </span>
            </div>
          </div>
        </div>

        <div className={cardCls}>
          <p className={sectionTitleCls}>Preferensi</p>
          <p className="text-sm font-medium text-[#E0E0E2]">Tone reminder dashboard</p>
          <p className="text-xs text-[#666] mt-0.5 mb-2">Santai atau formal.</p>
          <div className="inline-flex rounded-lg border border-[#2D2D2F] overflow-hidden">
            <button
              type="button"
              onClick={() => setReminderTone('casual')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                reminderTone !== 'formal'
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-[#0F0E11] text-[#A0A0A4] hover:text-[#E0E0E2]'
              }`}
            >
              Santai
            </button>
            <button
              type="button"
              onClick={() => setReminderTone('formal')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                reminderTone === 'formal'
                  ? 'bg-[#0F766E] text-white'
                  : 'bg-[#0F0E11] text-[#A0A0A4] hover:text-[#E0E0E2]'
              }`}
            >
              Formal
            </button>
          </div>
          <p className="text-xs text-[#555] mt-3 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-[#0F766E] rounded-full" />
            Auto-saved
          </p>
        </div>

        <div className={cardCls}>
          <p className={sectionTitleCls}>Akun</p>
          <ExportFormatButton format="pdf" icon={LogOut} onClick={handleLogout}>
            Sign out
          </ExportFormatButton>
        </div>

        <p className="text-xs text-[#555] px-1">
          Test Sambil Ngopi · v{APP_VERSION}
          {user?.role === 'ADMIN' ? (
            <>
              {' · '}
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="text-[#0F766E] hover:underline"
              >
                Buka Admin
              </button>
            </>
          ) : null}
        </p>
      </div>
    </Layout>
  )
}
