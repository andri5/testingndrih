/**
 * Export utilities for PDF and Excel
 */

/**
 * Export data to CSV (Excel compatible)
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Output filename
 * @param {Array} headers - Column headers
 */
export const exportToCSV = (data, filename, headers) => {
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  // Build CSV header
  const csvHeaders = headers.map(h => `"${h}"`).join(',')

  // Build CSV rows
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header.toLowerCase().replace(/\s+/g, '')]
      if (value === undefined || value === null) return '""'
      return `"${String(value).replace(/"/g, '""')}"`
    }).join(',')
  })

  const csv = [csvHeaders, ...csvRows].join('\n')
  
  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export summary to simple HTML table then download as text file that can be opened as table
 * @param {string} title - Report title
 * @param {Object} summary - Summary data object
 * @param {Array} details - Array of detail rows
 * @param {string} filename - Output filename
 */
export const exportToHTML = (title, summary, details, filename, language = 'en') => {
  const lang = {
    en: {
      report: 'Test Report',
      date: 'Generated Date',
      summary: 'Summary',
      details: 'Details',
    },
    id: {
      report: 'Laporan Pengujian',
      date: 'Tanggal Dibuat',
      summary: 'Ringkasan',
      details: 'Detail',
    }
  }

  const l = lang[language] || lang.en
  const now = new Date().toLocaleString(language === 'id' ? 'id-ID' : 'en-US')

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        .meta { color: #7f8c8d; font-size: 12px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #34495e; color: white; padding: 10px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ecf0f1; }
        tr:nth-child(even) { background-color: #f8f9fa; }
        .summary-table td:first-child { font-weight: bold; color: #34495e; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">${l.date}: ${now}</div>
      
      <h2>${l.summary}</h2>
      <table class="summary-table">
  `

  // Add summary rows
  if (summary) {
    Object.entries(summary).forEach(([key, value]) => {
      html += `<tr><td>${key}</td><td>${value}</td></tr>`
    })
  }

  html += `
      </table>
      
      <h2>${l.details}</h2>
      <table>
        <thead><tr>
  `

  // Add detail headers
  if (details && details.length > 0) {
    const headers = Object.keys(details[0])
    headers.forEach(header => {
      html += `<th>${header}</th>`
    })

    html += `
        </tr></thead>
        <tbody>
    `

    // Add detail rows
    details.forEach(row => {
      html += '<tr>'
      Object.values(row).forEach(value => {
        html += `<td>${value}</td>`
      })
      html += '</tr>'
    })
  }

  html += `
        </tbody>
      </table>
    </body>
    </html>
  `

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.html`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export data as JSON
 * @param {Object} data - Data to export
 * @param {string} filename - Output filename
 */
export const exportToJSON = (data, filename) => {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.json`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
