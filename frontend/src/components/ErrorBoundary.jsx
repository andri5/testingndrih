import { Component } from 'react'
import { RefreshCw, AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  handleReset() {
    this.setState({ hasError: false, error: null })
    window.location.href = '/dashboard'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="auth-page-bg min-h-screen bg-[#0F0E11] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#161618] border border-[#2A2A2D] flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-semibold text-[#E0E0E2] mb-2">Something went wrong</h1>

          {/* Description */}
          <p className="text-sm text-[#8B8B8E] mb-4 leading-relaxed">
            An unexpected error occurred in the application.
          </p>

          {/* Error detail */}
          {this.state.error?.message && (
            <div className="mb-8 px-3 py-2 rounded-lg bg-[#161618] border border-[#2A2A2D] text-left">
              <p className="text-xs font-mono text-red-400 break-words">
                {this.state.error.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#2A2A2D] bg-[#161618] text-sm font-medium text-[#E0E0E2] hover:border-[#5E6AD2] transition-colors"
            >
              <RefreshCw size={15} />
              Try again
            </button>
            <button
              onClick={() => this.handleReset()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#5E6AD2] text-sm font-medium text-white hover:bg-[#4F5BBF] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

        </div>
      </div>
    )
  }
}
