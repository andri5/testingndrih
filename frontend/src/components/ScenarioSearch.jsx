import { useState } from 'react'
import { Input } from './ui'
import SoftSelect from './SoftSelect'
import ExportFormatButton from './ExportFormatButton'
import { Star } from 'lucide-react'
import { looksLikeSqlInjection } from '../utils/sqlInjectionGuard'

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Cases' },
  { value: 'recent', label: 'Recently Created' },
  { value: 'active', label: 'Most Executed' },
]

export function ScenarioSearch({
  onSearch,
  onFilterChange,
  isLoading = false,
  availableTags = [],
  favoritesOnly = false,
  filterTag = '',
  onFavoritesChange = null,
  onTagChange = null,
}) {
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState('all')

  const handleSearch = (value) => {
    setSearchText(value)
    // Block obvious SQLi payloads from hitting the search API
    if (looksLikeSqlInjection(value)) return
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

  const tagOptions = [
    { value: '', label: 'All tags' },
    ...availableTags.map((tag) => ({ value: tag, label: tag })),
  ]

  return (
    <div className="space-y-4">
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

      <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-3 items-stretch sm:items-center">
        <SoftSelect
          value={filterType}
          onChange={handleFilterChange}
          options={FILTER_OPTIONS}
          disabled={isLoading}
          className="w-full sm:w-auto"
        />

        {onFavoritesChange && (
          <ExportFormatButton
            format={favoritesOnly ? 'primary' : 'json'}
            icon={Star}
            onClick={() => onFavoritesChange(!favoritesOnly)}
            disabled={isLoading}
            className={`w-full sm:w-auto justify-center ${favoritesOnly ? '[&_svg]:fill-current' : ''}`}
          >
            Favorites
          </ExportFormatButton>
        )}

        {onTagChange && availableTags.length > 0 && (
          <SoftSelect
            value={filterTag}
            onChange={onTagChange}
            options={tagOptions}
            disabled={isLoading}
            placeholder="Filter by tag"
            className="w-full sm:w-auto"
          />
        )}
      </div>
    </div>
  )
}
