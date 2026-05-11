import ExcelJS from 'exceljs'
import { prisma } from '../lib/prisma.js'

const VALID_TYPES = [
  'NAVIGATE', 'CLICK', 'FILL', 'SCREENSHOT', 'WAIT', 'ASSERTION',
  'API_CALL', 'HOVER', 'SCROLL', 'FILE_UPLOAD', 'DRAG', 'MOCK_ROUTE'
]

/**
 * Parse single-sheet Excel file (new format)
 *
 * Format (1 sheet, bisa berisi banyak skenario):
 * | Scenario Name | Description | Base URL | Step # | Type | Step Description | Selector | Value |
 *
 * - Scenario Name, Description, Base URL hanya diisi di baris pertama tiap skenario
 * - Baris step berikutnya kolom tersebut dikosongkan
 * - Skenario baru dimulai ketika Scenario Name diisi lagi
 */
export async function parseExcelFile(buffer) {
  try {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      throw new Error('File Excel tidak memiliki sheet')
    }

    // Baca header row
    const headerRow = worksheet.getRow(1)
    const headers = {}
    headerRow.eachCell((cell, colNumber) => {
      const val = cell.value
      if (val) headers[String(val).trim()] = colNumber
    })

    // Validasi kolom wajib
    const requiredCols = ['Step #', 'Type', 'Step Description']
    for (const col of requiredCols) {
      if (!headers[col]) throw new Error(`Kolom wajib tidak ditemukan: "${col}"`)
    }

    const scenarios = []
    let currentScenario = null

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // skip header

      const get = (colName) => {
        const col = headers[colName]
        if (!col) return null
        const cell = row.getCell(col)
        const val = cell.value
        if (val === null || val === undefined || val === '') return null
        // Handle hyperlink cells
        if (typeof val === 'object' && val.text) return String(val.text).trim()
        return String(val).trim()
      }

      const scenarioName = get('Scenario Name')
      const stepNum = get('Step #')

      // Skip baris kosong total
      if (!scenarioName && !stepNum) return

      // Mulai skenario baru
      if (scenarioName) {
        const url = get('Base URL')
        if (!url) throw new Error(`Baris ${rowNumber}: "Base URL" wajib diisi saat memulai skenario baru`)
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          throw new Error(`Baris ${rowNumber}: Base URL harus diawali http:// atau https://`)
        }
        currentScenario = {
          name: scenarioName,
          description: get('Description') || '',
          url,
          steps: []
        }
        scenarios.push(currentScenario)
      }

      if (!currentScenario) {
        throw new Error(`Baris ${rowNumber}: Step ditemukan sebelum ada Scenario Name`)
      }

      if (!stepNum) return // baris info skenario tanpa step

      const rawType = get('Type')
      const type = rawType ? rawType.toUpperCase() : null
      if (!type || !VALID_TYPES.includes(type)) {
        throw new Error(
          `Baris ${rowNumber}: Type "${rawType}" tidak valid. Pilih dari: ${VALID_TYPES.join(', ')}`
        )
      }

      const stepDesc = get('Step Description')
      if (!stepDesc) throw new Error(`Baris ${rowNumber}: "Step Description" wajib diisi`)

      currentScenario.steps.push({
        stepNumber: parseInt(stepNum),
        type,
        description: stepDesc,
        selector: get('Selector'),
        value: get('Value')
      })
    })

    if (scenarios.length === 0) throw new Error('Tidak ada skenario ditemukan dalam file Excel')

    // Sort steps per skenario
    scenarios.forEach(s => s.steps.sort((a, b) => a.stepNumber - b.stepNumber))

    const totalSteps = scenarios.reduce((sum, s) => sum + s.steps.length, 0)

    return {
      success: true,
      scenarios,
      totalScenarios: scenarios.length,
      totalSteps
    }
  } catch (error) {
    throw new Error(`Excel parsing error: ${error.message}`)
  }
}

// ─── LEGACY PARSER STUB (tidak dipakai, tapi jaga referensi) ────────────────
// (dihapus — format lama 2-sheet tidak didukung lagi)

/**
 * Create scenarios and test steps from parsed data
 */
export async function createScenariosFromParsedData(userId, parsedData) {
  try {
    const results = await prisma.$transaction(async (tx) => {
      const createdScenarios = []

      for (const scenarioData of parsedData.scenarios) {
        const scenario = await tx.scenario.create({
          data: {
            name: scenarioData.name,
            description: scenarioData.description,
            url: scenarioData.url,
            userId,
            steps: 0
          }
        })

        const createdSteps = []
        for (const stepData of scenarioData.steps) {
          const step = await tx.testStep.create({
            data: {
              scenarioId: scenario.id,
              stepNumber: stepData.stepNumber,
              type: stepData.type,
              description: stepData.description,
              selector: stepData.selector,
              value: stepData.value
            }
          })
          createdSteps.push(step)
        }

        await tx.scenario.update({
          where: { id: scenario.id },
          data: { steps: createdSteps.length }
        })

        createdScenarios.push({
          id: scenario.id,
          name: scenario.name,
          stepCount: createdSteps.length
        })
      }

      return createdScenarios
    })

    return {
      success: true,
      message: `Berhasil membuat ${results.length} skenario`,
      scenarios: results
    }
  } catch (error) {
    throw new Error(`Gagal membuat skenario: ${error.message}`)
  }
}

/**
 * Generate template Excel dengan dropdown validation untuk kolom Type
 * Format: 1 sheet "Template", bisa berisi banyak skenario
 */
export async function generateTemplateExcel() {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'testingndrih'
  workbook.created = new Date()

  // ── Sheet utama: Template ──────────────────────────────────────────────────
  const ws = workbook.addWorksheet('Template')

  ws.columns = [
    { header: 'Scenario Name',    key: 'scenarioName', width: 28 },
    { header: 'Description',      key: 'description',  width: 32 },
    { header: 'Base URL',         key: 'baseUrl',      width: 38 },
    { header: 'Step #',           key: 'stepNum',      width: 9  },
    { header: 'Type',             key: 'type',         width: 16 },
    { header: 'Step Description', key: 'stepDesc',     width: 35 },
    { header: 'Selector',         key: 'selector',     width: 28 },
    { header: 'Value',            key: 'value',        width: 30 },
  ]

  // Style header
  const headerRow = ws.getRow(1)
  headerRow.height = 22
  headerRow.eachCell(cell => {
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }
    cell.font   = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF3B82F6' } } }
  })

  // Data contoh
  const BLUE  = 'FFDBEAFE' // skenario 1
  const GREEN = 'FFDCFCE7' // skenario 2

  const sampleData = [
    // Skenario 1 — Login
    { scenarioName: 'Login Test',  description: 'Verifikasi flow login', baseUrl: 'https://app.example.com', stepNum: 1, type: 'NAVIGATE',  stepDesc: 'Buka halaman login',       selector: '',                    value: 'https://app.example.com/login', _color: BLUE },
    { scenarioName: '',            description: '',                       baseUrl: '',                        stepNum: 2, type: 'FILL',      stepDesc: 'Isi email',                selector: '#email',              value: 'user@test.com',               _color: BLUE },
    { scenarioName: '',            description: '',                       baseUrl: '',                        stepNum: 3, type: 'FILL',      stepDesc: 'Isi password',             selector: '#password',           value: 'secret123',                   _color: BLUE },
    { scenarioName: '',            description: '',                       baseUrl: '',                        stepNum: 4, type: 'CLICK',     stepDesc: 'Klik tombol login',        selector: 'button[type=submit]', value: '',                            _color: BLUE },
    { scenarioName: '',            description: '',                       baseUrl: '',                        stepNum: 5, type: 'ASSERTION', stepDesc: 'Verifikasi halaman utama', selector: '.dashboard',          value: 'Welcome',                     _color: BLUE },
    // Skenario 2 — Search
    { scenarioName: 'Search Test', description: 'Verifikasi fitur cari', baseUrl: 'https://app.example.com', stepNum: 1, type: 'NAVIGATE',  stepDesc: 'Buka halaman utama',       selector: '',                    value: 'https://app.example.com',     _color: GREEN },
    { scenarioName: '',            description: '',                       baseUrl: '',                        stepNum: 2, type: 'FILL',      stepDesc: 'Ketik kata kunci',         selector: '#search',             value: 'laptop',                      _color: GREEN },
    { scenarioName: '',            description: '',                       baseUrl: '',                        stepNum: 3, type: 'CLICK',     stepDesc: 'Klik tombol cari',         selector: '.btn-search',         value: '',                            _color: GREEN },
    { scenarioName: '',            description: '',                       baseUrl: '',                        stepNum: 4, type: 'SCREENSHOT', stepDesc: 'Screenshot hasil cari',   selector: '',                    value: '',                            _color: GREEN },
  ]

  sampleData.forEach(data => {
    const { _color, ...rowData } = data
    const row = ws.addRow(rowData)
    row.height = 18
    row.eachCell(cell => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: _color } }
      cell.alignment = { vertical: 'middle' }
      cell.border    = {
        top:    { style: 'hair', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'hair', color: { argb: 'FFCBD5E1' } },
      }
    })
    if (rowData.scenarioName) {
      row.getCell(1).font = { bold: true }
    }
  })

  // ── Dropdown validation untuk kolom Type (E2:E500) ─────────────────────────
  ws.dataValidations.add('E2:E500', {
    type: 'list',
    allowBlank: true,
    showDropDown: false, // false = tampilkan panah dropdown
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Type Tidak Valid',
    error: `Pilih salah satu dari daftar: ${VALID_TYPES.join(', ')}`,
    formulae: [`"${VALID_TYPES.join(',')}"`]
  })

  // Freeze header
  ws.views = [{ state: 'frozen', ySplit: 1 }]

  // ── Sheet Petunjuk ─────────────────────────────────────────────────────────
  const guideWs = workbook.addWorksheet('Petunjuk')
  guideWs.getColumn(1).width = 90

  const guideLines = [
    ['PETUNJUK PENGGUNAAN TEMPLATE IMPORT SKENARIO'],
    [''],
    ['FORMAT FILE:'],
    ['  1 file Excel = 1 atau lebih skenario, semua dalam 1 sheet "Template"'],
    ['  Tidak perlu berpindah sheet — cukup isi dari atas ke bawah.'],
    [''],
    ['CARA MENGISI:'],
    ['  • Scenario Name  → Isi nama skenario di baris PERTAMA tiap skenario.'],
    ['                     Baris step berikutnya DIKOSONGKAN.'],
    ['  • Description    → Deskripsi singkat (opsional, isi di baris pertama saja)'],
    ['  • Base URL       → URL utama aplikasi (wajib, isi di baris pertama saja)'],
    ['                     Contoh: https://app.example.com'],
    ['  • Step #         → Nomor urut step (1, 2, 3, ...)'],
    ['  • Type           → Klik cell, pilih dari DROPDOWN ↓ (tidak perlu ketik manual)'],
    ['  • Step Description → Deskripsi aksi yang dilakukan (wajib)'],
    ['  • Selector       → CSS selector atau XPath elemen (kosongkan jika tidak perlu)'],
    ['  • Value          → URL untuk NAVIGATE, teks untuk FILL, dst (kosongkan jika tidak perlu)'],
    [''],
    ['TIPE YANG TERSEDIA (klik kolom Type untuk dropdown):'],
    ...VALID_TYPES.map(t => [`    • ${t.padEnd(16)} — ${typeDesc(t)}`]),
    [''],
    ['CONTOH MULTI-SKENARIO:'],
    ['  Baris 2: Scenario Name = "Login Test", Base URL = "https://...", Step # = 1, Type = NAVIGATE, ...'],
    ['  Baris 3:                              (kosong),                  Step # = 2, Type = FILL, ...'],
    ['  Baris 6: Scenario Name = "Search Test", Base URL = "https://...", Step # = 1, Type = NAVIGATE, ...'],
    ['  dst...'],
    [''],
    ['TIPS:'],
    ['  • Baris dengan warna berbeda = skenario berbeda (untuk memudahkan visual)'],
    ['  • Jangan ubah nama kolom di baris pertama'],
    ['  • Simpan sebagai .xlsx sebelum diupload'],
  ]

  guideLines.forEach((line, i) => {
    const row = guideWs.addRow(line)
    if (i === 0) row.getCell(1).font = { bold: true, size: 13 }
    else if (line[0]?.startsWith('FORMAT') || line[0]?.startsWith('CARA') || line[0]?.startsWith('TIPE') || line[0]?.startsWith('CONTOH') || line[0]?.startsWith('TIPS')) {
      row.getCell(1).font = { bold: true }
    }
  })

  const buf = await workbook.xlsx.writeBuffer()
  return Buffer.from(buf)
}

function typeDesc(type) {
  const map = {
    NAVIGATE:    'Buka URL/halaman',
    CLICK:       'Klik elemen',
    FILL:        'Isi input / form',
    SCREENSHOT:  'Ambil screenshot',
    WAIT:        'Tunggu (ms atau elemen muncul)',
    ASSERTION:   'Verifikasi kondisi / teks',
    API_CALL:    'Panggil API endpoint',
    HOVER:       'Hover mouse ke elemen',
    SCROLL:      'Scroll halaman',
    FILE_UPLOAD: 'Upload file',
    DRAG:        'Drag & drop elemen',
    MOCK_ROUTE:  'Mock network request',
  }
  return map[type] || ''
}
