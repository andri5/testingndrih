import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const clearError = useAuthStore((state) => state.clearError)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    clearError()

    if (!email || !password) {
      setLocalError('Email and password are required')
      return
    }

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setLocalError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="flex flex-col gap-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">testingndrih</h1>
          <p className="text-gray-600">Automated Web Testing Platform</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Login</h2>

          {/* Error Messages */}
          {(localError || error) && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">
                {localError || error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            to="/register"
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 px-4 rounded-lg transition duration-200 text-center block"
          >
            Create Account
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm">
          Test automation made simple • v1.0.0
        </p>
      </div>
    </div>
  )
}
