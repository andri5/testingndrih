import { useState } from 'react'
import { Input } from './ui'
import SoftSelect from './SoftSelect'

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Scenarios' },
  { value: 'recent', label: 'Recently Created' },
  { value: 'active', label: 'Most Executed' },
]

export function ScenarioSearch({ onSearch, onFilterChange, isLoading = false }) {
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState('all')

  const handleSearch = (value) => {
    setSearchText(value)
    onSearch(value)
  }

  const handleFilterChange = (newFilter) => {
    setFilterType(newFilter)
    onFilterChange(newFilter)
  }

  const handleClearSearch = () => {
    setSearchText('')
    onSearch('')
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, description, or URL..."
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={isLoading}
          />
        </div>
        {searchText && (
          <button
            onClick={handleClearSearch}
            className="px-4 py-2 text-[#A0A0A4] hover:text-[#E0E0E2] transition"
            disabled={isLoading}
          >
            Clear
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <SoftSelect
          value={filterType}
          onChange={handleFilterChange}
          options={FILTER_OPTIONS}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}
