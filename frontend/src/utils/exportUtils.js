/**
 * Export utilities for PDF and Excel
 * Supports Indonesian language for all exports
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
 * Create SVG bar chart for PDF export
 */
const createSVGBarChart = (labels, values, colors, description = '') => {
  const width = 500
  const height = 320
  const padding = 60
  const chartWidth = width - padding * 2
  const chartHeight = height - padding
  const maxValue = Math.max(...values, 1)
  const barSpacing = chartWidth / labels.length
  const barWidth = barSpacing * 0.6

  let svg = `<svg width="${width}" height="${height + 60}" style="margin: 20px auto; display: block;">
    <defs>
      <style>
        .bar-label { font-size: 12px; text-anchor: middle; fill: #333; }
        .bar-value { font-size: 13px; text-anchor: middle; font-weight: bold; fill: #333; }
        .axis-label { font-size: 11px; fill: #666; }
        .chart-desc { font-size: 12px; fill: #666; }
      </style>
    </defs>`

  // Grid lines
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight * (5 - i)) / 5
    svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#e0e0e0" stroke-width="1" stroke-dasharray="2,2"/>`
    svg += `<text x="${padding - 10}" y="${y + 4}" class="axis-label" text-anchor="end">${(maxValue * i / 5).toFixed(1)}</text>`
  }

  // Axes
  svg += `<line x1="${padding}" y1="${padding}" x2="${padding}" y2="${padding + chartHeight}" stroke="#333" stroke-width="2"/>`
  svg += `<line x1="${padding}" y1="${padding + chartHeight}" x2="${width - padding}" y2="${padding + chartHeight}" stroke="#333" stroke-width="2"/>`

  // Bars
  values.forEach((value, index) => {
    const barHeight = (value / maxValue) * chartHeight
    const x = padding + index * barSpacing + (barSpacing - barWidth) / 2
    const y = padding + chartHeight - barHeight

    svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${colors[index]}" stroke="white" stroke-width="1.5" rx="2"/>`

    // Value label on top
    svg += `<text x="${x + barWidth / 2}" y="${y - 8}" class="bar-value">${value.toFixed(1)}</text>`

    // Category label below
    svg += `<text x="${x + barWidth / 2}" y="${padding + chartHeight + 20}" class="bar-label">${labels[index]}</text>`
  })

  // Legend with description
  let legendY = height + 10
  svg += `<text x="${padding}" y="${legendY}" class="chart-desc" font-weight="bold">${description}</text>`

  svg += `</svg>`
  return svg
}

/**
 * Export summary to HTML with charts - download as text file that can be opened as table
 * @param {string} title - Report title
 * @param {Object} summary - Summary data object
 * @param {Array} details - Array of detail rows
 * @param {string} filename - Output filename
 * @param {Object} analysis - Analysis data with conclusions, recommendations, solutions
 */
export const exportToHTML = (title, summary, details, filename, language = 'en', analysis = null) => {
  const lang = {
    en: {
      report: 'Test Report',
      date: 'Generated Date',
      summary: 'Summary',
      details: 'Details',
      conclusions: 'Conclusions',
      recommendations: 'Recommendations',
      solutions: 'Solutions & Action Items',
      noDetails: 'No detailed data available',
      passRate: 'Pass Rate',
      responseTime: 'Response Time',
      errorRate: 'Error Rate',
      throughput: 'Throughput',
      vulnerabilities: 'Vulnerabilities',
    },
    id: {
      report: 'Laporan Pengujian',
      date: 'Tanggal Dibuat',
      summary: 'Ringkasan',
      details: 'Detail',
      conclusions: 'Kesimpulan',
      recommendations: 'Saran',
      solutions: 'Solusi & Tindakan Perbaikan',
      noDetails: 'Data detail tidak tersedia',
      passRate: 'Tingkat Lulus',
      responseTime: 'Waktu Respons',
      errorRate: 'Tingkat Error',
      throughput: 'Throughput',
      vulnerabilities: 'Kerentanan',
    }
  }

  const l = lang[language] || lang.en
  const now = new Date().toLocaleString(language === 'id' ? 'id-ID' : 'en-US')

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"><\/script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 0;
          padding: 20px;
          color: #333; 
          line-height: 1.6;
          background: #f5f5f5;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          border-radius: 10px;
          margin-bottom: 30px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 { 
          font-size: 32px;
          margin-bottom: 10px;
        }
        .header .meta {
          opacity: 0.9;
          font-size: 14px;
        }
        h2 { 
          color: #2c3e50;
          margin-top: 30px;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 3px solid #667eea;
          font-size: 24px;
        }
        h3 {
          color: #5d6d7b;
          margin-top: 15px;
          margin-bottom: 8px;
          font-size: 16px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .summary-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border-left: 4px solid #667eea;
        }
        .summary-card .label {
          font-size: 12px;
          color: #7f8c8d;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .summary-card .value {
          font-size: 28px;
          font-weight: bold;
          color: #2c3e50;
        }
        .chart-container {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin: 20px 0;
          page-break-inside: avoid;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0; 
          background: white;
        }
        th { 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white; 
          padding: 12px; 
          text-align: left;
          font-weight: 600;
        }
        td { 
          padding: 10px; 
          border-bottom: 1px solid #ecf0f1; 
        }
        tr:nth-child(even) { 
          background-color: #f8f9fa; 
        }
        .conclusion-item, .recommendation-item {
          margin: 10px 0;
          padding: 12px;
          border-left: 4px solid #667eea;
          background-color: #f0f4ff;
          border-radius: 4px;
        }
        .solution-box {
          margin: 15px 0;
          padding: 15px;
          border: 2px solid #667eea;
          background: linear-gradient(to right, #f0f4ff, white);
          border-radius: 6px;
          page-break-inside: avoid;
        }
        .solution-title {
          font-weight: bold;
          color: #667eea;
          margin-bottom: 10px;
          font-size: 14px;
        }
        .solution-step {
          margin: 6px 0;
          padding-left: 20px;
          color: #333;
          font-size: 13px;
        }
        .solution-step:before {
          content: "→ ";
          color: #667eea;
          font-weight: bold;
          margin-right: 5px;
        }
        .page-break {
          page-break-after: always;
          margin: 40px 0;
          border-top: 2px dashed #ddd;
          padding-top: 20px;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin: 20px 0;
        }
        @media print {
          body { background: white; }
          .chart-container, .summary-card {
            page-break-inside: avoid;
            box-shadow: none;
            border: 1px solid #ddd;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        <div class="meta">${l.date}: ${now}</div>
      </div>
      
      <h2>📊 ${l.summary}</h2>
  `

  // Key translation mapping (English to Indonesian)
  const keyTranslations = {
    'Total Tests': 'Total Tes',
    'Pass Rate (%)': 'Tingkat Lulus (%)',
    'Avg Duration (s)': 'Durasi Rata-rata (s)',
    'Avg Response Time (ms)': 'Waktu Respons Rata-rata (ms)',
    'Throughput (exec/sec)': 'Throughput (exec/detik)',
    'Total Scans': 'Total Scan',
    'Avg Risk Score': 'Skor Risiko Rata-rata',
    'Critical Findings': 'Temuan Kritis',
    'High Findings': 'Temuan Tinggi',
    'Medium+Low Findings': 'Temuan Sedang+Rendah',
    'Error Rate (%)': 'Tingkat Error (%)',
    'Total Requests': 'Total Permintaan',
    // Detail table headers
    'Scenario Name': 'Nama Scenario',
    'Test Steps': 'Langkah Tes',
    'Status': 'Status',
    'Created At': 'Dibuat Pada',
    'URL': 'URL',
    'Active': 'Aktif',
  }

  // Create summary cards
  if (summary) {
    html += '<div class="summary-grid">'
    Object.entries(summary).forEach(([key, value]) => {
      const displayValue = typeof value === 'number' ? value.toFixed(1) : value
      const translatedKey = keyTranslations[key] || key
      html += `
        <div class="summary-card">
          <div class="label">${translatedKey}</div>
          <div class="value">${displayValue}</div>
        </div>
      `
    })
    html += '</div>'
  }

  // Add Charts based on summary data
  if (summary && Object.keys(summary).length > 0) {
    // Smoke Test: Pass/Fail chart
    if (summary['Pass Rate (%)'] !== undefined && summary['Total Tests'] !== undefined) {
      const passCount = Math.round((parseFloat(summary['Pass Rate (%)']) / 100) * (summary['Total Tests'] || 0))
      const failCount = (summary['Total Tests'] || 0) - passCount
      html += '<div class="chart-container">'
      html += createSVGBarChart(
        ['Lulus', 'Gagal'],
        [passCount, failCount],
        ['#10b981', '#ef4444'],
        `📊 Distribusi Hasil: Total ${summary['Total Tests']} test, ${passCount} lulus, ${failCount} gagal`
      )
      html += '</div>'
    }
    // Stress Test: Response Time and Error Rate
    else if (summary['Avg Response Time (ms)'] !== undefined && summary['Error Rate (%)'] !== undefined) {
      const responseTime = parseFloat(summary['Avg Response Time (ms)']) || 0
      const errorRate = parseFloat(summary['Error Rate (%)']) || 0
      html += '<div class="chart-container">'
      html += createSVGBarChart(
        ['Waktu Respons (ms)', 'Tingkat Error (%)'],
        [responseTime, errorRate],
        ['#3b82f6', '#ef4444'],
        `⚡ Metrik Performa: Waktu respons rata-rata ${responseTime.toFixed(0)}ms, tingkat error ${errorRate.toFixed(1)}%`
      )
      html += '</div>'
    }
    // Security Test: Vulnerability levels
    else if (summary['Critical Findings'] !== undefined) {
      const critical = parseInt(summary['Critical Findings']) || 0
      const high = parseInt(summary['High Findings']) || 0
      const mediumLow = parseInt(summary['Medium+Low Findings']) || 0
      const total = critical + high + mediumLow
      
      if (total > 0) {
        html += '<div class="chart-container">'
        html += createSVGBarChart(
          ['Kritis', 'Tinggi', 'Sedang+Rendah'],
          [critical, high, mediumLow],
          ['#ef4444', '#f97316', '#eab308'],
          `🔒 Distribusi Kerentanan: ${critical} kritis, ${high} tinggi, ${mediumLow} sedang+rendah, total ${total} temuan`
        )
        html += '</div>'
      } else {
        html += '<div class="chart-container" style="background: #d4edda; border: 2px solid #28a745; border-radius: 8px; padding: 20px; text-align: center;">'
        html += `<p style="color: #155724; font-weight: bold; margin: 0;">✅ Tidak ada kerentanan yang ditemukan!</p>`
        html += '</div>'
      }
    }
  }

  // Add Conclusions section if available
  if (analysis && analysis.conclusions && analysis.conclusions.length > 0) {
    html += `
      <div class="page-break"></div>
      <h2>✅ ${l.conclusions}</h2>
    `
    analysis.conclusions.forEach(conclusion => {
      html += `<div class="conclusion-item">${conclusion}</div>`
    })
  }

  // Add Recommendations section if available
  if (analysis && analysis.recommendations && analysis.recommendations.length > 0) {
    html += `
      <h2>💡 ${l.recommendations}</h2>
    `
    analysis.recommendations.forEach(recommendation => {
      html += `<div class="recommendation-item">• ${recommendation}</div>`
    })
  }

  // Add Solutions section if available
  if (analysis && analysis.solutions && analysis.solutions.length > 0) {
    html += `
      <div class="page-break"></div>
      <h2>🔧 ${l.solutions}</h2>
    `
    analysis.solutions.forEach(solution => {
      html += `
        <div class="solution-box">
          <div class="solution-title">${solution.issue}</div>
      `
      if (Array.isArray(solution.steps)) {
        solution.steps.forEach(step => {
          html += `<div class="solution-step">${step}</div>`
        })
      }
      html += `
        </div>
      `
    })
  }

  // Add Details section
  if (details && details.length > 0) {
    html += `
      <div class="page-break"></div>
      <h2>📋 ${l.details}</h2>
      <table>
        <thead><tr>
    `

    const headers = Object.keys(details[0])
    headers.forEach(header => {
      const translatedHeader = keyTranslations[header] || header
      html += `<th>${translatedHeader}</th>`
    })

    html += `
        </tr></thead>
        <tbody>
    `

    // Add detail rows
    details.forEach(row => {
      html += '<tr>'
      Object.values(row).forEach(value => {
        const translatedValue = keyTranslations[String(value)] || value
        html += `<td>${translatedValue}</td>`
      })
      html += '</tr>'
    })

    html += `
        </tbody>
      </table>
    `
  } else if (!details || details.length === 0) {
    html += `<p>${l.noDetails}</p>`
  }

  html += `
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
