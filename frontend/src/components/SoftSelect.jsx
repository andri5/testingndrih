import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function SoftSelect({
  value,
  onChange,
  options = [],
  disabled = false,
  className = '',
  placeholder = 'Select…',
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!open) return
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center justify-between gap-2 w-full min-w-[200px] px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-200 bg-white text-gray-900 shadow-sm hover:border-[#5E6AD2]/35 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/25 focus:border-[#5E6AD2]/40 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={`truncate ${!value ? 'text-gray-500 font-normal' : ''}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full min-w-[200px] rounded-lg border border-gray-200 bg-white shadow-lg py-1 overflow-hidden"
        >
          {options.map((opt) => {
            const isSelected = value === opt.value
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-[#5E6AD2]/10 text-[#5E6AD2]'
                      : 'text-gray-700 hover:bg-[#5E6AD2]/5 hover:text-[#5E6AD2]'
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
