import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { Card, Button, Badge, Spinner, Alert } from '../components/ui'
import { environmentAPI } from '../services/api'
import { useSettingsStore } from '../store/settingsStore'
import toast from 'react-hot-toast'
import { Layers, Plus, Trash2, Key, Star } from 'lucide-react'

const inputCls = 'w-full px-3 py-2 bg-[#0F0E11] border border-[#2D2D2F] rounded-lg text-[#E0E0E2] text-sm focus:outline-none focus:border-[#5E6AD2]'

const i18n = {
  en: {
    title: 'Environments',
    subtitle: 'Manage profiles and variables for dev, staging, and production',
    hint: 'Use {{variableName}} in step URLs, selectors, and values — e.g. {{baseUrl}}/login',
    addEnv: 'Add Environment',
    name: 'Name',
    description: 'Description',
    baseUrl: 'Base URL',
    default: 'Default',
    setDefault: 'Set as default',
    variables: 'Variables',
    addVar: 'Add Variable',
    key: 'Key',
    value: 'Value',
    secret: 'Secret',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    noEnv: 'No environments yet',
    selectEnv: 'Select an environment to manage variables',
    preview: 'Preview (secrets masked)',
    created: 'Environment created',
    saved: 'Saved',
    deleted: 'Deleted',
  },
  id: {
    title: 'Environment',
    subtitle: 'Kelola profil dan variabel untuk dev, staging, dan production',
    hint: 'Gunakan {{namaVariabel}} di URL, selector, dan value — mis. {{baseUrl}}/login',
    addEnv: 'Tambah Environment',
    name: 'Nama',
    description: 'Deskripsi',
    baseUrl: 'Base URL',
    default: 'Default',
    setDefault: 'Jadikan default',
    variables: 'Variabel',
    addVar: 'Tambah Variabel',
    key: 'Key',
    value: 'Nilai',
    secret: 'Rahasia',
    save: 'Simpan',
    cancel: 'Batal',
    delete: 'Hapus',
    noEnv: 'Belum ada environment',
    selectEnv: 'Pilih environment untuk kelola variabel',
    preview: 'Pratinjau (rahasia disamarkan)',
    created: 'Environment dibuat',
    saved: 'Disimpan',
    deleted: 'Dihapus',
  },
}

const emptyEnv = { name: '', description: '', baseUrl: '', isDefault: false }
const emptyVar = { key: '', value: '', isSecret: false }

export default function EnvironmentsPage() {
  const { language, selectedEnvironmentId, setSelectedEnvironmentId } = useSettingsStore()
  const t = i18n[language] || i18n.en
  const [environments, setEnvironments] = useState([])
  const [selectedId, setSelectedId] = useState(selectedEnvironmentId || '')
  const [loading, setLoading] = useState(true)
  const [showEnvForm, setShowEnvForm] = useState(false)
  const [envForm, setEnvForm] = useState(emptyEnv)
  const [varForm, setVarForm] = useState(emptyVar)
  const [preview, setPreview] = useState(null)

  const selected = environments.find((e) => e.id === selectedId)

  const load = async () => {
    try {
      setLoading(true)
      const res = await environmentAPI.list()
      const list = res.data.environments || []
      setEnvironments(list)
      if (!selectedId && list.length) {
        const def = list.find((e) => e.isDefault) || list[0]
        setSelectedId(def.id)
        setSelectedEnvironmentId(def.id)
      }
    } catch {
      toast.error('Failed to load environments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!selectedId) return
    environmentAPI.getResolved(selectedId).then((res) => setPreview(res.data)).catch(() => setPreview(null))
  }, [selectedId, environments])

  const handleCreateEnv = async (e) => {
    e.preventDefault()
    try {
      await environmentAPI.create(envForm)
      setEnvForm(emptyEnv)
      setShowEnvForm(false)
      await load()
      toast.success(t.created)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const handleSetDefault = async (id) => {
    try {
      await environmentAPI.update(id, { isDefault: true })
      await load()
      toast.success(t.saved)
    } catch {
      toast.error('Failed')
    }
  }

  const handleDeleteEnv = async (id) => {
    if (!confirm('Delete this environment and all its variables?')) return
    try {
      await environmentAPI.delete(id)
      if (selectedId === id) setSelectedId('')
      await load()
      toast.success(t.deleted)
    } catch {
      toast.error('Failed')
    }
  }

  const handleSaveVar = async (e) => {
    e.preventDefault()
    if (!selectedId) return
    try {
      await environmentAPI.upsertVariable(selectedId, varForm)
      setVarForm(emptyVar)
      await load()
      toast.success(t.saved)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  const handleDeleteVar = async (variableId) => {
    if (!selectedId) return
    try {
      await environmentAPI.deleteVariable(selectedId, variableId)
      await load()
      toast.success(t.deleted)
    } catch {
      toast.error('Failed')
    }
  }

  const selectEnv = (id) => {
    setSelectedId(id)
    setSelectedEnvironmentId(id)
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20"><Spinner /></div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-[#E0E0E2] flex items-center gap-2">
            <Layers size={22} className="text-[#5E6AD2]" />
            {t.title}
          </h1>
          <p className="text-sm text-[#666] mt-0.5">{t.subtitle}</p>
          <div className="mt-3"><Alert type="info" message={t.hint} /></div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-[#E0E0E2]">{t.title}</p>
              <Button size="sm" onClick={() => setShowEnvForm(true)}><Plus size={14} /></Button>
            </div>
            {environments.length === 0 ? (
              <p className="text-sm text-[#8A8A8F]">{t.noEnv}</p>
            ) : (
              <ul className="space-y-2">
                {environments.map((env) => (
                  <li key={env.id}>
                    <button
                      type="button"
                      onClick={() => selectEnv(env.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg border transition ${
                        selectedId === env.id
                          ? 'border-[#5E6AD2] bg-[#5E6AD2]/10'
                          : 'border-[#2D2D2F] hover:border-[#444]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-[#E0E0E2]">{env.name}</span>
                        {env.isDefault && <Badge variant="primary">{t.default}</Badge>}
                      </div>
                      {env.baseUrl && (
                        <p className="text-xs text-[#8A8A8F] mt-1 truncate font-mono">{env.baseUrl}</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="lg:col-span-2 space-y-4">
            {showEnvForm && (
              <Card>
                <form onSubmit={handleCreateEnv} className="grid gap-3 md:grid-cols-2">
                  <input className={inputCls} placeholder={t.name} value={envForm.name} onChange={(e) => setEnvForm({ ...envForm, name: e.target.value })} required />
                  <input className={inputCls} placeholder={t.baseUrl} value={envForm.baseUrl} onChange={(e) => setEnvForm({ ...envForm, baseUrl: e.target.value })} />
                  <input className={`${inputCls} md:col-span-2`} placeholder={t.description} value={envForm.description} onChange={(e) => setEnvForm({ ...envForm, description: e.target.value })} />
                  <label className="flex items-center gap-2 text-sm text-[#A0A0A4] md:col-span-2">
                    <input type="checkbox" checked={envForm.isDefault} onChange={(e) => setEnvForm({ ...envForm, isDefault: e.target.checked })} />
                    {t.setDefault}
                  </label>
                  <div className="flex gap-2 md:col-span-2">
                    <Button type="submit">{t.save}</Button>
                    <Button type="button" variant="ghost" onClick={() => setShowEnvForm(false)}>{t.cancel}</Button>
                  </div>
                </form>
              </Card>
            )}

            {!selected ? (
              <Card><p className="text-sm text-[#8A8A8F]">{t.selectEnv}</p></Card>
            ) : (
              <>
                <Card className="flex flex-wrap justify-between gap-3 items-start">
                  <div>
                    <h2 className="text-lg font-semibold text-[#E0E0E2]">{selected.name}</h2>
                    {selected.description && <p className="text-sm text-[#8A8A8F] mt-1">{selected.description}</p>}
                    {selected.baseUrl && <p className="text-xs font-mono text-[#9BA3F0] mt-2">{selected.baseUrl}</p>}
                  </div>
                  <div className="flex gap-2">
                    {!selected.isDefault && (
                      <Button size="sm" variant="ghost" onClick={() => handleSetDefault(selected.id)}>
                        <Star size={14} /> {t.setDefault}
                      </Button>
                    )}
                    <Button size="sm" variant="danger" onClick={() => handleDeleteEnv(selected.id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </Card>

                <Card>
                  <p className="text-sm font-semibold text-[#E0E0E2] mb-4 flex items-center gap-2">
                    <Key size={16} /> {t.variables}
                  </p>
                  <form onSubmit={handleSaveVar} className="grid gap-3 md:grid-cols-4 mb-4">
                    <input className={inputCls} placeholder={t.key} value={varForm.key} onChange={(e) => setVarForm({ ...varForm, key: e.target.value })} required />
                    <input className={inputCls} placeholder={t.value} value={varForm.value} onChange={(e) => setVarForm({ ...varForm, value: e.target.value })} type={varForm.isSecret ? 'password' : 'text'} />
                    <label className="flex items-center gap-2 text-sm text-[#A0A0A4]">
                      <input type="checkbox" checked={varForm.isSecret} onChange={(e) => setVarForm({ ...varForm, isSecret: e.target.checked })} />
                      {t.secret}
                    </label>
                    <Button type="submit" size="sm"><Plus size={14} /> {t.addVar}</Button>
                  </form>
                  <ul className="space-y-2">
                    {(selected.variables || []).map((v) => (
                      <li key={v.id} className="flex justify-between items-center py-2 border-b border-[#2D2D2F]/50">
                        <div>
                          <span className="font-mono text-sm text-[#E0E0E2]">{v.key}</span>
                          {v.isSecret && <Badge variant="warning" className="ml-2">secret</Badge>}
                          <p className="text-xs text-[#8A8A8F] mt-0.5 font-mono">{v.value}</p>
                        </div>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteVar(v.id)}>
                          <Trash2 size={12} />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </Card>

                {preview?.variables && (
                  <Card>
                    <p className="text-xs font-semibold text-[#8A8A8F] uppercase mb-2">{t.preview}</p>
                    <pre className="text-xs font-mono text-[#9BA3F0] overflow-x-auto">
                      {JSON.stringify(preview.variables, null, 2)}
                    </pre>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
