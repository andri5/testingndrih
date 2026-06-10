import React from 'react'
import { Download, FileText, FileSpreadsheet } from 'lucide-react'
import { exportToHTML, exportToJSON } from '../utils/exportUtils'
import { useSettingsStore } from '../store/settingsStore'

const i18n = {
  en: {
    export: 'Export',
    exportPDF: 'Export as PDF/HTML',
    exportExcel: 'Export as Excel',
    exportJSON: 'Export as JSON',
    exporting: 'Exporting...',
  },
  id: {
    export: 'Ekspor',
    exportPDF: 'Ekspor sebagai PDF/HTML',
    exportExcel: 'Ekspor sebagai Excel',
    exportJSON: 'Ekspor sebagai JSON',
    exporting: 'Mengekspor...',
  },
}

export default function ExportButtons({ 
  title, 
  summary, 
  details, 
  filename,
  analysis,
  onExportStart,
  onExportComplete 
}) {
  const { language } = useSettingsStore()
  const t = i18n[language] || i18n.en
  const [exporting, setExporting] = React.useState(false)

  const handleExportHTML = async () => {
    try {
      setExporting(true)
      onExportStart?.()
      
      await new Promise(resolve => setTimeout(resolve, 300))
      
      exportToHTML(title, summary, details, filename, 'id', analysis)
      
      onExportComplete?.()
    } catch (err) {
      console.error('Export error:', err)
      alert('Export failed: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const handleExportJSON = async () => {
    try {
      setExporting(true)
      onExportStart?.()
      
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const exportData = {
        title,
        timestamp: new Date().toISOString(),
        summary,
        details,
      }
      exportToJSON(exportData, filename)
      
      onExportComplete?.()
    } catch (err) {
      console.error('Export error:', err)
      alert('Export failed: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      setExporting(true)
      onExportStart?.()
      
      await new Promise(resolve => setTimeout(resolve, 300))
      
      if (!details || details.length === 0) {
        alert('No data to export')
        setExporting(false)
        return
      }

      // Build CSV
      const headers = Object.keys(details[0])
      const csvHeaders = headers.map(h => `"${h}"`).join(',')
      const csvRows = details.map(row => {
        return headers.map(header => {
          const value = row[header]
          if (value === undefined || value === null) return '""'
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(',')
      })

      const csv = [csvHeaders, ...csvRows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${filename}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      onExportComplete?.()
    } catch (err) {
      console.error('Export error:', err)
      alert('Export failed: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 text-sm font-medium text-gray-600 dark:text-gray-400">
        <Download className="w-4 h-4" />
        <span>{t.export}:</span>
      </div>
      
      <button
        onClick={handleExportHTML}
        disabled={exporting || !summary || !details}
        title={t.exportPDF}
        className="px-3 py-1.5 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
      >
        <FileText className="w-3.5 h-3.5" />
        {exporting ? t.exporting : 'PDF/HTML'}
      </button>

      <button
        onClick={handleExportCSV}
        disabled={exporting || !details || details.length === 0}
        title={t.exportExcel}
        className="px-3 py-1.5 text-xs font-medium rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        {exporting ? t.exporting : 'Excel'}
      </button>

      <button
        onClick={handleExportJSON}
        disabled={exporting || !summary}
        title={t.exportJSON}
        className="px-3 py-1.5 text-xs font-medium rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
      >
        <Download className="w-3.5 h-3.5" />
        {exporting ? t.exporting : 'JSON'}
      </button>
    </div>
  )
}
