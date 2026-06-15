import React from 'react'
import { exportToHTML, exportToJSON } from '../utils/exportUtils'
import ExportFormatButton from './ExportFormatButton'

const i18n = {
  exportHTML: 'Export HTML',
  exportCSV: 'Export CSV',
  exportJSON: 'Export JSON',
  exporting: 'Exporting...',
}

export default function ExportButtons({
  title,
  summary,
  details,
  filename,
  analysis,
  onExportStart,
  onExportComplete,
}) {
  const t = i18n
  const [exporting, setExporting] = React.useState(false)

  const handleExportHTML = async () => {
    try {
      setExporting(true)
      onExportStart?.()
      await new Promise((resolve) => setTimeout(resolve, 300))
      exportToHTML(title, summary, details, filename, 'en', analysis)
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
      await new Promise((resolve) => setTimeout(resolve, 300))
      exportToJSON(
        { title, timestamp: new Date().toISOString(), summary, details },
        filename
      )
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
      await new Promise((resolve) => setTimeout(resolve, 300))

      if (!details || details.length === 0) {
        alert('No data to export')
        setExporting(false)
        return
      }

      const headers = Object.keys(details[0])
      const csvHeaders = headers.map((h) => `"${h}"`).join(',')
      const csvRows = details.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            if (value === undefined || value === null) return '""'
            return `"${String(value).replace(/"/g, '""')}"`
          })
          .join(',')
      )

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
      <ExportFormatButton
        format="html"
        onClick={handleExportHTML}
        disabled={exporting || !summary || !details}
        title={t.exportHTML}
      >
        {exporting ? t.exporting : t.exportHTML}
      </ExportFormatButton>

      <ExportFormatButton
        format="csv"
        onClick={handleExportCSV}
        disabled={exporting || !details || details.length === 0}
        title={t.exportCSV}
      >
        {exporting ? t.exporting : t.exportCSV}
      </ExportFormatButton>

      <ExportFormatButton
        format="json"
        onClick={handleExportJSON}
        disabled={exporting || !summary}
        title={t.exportJSON}
      >
        {exporting ? t.exporting : t.exportJSON}
      </ExportFormatButton>
    </div>
  )
}
