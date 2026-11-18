import { useState } from 'react'
import { Button, Input, Alert } from './ui'

function normalizeUrlInput(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function isValidUrl(string) {
  try {
    const parsed = new URL(string)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function ScenarioForm({ onSubmit, initialScenario = null, isLoading = false }) {
  const [formData, setFormData] = useState({
    name: initialScenario?.name || '',
    description: initialScenario?.description || '',
    url: initialScenario?.url || ''
  })
  const [errors, setErrors] = useState({})
  const [showAlert, setShowAlert] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Scenario name is required'
    }
    const url = formData.url.trim()
    if (url) {
      const normalized = normalizeUrlInput(url)
      if (!isValidUrl(normalized)) {
        newErrors.url = 'Please enter a valid URL (e.g. https://example.com)'
      }
    }
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setShowAlert(true)
      return
    }

    const payload = {
      ...formData,
      name: formData.name.trim(),
      url: normalizeUrlInput(formData.url),
    }

    try {
      await onSubmit(payload)
      if (!initialScenario) {
        setFormData({ name: '', description: '', url: '' })
      }
      setErrors({})
      setShowAlert(false)
    } catch {
      setShowAlert(true)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {showAlert && Object.keys(errors).length > 0 && (
        <Alert
          type="error"
          message="Please fix the errors below"
          onClose={() => setShowAlert(false)}
        />
      )}

      <Input
        label="Scenario Name"
        name="name"
        placeholder="Enter scenario name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
        disabled={isLoading}
        required
      />

      <Input
        label="URL to Test (optional)"
        name="url"
        type="text"
        inputMode="url"
        autoComplete="url"
        placeholder="https://example.com — can set later via Record"
        value={formData.url}
        onChange={handleChange}
        error={errors.url}
        disabled={isLoading}
      />

      <div>
        <label className="block text-sm font-medium text-[#A0A0A4] mb-1">
          Description (Optional)
        </label>
        <textarea
          name="description"
          placeholder="Describe what this scenario tests"
          value={formData.description}
          onChange={handleChange}
          disabled={isLoading}
          rows="3"
          className="w-full px-4 py-2 bg-[#161618] border border-[rgba(255,255,255,0.1)] text-[#E0E0E2] placeholder-[#4A4A52] rounded-lg focus:ring-1 focus:ring-[#0F766E] focus:border-[#0F766E] outline-none transition"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : initialScenario ? 'Update Scenario' : 'Create Scenario'}
      </Button>
    </form>
  )
}
