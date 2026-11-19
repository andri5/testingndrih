import ExcelJS from 'exceljs'
import { prisma } from '../lib/prisma.js'
import { allocateScenarioCode } from '../utils/scenarioCode.js'

const VALID_TYPES = [
  'NAVIGATE', 'CLICK', 'FILL', 'SCREENSHOT', 'WAIT', 'ASSERTION',
  'API_CALL', 'HOVER', 'SCROLL', 'FILE_UPLOAD', 'DRAG', 'MOCK_ROUTE',
]

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const VALID_CASE_TYPES = ['Functional', 'Regression', 'Smoke', 'Sanity', 'Other']

/** Accept current + legacy header names */
const HEADER_ALIASES = {
  featureFolder: ['Feature Folder', 'Folder', 'Fitur'],
  caseName: ['Case Name', 'Scenario Name', 'Name'],
  description: ['Description', 'Deskripsi'],
  baseUrl: ['Base URL', 'URL'],
  precondition: ['Precondition', 'Prasyarat'],
  caseExpectedResult: ['Case Expected Result', 'Expected Result', 'Expected Result (Case)'],
  priority: ['Priority', 'Severity', 'Prioritas'],
  caseType: ['Case Type', 'Type (Case)'],
  stepNum: ['Step #', 'Step Number', 'Step'],
  stepType: ['Step Type', 'Type'],
  stepDescription: ['Step Description', 'Description (Step)'],
  stepExpectedResult: ['Step Expected Result', 'Expected Result (Step)'],
  selector: ['Selector'],
  value: ['Value'],
}

function resolveHeaders(headerMap) {
  const resolved = {}
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    for (const alias of aliases) {
      if (headerMap[alias] != null) {
        resolved[key] = headerMap[alias]
        break
      }
    }
  }
  return resolved
}

function normalizePriority(value) {
  const p = String(value || 'MEDIUM').trim().toUpperCase()
  return VALID_PRIORITIES.includes(p) ? p : 'MEDIUM'
}

function normalizeCaseType(value) {
  const raw = String(value || 'Functional').trim()
  if (!raw) return 'Functional'
  const hit = VALID_CASE_TYPES.find((t) => t.toLowerCase() === raw.toLowerCase())
  return hit || raw
}

function normalizeUrl(url) {
  const trimmed = String(url || '').trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  return `https://${trimmed}`
}

function colLetter(colIndex1Based) {
  let n = colIndex1Based
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

/**
 * Parse Excel for bulk case import (Manual QA + steps).
 *
 * New format columns:
 * Feature Folder | Case Name | Description | Base URL | Precondition |
 * Case Expected Result | Priority | Case Type |
 * Step # | Step Type | Step Description | Step Expected Result | Selector | Value
 *
 * Legacy columns (Scenario Name / Type / …) still accepted.
 */
export async function parseExcelFile(buffer) {
  try {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      throw new Error('Excel file has no worksheets')
    }

    const headerRow = worksheet.getRow(1)
    const headerMap = {}
    headerRow.eachCell((cell, colNumber) => {
      const val = cell.value
      if (val) headerMap[String(val).trim()] = colNumber
    })

    const headers = resolveHeaders(headerMap)

    if (!headers.caseName) {
      throw new Error('Required column not found: "Case Name" (or legacy "Scenario Name")')
    }
    if (!headers.stepNum || !headers.stepType || !headers.stepDescription) {
      throw new Error('Required columns: "Step #", "Step Type" (or "Type"), "Step Description"')
    }

    // Avoid using case-level "Type" as step type when both exist under alias "Type"
    if (headers.caseType && headers.stepType && headers.caseType === headers.stepType) {
      // Prefer explicit "Step Type" if present in raw headers
      if (headerMap['Step Type']) headers.stepType = headerMap['Step Type']
      if (headerMap['Case Type']) headers.caseType = headerMap['Case Type']
    }

    const scenarios = []
    let currentScenario = null

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return

      const get = (key) => {
        const col = headers[key]
        if (!col) return null
        const cell = row.getCell(col)
        const val = cell.value
        if (val === null || val === undefined || val === '') return null
        if (typeof val === 'object' && val.text) return String(val.text).trim()
        if (typeof val === 'object' && val.result != null) return String(val.result).trim()
        return String(val).trim()
      }

      const caseName = get('caseName')
      const stepNum = get('stepNum')

      if (!caseName && !stepNum) return

      if (caseName) {
        const url = get('baseUrl')
        if (!url) {
          throw new Error(`Row ${rowNumber}: "Base URL" is required when starting a new case`)
        }
        const normalizedUrl = normalizeUrl(url)
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
          throw new Error(`Row ${rowNumber}: Base URL must start with http:// or https://`)
        }

        currentScenario = {
          name: caseName,
          description: get('description') || '',
          url: normalizedUrl,
          featureFolder: get('featureFolder') || null,
          precondition: get('precondition') || null,
          expectedResult: get('caseExpectedResult') || null,
          priority: normalizePriority(get('priority')),
          caseType: normalizeCaseType(get('caseType')),
          steps: [],
        }
        scenarios.push(currentScenario)
      }

      if (!currentScenario) {
        throw new Error(`Row ${rowNumber}: Step found before a Case Name / Scenario Name`)
      }

      if (!stepNum) return

      const rawType = get('stepType')
      const type = rawType ? rawType.toUpperCase() : null
      if (!type || !VALID_TYPES.includes(type)) {
        throw new Error(
          `Row ${rowNumber}: Step Type "${rawType}" is invalid. Choose from: ${VALID_TYPES.join(', ')}`
        )
      }

      const stepDesc = get('stepDescription')
      if (!stepDesc) throw new Error(`Row ${rowNumber}: "Step Description" is required`)

      currentScenario.steps.push({
        stepNumber: parseInt(stepNum, 10),
        type,
        description: stepDesc,
        expectedResult: get('stepExpectedResult') || null,
        selector: get('selector'),
        value: get('value'),
      })
    })

    if (scenarios.length === 0) throw new Error('No cases found in the Excel file')

    scenarios.forEach((s) => s.steps.sort((a, b) => a.stepNumber - b.stepNumber))

    const totalSteps = scenarios.reduce((sum, s) => sum + s.steps.length, 0)

    return {
      success: true,
      scenarios,
      totalScenarios: scenarios.length,
      totalSteps,
    }
  } catch (error) {
    throw new Error(`Excel parsing error: ${error.message}`)
  }
}

async function resolveFolderId(tx, userId, folderName, fallbackFolderId) {
  const name = String(folderName || '').trim()
  if (name) {
    const existing = await tx.scenarioFolder.findFirst({
      where: { userId, name, parentId: null },
    })
    if (existing) return existing.id

    const siblings = await tx.scenarioFolder.count({
      where: { userId, parentId: null },
    })
    const created = await tx.scenarioFolder.create({
      data: {
        name,
        userId,
        parentId: null,
        sortOrder: siblings,
      },
    })
    return created.id
  }
  return fallbackFolderId || null
}

/**
 * Create scenarios and test steps from parsed data
 */
export async function createScenariosFromParsedData(userId, parsedData, options = {}) {
  try {
    const fallbackFolderId = options.folderId || null
    const results = await prisma.$transaction(async (tx) => {
      const createdScenarios = []
      const folderCache = new Map()

      for (const scenarioData of parsedData.scenarios) {
        const folderKey = scenarioData.featureFolder
          ? String(scenarioData.featureFolder).trim().toLowerCase()
          : `__fallback__:${fallbackFolderId || 'none'}`

        let folderId
        if (folderCache.has(folderKey)) {
          folderId = folderCache.get(folderKey)
        } else {
          folderId = await resolveFolderId(
            tx,
            userId,
            scenarioData.featureFolder,
            fallbackFolderId
          )
          folderCache.set(folderKey, folderId)
        }

        const siblingCount = await tx.scenario.count({
          where: { userId, folderId: folderId || null },
        })
        const scenarioCode = await allocateScenarioCode(tx, scenarioData.name)

        const scenario = await tx.scenario.create({
          data: {
            name: scenarioData.name,
            description: scenarioData.description || '',
            url: scenarioData.url,
            userId,
            ownerId: userId,
            steps: 0,
            folderId: folderId || null,
            sortOrder: siblingCount,
            scenarioCode,
            precondition: scenarioData.precondition || null,
            expectedResult: scenarioData.expectedResult || null,
            priority: normalizePriority(scenarioData.priority),
            caseType: normalizeCaseType(scenarioData.caseType),
          },
        })

        const createdSteps = []
        for (const stepData of scenarioData.steps) {
          const step = await tx.testStep.create({
            data: {
              scenarioId: scenario.id,
              stepNumber: stepData.stepNumber,
              type: stepData.type,
              description: stepData.description,
              expectedResult: stepData.expectedResult || null,
              selector: stepData.selector,
              value: stepData.value,
            },
          })
          createdSteps.push(step)
        }

        await tx.scenario.update({
          where: { id: scenario.id },
          data: { steps: createdSteps.length },
        })

        createdScenarios.push({
          id: scenario.id,
          name: scenario.name,
          featureFolder: scenarioData.featureFolder || null,
          stepCount: createdSteps.length,
          scenarioCode,
        })
      }

      return createdScenarios
    })

    return {
      success: true,
      message: `Berhasil membuat ${results.length} case`,
      scenarios: results,
    }
  } catch (error) {
    throw new Error(`Failed to create scenario: ${error.message}`)
  }
}

/**
 * Generate template Excel aligned with Manual QA / feature folders.
 */
export async function generateTemplateExcel() {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Test Sambil Ngopi'
  workbook.created = new Date()

  const ws = workbook.addWorksheet('Template')

  const columns = [
    { header: 'Feature Folder', key: 'featureFolder', width: 18 },
    { header: 'Case Name', key: 'caseName', width: 26 },
    { header: 'Description', key: 'description', width: 28 },
    { header: 'Base URL', key: 'baseUrl', width: 36 },
    { header: 'Precondition', key: 'precondition', width: 28 },
    { header: 'Case Expected Result', key: 'caseExpectedResult', width: 30 },
    { header: 'Severity', key: 'priority', width: 12 },
    { header: 'Case Type', key: 'caseType', width: 14 },
    { header: 'Step #', key: 'stepNum', width: 9 },
    { header: 'Step Type', key: 'stepType', width: 14 },
    { header: 'Step Description', key: 'stepDesc', width: 32 },
    { header: 'Step Expected Result', key: 'stepExpectedResult', width: 28 },
    { header: 'Selector', key: 'selector', width: 26 },
    { header: 'Value', key: 'value', width: 28 },
  ]
  ws.columns = columns

  const headerRow = ws.getRow(1)
  headerRow.height = 24
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF14B8A6' } } }
  })

  const TEAL = 'FFCCFBF1'
  const AMBER = 'FFFEF3C7'

  const sampleData = [
    {
      featureFolder: 'Login',
      caseName: 'Login valid',
      description: 'User login dengan kredensial benar',
      baseUrl: 'https://app.example.com',
      precondition: 'User sudah terdaftar dan aktif',
      caseExpectedResult: 'Masuk dashboard dan melihat menu utama',
      priority: 'HIGH',
      caseType: 'Functional',
      stepNum: 1,
      stepType: 'NAVIGATE',
      stepDesc: 'Buka halaman login',
      stepExpectedResult: 'Form login tampil',
      selector: '',
      value: 'https://app.example.com/login',
      _color: TEAL,
    },
    {
      featureFolder: '',
      caseName: '',
      description: '',
      baseUrl: '',
      precondition: '',
      caseExpectedResult: '',
      priority: '',
      caseType: '',
      stepNum: 2,
      stepType: 'FILL',
      stepDesc: 'Isi email',
      stepExpectedResult: 'Email terisi',
      selector: '#email',
      value: 'user@test.com',
      _color: TEAL,
    },
    {
      featureFolder: '',
      caseName: '',
      description: '',
      baseUrl: '',
      precondition: '',
      caseExpectedResult: '',
      priority: '',
      caseType: '',
      stepNum: 3,
      stepType: 'FILL',
      stepDesc: 'Isi password',
      stepExpectedResult: 'Password terisi',
      selector: '#password',
      value: 'secret123',
      _color: TEAL,
    },
    {
      featureFolder: '',
      caseName: '',
      description: '',
      baseUrl: '',
      precondition: '',
      caseExpectedResult: '',
      priority: '',
      caseType: '',
      stepNum: 4,
      stepType: 'CLICK',
      stepDesc: 'Klik tombol login',
      stepExpectedResult: 'Redirect ke dashboard',
      selector: 'button[type=submit]',
      value: '',
      _color: TEAL,
    },
    {
      featureFolder: '',
      caseName: '',
      description: '',
      baseUrl: '',
      precondition: '',
      caseExpectedResult: '',
      priority: '',
      caseType: '',
      stepNum: 5,
      stepType: 'ASSERTION',
      stepDesc: 'Verifikasi dashboard',
      stepExpectedResult: 'Teks Welcome terlihat',
      selector: '.dashboard',
      value: 'Welcome',
      _color: TEAL,
    },
    {
      featureFolder: 'Login',
      caseName: 'Login invalid',
      description: 'Password salah ditolak',
      baseUrl: 'https://app.example.com',
      precondition: 'User sudah terdaftar',
      caseExpectedResult: 'Pesan error password salah',
      priority: 'MEDIUM',
      caseType: 'Functional',
      stepNum: 1,
      stepType: 'NAVIGATE',
      stepDesc: 'Buka halaman login',
      stepExpectedResult: 'Form login tampil',
      selector: '',
      value: 'https://app.example.com/login',
      _color: AMBER,
    },
    {
      featureFolder: '',
      caseName: '',
      description: '',
      baseUrl: '',
      precondition: '',
      caseExpectedResult: '',
      priority: '',
      caseType: '',
      stepNum: 2,
      stepType: 'FILL',
      stepDesc: 'Isi email',
      stepExpectedResult: '',
      selector: '#email',
      value: 'user@test.com',
      _color: AMBER,
    },
    {
      featureFolder: '',
      caseName: '',
      description: '',
      baseUrl: '',
      precondition: '',
      caseExpectedResult: '',
      priority: '',
      caseType: '',
      stepNum: 3,
      stepType: 'FILL',
      stepDesc: 'Isi password salah',
      stepExpectedResult: '',
      selector: '#password',
      value: 'wrong-pass',
      _color: AMBER,
    },
    {
      featureFolder: '',
      caseName: '',
      description: '',
      baseUrl: '',
      precondition: '',
      caseExpectedResult: '',
      priority: '',
      caseType: '',
      stepNum: 4,
      stepType: 'CLICK',
      stepDesc: 'Klik login',
      stepExpectedResult: 'Error message tampil',
      selector: 'button[type=submit]',
      value: '',
      _color: AMBER,
    },
  ]

  sampleData.forEach((data) => {
    const { _color, ...rowData } = data
    const row = ws.addRow(rowData)
    row.height = 18
    row.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: _color } }
      cell.alignment = { vertical: 'middle', wrapText: false }
      cell.border = {
        top: { style: 'hair', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'hair', color: { argb: 'FFCBD5E1' } },
      }
    })
    if (rowData.caseName) {
      row.getCell(2).font = { bold: true }
    }
  })

  const priorityCol = colLetter(columns.findIndex((c) => c.key === 'priority') + 1)
  const caseTypeCol = colLetter(columns.findIndex((c) => c.key === 'caseType') + 1)
  const stepTypeCol = colLetter(columns.findIndex((c) => c.key === 'stepType') + 1)

  ws.dataValidations.add(`${priorityCol}2:${priorityCol}500`, {
    type: 'list',
    allowBlank: true,
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Priority tidak valid',
    error: VALID_PRIORITIES.join(', '),
    formulae: [`"${VALID_PRIORITIES.join(',')}"`],
  })

  ws.dataValidations.add(`${caseTypeCol}2:${caseTypeCol}500`, {
    type: 'list',
    allowBlank: true,
    showErrorMessage: true,
    errorStyle: 'warning',
    errorTitle: 'Case Type',
    error: VALID_CASE_TYPES.join(', '),
    formulae: [`"${VALID_CASE_TYPES.join(',')}"`],
  })

  ws.dataValidations.add(`${stepTypeCol}2:${stepTypeCol}500`, {
    type: 'list',
    allowBlank: true,
    showDropDown: false,
    showErrorMessage: true,
    errorStyle: 'stop',
    errorTitle: 'Step Type Tidak Valid',
    error: `Choose one: ${VALID_TYPES.join(', ')}`,
    formulae: [`"${VALID_TYPES.join(',')}"`],
  })

  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 2 }]

  const guideWs = workbook.addWorksheet('Petunjuk')
  guideWs.getColumn(1).width = 96

  const guideLines = [
    ['PETUNJUK IMPORT EXCEL — Test Sambil Ngopi (Manual QA)'],
    [''],
    ['STRUKTUR SAAT INI:'],
    ['  • 1 Feature Folder = 1 fitur (contoh: Login, Checkout)'],
    ['  • 1 Case Name = 1 flow (contoh: Login valid / Login invalid)'],
    ['  • Case meta: Precondition, Case Expected Result, Priority, Case Type'],
    ['  • Steps: Step Type + Step Description + Step Expected Result + Selector/Value'],
    [''],
    ['CARA MENGISI:'],
    ['  • Feature Folder     → Nama fitur. Diisi di baris PERTAMA tiap case.'],
    ['                         Folder dibuat otomatis jika belum ada.'],
    ['                         Jika kosong, case masuk folder aktif di UI (atau No folder).'],
    ['  • Case Name          → Nama case (wajib di baris pertama case).'],
    ['  • Description        → Ringkasan case (opsional).'],
    ['  • Base URL           → URL target (wajib di baris pertama case).'],
    ['  • Precondition       → Kondisi awal sebelum steps (opsional).'],
    ['  • Case Expected Result → Hasil akhir yang diharapkan untuk case (opsional).'],
    ['  • Severity           → LOW / MEDIUM / HIGH / CRITICAL (dropdown; sama dengan Priority di detail).'],
    ['  • Case Type          → Functional / Regression / Smoke / Sanity / Other.'],
    ['  • Step #             → Nomor urut step (1, 2, 3, …).'],
    ['  • Step Type          → Dropdown: NAVIGATE, CLICK, FILL, …'],
    ['  • Step Description   → Aksi step (wajib).'],
    ['  • Step Expected Result → Apa yang harus terlihat setelah step (opsional).'],
    ['  • Selector / Value   → Sesuai tipe step (kosongkan jika tidak perlu).'],
    [''],
    ['BARIS BERIKUTNYA:'],
    ['  Kosongkan kolom Feature Folder … Case Type. Isi hanya Step # dst.'],
    ['  Case baru dimulai lagi ketika Case Name diisi.'],
    [''],
    ['COMPATIBILITY:'],
    ['  Format lama (Scenario Name + Type) masih bisa diimport.'],
    [''],
    ['STEP TYPE:'],
    ...VALID_TYPES.map((t) => [`    • ${t.padEnd(16)} — ${typeDesc(t)}`]),
    [''],
    ['TIPS:'],
    ['  • Warna baris berbeda = case berbeda (contoh visual)'],
    ['  • Jangan ubah nama header di baris 1'],
    ['  • Simpan sebagai .xlsx lalu Upload di Test Repository → Import Excel'],
  ]

  guideLines.forEach((line, i) => {
    const row = guideWs.addRow(line)
    if (i === 0) row.getCell(1).font = { bold: true, size: 13, color: { argb: 'FF0F766E' } }
    else if (
      line[0]?.startsWith('STRUKTUR') ||
      line[0]?.startsWith('CARA') ||
      line[0]?.startsWith('BARIS') ||
      line[0]?.startsWith('COMPAT') ||
      line[0]?.startsWith('STEP TYPE') ||
      line[0]?.startsWith('TIPS')
    ) {
      row.getCell(1).font = { bold: true }
    }
  })

  const buf = await workbook.xlsx.writeBuffer()
  return Buffer.from(buf)
}

function typeDesc(type) {
  const map = {
    NAVIGATE: 'Buka URL/halaman',
    CLICK: 'Klik elemen',
    FILL: 'Isi input / form',
    SCREENSHOT: 'Ambil screenshot',
    WAIT: 'Tunggu (ms atau elemen muncul)',
    ASSERTION: 'Verifikasi kondisi / teks',
    API_CALL: 'Panggil API endpoint',
    HOVER: 'Hover mouse ke elemen',
    SCROLL: 'Scroll halaman',
    FILE_UPLOAD: 'Upload file',
    DRAG: 'Drag & drop elemen',
    MOCK_ROUTE: 'Mock network request',
  }
  return map[type] || ''
}
