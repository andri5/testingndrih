import { useState } from 'react'
import { Button, Input, Alert } from './ui'

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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
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
    if (!formData.url.trim()) {
      newErrors.url = 'URL is required'
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = 'Please enter a valid URL'
    }
    return newErrors
  }

  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate()
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setShowAlert(true)
      return
    }

    try {
      await onSubmit(formData)
      // Reset form on success
      if (!initialScenario) {
        setFormData({ name: '', description: '', url: '' })
      }
    } catch (error) {
      setShowAlert(true)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      />

      <Input
        label="URL to Test"
        name="url"
        type="url"
        placeholder="https://example.com"
        value={formData.url}
        onChange={handleChange}
        error={errors.url}
        disabled={isLoading}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          name="description"
          placeholder="Describe what this scenario tests"
          value={formData.description}
          onChange={handleChange}
          disabled={isLoading}
          rows="3"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
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
