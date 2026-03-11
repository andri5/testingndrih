// Button Component
export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  onClick,
  className = '',
  ...props 
}) {
  const baseStyles = 'font-semibold rounded-lg transition duration-200 focus:outline-none'
  
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-900'
  }

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  }

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : ''

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}

// Input Component
export function Input({
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  disabled = false,
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}

// Card Component
export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  )
}

// Alert Component
export function Alert({ type = 'info', message, onClose }) {
  const bgColors = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200'
  }

  const textColors = {
    info: 'text-blue-700',
    success: 'text-green-700',
    warning: 'text-yellow-700',
    error: 'text-red-700'
  }

  return (
    <div className={`p-4 border rounded-lg ${bgColors[type]}`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${textColors[type]}`}>{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

// Badge Component
export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-gray-200 text-gray-900',
    primary: 'bg-indigo-200 text-indigo-900',
    success: 'bg-green-200 text-green-900',
    warning: 'bg-yellow-200 text-yellow-900',
    danger: 'bg-red-200 text-red-900'
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${variants[variant]}`}>
      {children}
    </span>
  )
}

// Loading Spinner
export function Spinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={`${sizes[size]} border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin`}></div>
  )
}
