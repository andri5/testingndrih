import { useState } from 'react'
import { Input } from './ui'

export function ScenarioSearch({ onSearch, onFilterChange, isLoading = false }) {
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState('all')

  const handleSearch = (value) => {
    setSearchText(value)
    onSearch(value)
  }

  const handleFilterChange = (e) => {
    const newFilter = e.target.value
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
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
            disabled={isLoading}
          >
            Clear
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <select
          value={filterType}
          onChange={handleFilterChange}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white cursor-pointer"
        >
          <option value="all">All Scenarios</option>
          <option value="recent">Recently Created</option>
          <option value="active">Most Executed</option>
        </select>
      </div>
    </div>
  )
}
