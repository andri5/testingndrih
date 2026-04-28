import { useState } from 'react'
import { Button, Spinner } from './ui'
import { scenarioAPI } from '../services/api'

const TEMPLATES = [
  {
    id: 'login-test',
    name: 'Login Test',
    description: 'Test login form dengan username & password, verifikasi redirect setelah login.',
    icon: '🔐',
    tag: 'Authentication',
    tagColor: 'bg-blue-500/10 text-blue-400',
    url: 'https://the-internet.herokuapp.com/login',
    steps: [
      { stepNumber: 1, type: 'NAVIGATE', description: 'Open login page', selector: '', value: 'https://the-internet.herokuapp.com/login' },
      { stepNumber: 2, type: 'FILL', description: 'Enter username', selector: '#username', value: 'tomsmith' },
      { stepNumber: 3, type: 'FILL', description: 'Enter password', selector: '#password', value: 'SuperSecretPassword!' },
      { stepNumber: 4, type: 'CLICK', description: 'Click Login button', selector: 'button[type="submit"]', value: '' },
      { stepNumber: 5, type: 'WAIT', description: 'Wait for redirect', selector: '', value: '1500' },
      { stepNumber: 6, type: 'ASSERTION', description: 'Verify login success', selector: '', value: 'Secure Area' },
      { stepNumber: 7, type: 'SCREENSHOT', description: 'Capture result', selector: '', value: '' },
    ]
  },
  {
    id: 'ecommerce-flow',
    name: 'E-Commerce Shopping',
    description: 'Login ke SauceDemo, tambah produk ke cart, verifikasi badge cart.',
    icon: '🛒',
    tag: 'E-Commerce',
    tagColor: 'bg-green-500/10 text-green-400',
    url: 'https://www.saucedemo.com',
    steps: [
      { stepNumber: 1, type: 'NAVIGATE', description: 'Open SauceDemo', selector: '', value: 'https://www.saucedemo.com' },
      { stepNumber: 2, type: 'FILL', description: 'Enter username', selector: '#user-name', value: 'standard_user' },
      { stepNumber: 3, type: 'FILL', description: 'Enter password', selector: '#password', value: 'secret_sauce' },
      { stepNumber: 4, type: 'CLICK', description: 'Click Login', selector: '#login-button', value: '' },
      { stepNumber: 5, type: 'WAIT', description: 'Wait for inventory', selector: '', value: '1500' },
      { stepNumber: 6, type: 'ASSERTION', description: 'Verify inventory page', selector: '', value: 'Products' },
      { stepNumber: 7, type: 'CLICK', description: 'Add Backpack to cart', selector: '#add-to-cart-sauce-labs-backpack', value: '' },
      { stepNumber: 8, type: 'ASSERTION', description: 'Verify cart badge = 1', selector: '.shopping_cart_badge', value: '1' },
      { stepNumber: 9, type: 'CLICK', description: 'Add Bike Light to cart', selector: '#add-to-cart-sauce-labs-bike-light', value: '' },
      { stepNumber: 10, type: 'ASSERTION', description: 'Verify cart badge = 2', selector: '.shopping_cart_badge', value: '2' },
      { stepNumber: 11, type: 'CLICK', description: 'Open cart', selector: '.shopping_cart_link', value: '' },
      { stepNumber: 12, type: 'WAIT', description: 'Wait for cart page', selector: '', value: '1000' },
      { stepNumber: 13, type: 'ASSERTION', description: 'Verify cart page', selector: '', value: 'Your Cart' },
      { stepNumber: 14, type: 'SCREENSHOT', description: 'Capture cart contents', selector: '', value: '' },
    ]
  },
  {
    id: 'basic-navigation',
    name: 'Basic Navigation',
    description: 'Navigasi ke website, lakukan pencarian, ambil screenshot hasilnya.',
    icon: '🧭',
    tag: 'Navigation',
    tagColor: 'bg-purple-500/10 text-purple-400',
    url: 'https://www.wikipedia.org',
    steps: [
      { stepNumber: 1, type: 'NAVIGATE', description: 'Open Wikipedia', selector: '', value: 'https://www.wikipedia.org' },
      { stepNumber: 2, type: 'ASSERTION', description: 'Verify page loaded', selector: '', value: 'Wikipedia' },
      { stepNumber: 3, type: 'FILL', description: 'Type search query', selector: '#searchInput', value: 'Playwright testing' },
      { stepNumber: 4, type: 'CLICK', description: 'Click search button', selector: 'button[type="submit"]', value: '' },
      { stepNumber: 5, type: 'WAIT', description: 'Wait for results', selector: '', value: '2000' },
      { stepNumber: 6, type: 'SCREENSHOT', description: 'Capture search results', selector: '', value: '' },
    ]
  },
  {
    id: 'form-test',
    name: 'Form Input Test',
    description: 'Isi form dengan text, email, dan radio input lalu screenshot hasilnya.',
    icon: '📝',
    tag: 'Form',
    tagColor: 'bg-yellow-500/10 text-yellow-400',
    url: 'https://demoqa.com/automation-practice-form',
    steps: [
      { stepNumber: 1, type: 'NAVIGATE', description: 'Open practice form', selector: '', value: 'https://demoqa.com/automation-practice-form' },
      { stepNumber: 2, type: 'FILL', description: 'Enter first name', selector: '#firstName', value: 'John' },
      { stepNumber: 3, type: 'FILL', description: 'Enter last name', selector: '#lastName', value: 'Doe' },
      { stepNumber: 4, type: 'FILL', description: 'Enter email', selector: '#userEmail', value: 'john.doe@test.com' },
      { stepNumber: 5, type: 'CLICK', description: 'Select Male gender', selector: 'label[for="gender-radio-1"]', value: '' },
      { stepNumber: 6, type: 'FILL', description: 'Enter mobile number', selector: '#userNumber', value: '1234567890' },
      { stepNumber: 7, type: 'SCREENSHOT', description: 'Capture filled form', selector: '', value: '' },
    ]
  },
]

export function TemplatePickerModal({ onClose, onCreated }) {
  const [loading, setLoading] = useState(null) // template id being created
  const [error, setError] = useState(null)

  const handleUseTemplate = async (template) => {
    setLoading(template.id)
    setError(null)
    try {
      // 1. Create scenario
      const scenarioRes = await scenarioAPI.create(
        template.name,
        template.description,
        template.url
      )
      const scenario = scenarioRes.data.scenario || scenarioRes.data

      // 2. Create all steps
      for (const step of template.steps) {
        await scenarioAPI.createStep(
          scenario.id,
          null,
          step.type,
          step.description,
          step.selector,
          step.value,
          null
        )
      }

      onCreated(scenario)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat scenario dari template')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl bg-[#0F0E11] border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.06)]">
          <div>
            <h2 className="text-xl font-bold text-[#E0E0E2]">Template Library</h2>
            <p className="text-sm text-[#8A8A8F] mt-1">Pilih template siap pakai — scenario + steps langsung terbuat</p>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-[#E0E0E2] text-2xl transition-colors">✕</button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="bg-[#141316] border border-[rgba(255,255,255,0.07)] rounded-xl p-5 flex flex-col gap-3 hover:border-[rgba(94,106,210,0.4)] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <h3 className="font-semibold text-[#E0E0E2] text-sm">{template.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${template.tagColor}`}>{template.tag}</span>
                  </div>
                </div>
                <span className="text-xs text-[#555] shrink-0">{template.steps.length} steps</span>
              </div>

              <p className="text-xs text-[#8A8A8F] leading-relaxed">{template.description}</p>

              <div className="text-xs text-[#555] truncate">🌐 {template.url}</div>

              {/* Step preview */}
              <div className="space-y-1">
                {template.steps.slice(0, 3).map((step) => (
                  <div key={step.stepNumber} className="flex items-center gap-2 text-xs text-[#666]">
                    <span className="w-4 h-4 rounded bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[10px] shrink-0">{step.stepNumber}</span>
                    <span className="text-[#5E6AD2] font-medium shrink-0">{step.type}</span>
                    <span className="truncate">{step.description}</span>
                  </div>
                ))}
                {template.steps.length > 3 && (
                  <div className="text-xs text-[#444] pl-6">+{template.steps.length - 3} more steps...</div>
                )}
              </div>

              <Button
                variant="primary"
                size="sm"
                className="w-full mt-1"
                onClick={() => handleUseTemplate(template)}
                disabled={loading !== null}
              >
                {loading === template.id ? (
                  <><Spinner size="sm" /> Creating...</>
                ) : (
                  'Use Template →'
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
