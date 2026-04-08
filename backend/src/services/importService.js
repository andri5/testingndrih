import { prisma } from '../lib/prisma.js'
import fs from 'fs'
import path from 'path'

const TEMPLATES_DIR = path.resolve(process.cwd(), 'templates')

/**
 * Simple CSV parser (no external dependency)
 */
function parseCSV(content) {
  const lines = content.trim().split('\n')
  if (lines.length === 0) return []

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim())
    const row = {}

    headers.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })

    rows.push(row)
  }

  return rows
}

/**
 * Parse CSV file and create scenario with steps
 */
export async function importScenarioFromCSV(filePath, userId, scenarioData = {}) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const rows = parseCSV(content)

    if (rows.length === 0) {
      throw new Error('CSV file is empty or invalid')
    }

    // Create scenario
    const scenario = await prisma.scenario.create({
      data: {
        name: scenarioData.name || `Imported Scenario - ${new Date().toLocaleDateString()}`,
        description: scenarioData.description || 'Imported from CSV',
        url: scenarioData.url || 'https://example.com',
        userId,
        steps: rows.length
      }
    })

    // Create test steps
    const steps = []
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const step = await prisma.testStep.create({
        data: {
          stepNumber: parseInt(row.stepnumber) || i + 1,
          type: (row.type || 'NAVIGATE').toUpperCase(),
          description: row.description || '',
          selector: row.selector || null,
          value: row.value || null,
          scenarioId: scenario.id,
          metadata: JSON.stringify({
            notes: row.notes || '',
            expectedResult: row.expectedresult || ''
          })
        }
      })
      steps.push(step)
    }

    return {
      scenario,
      stepsCreated: steps.length,
      steps
    }
  } catch (error) {
    throw new Error(`Failed to import CSV: ${error.message}`)
  }
}

/**
 * Import from CSV template file in backend/templates/ folder
 */
export async function importScenarioFromTemplate(templateId, userId, scenarioName = null) {
  try {
    // Map template IDs to files
    const templateMap = {
      'login-test': 'login-test.csv',
      'form-test': 'form-test.csv',
      'ecommerce-flow': 'ecommerce-flow.csv',
      'basic-navigation': 'basic-navigation.csv',
    }

    const filename = templateMap[templateId]
    if (!filename) {
      throw new Error(`Template "${templateId}" not found. Available: ${Object.keys(templateMap).join(', ')}`)
    }

    const filePath = path.join(TEMPLATES_DIR, filename)
    if (!fs.existsSync(filePath)) {
      throw new Error(`Template file not found: ${filename}`)
    }

    // Derive scenario name from template if not provided
    const names = {
      'login-test': 'Login Form Test (Template)',
      'form-test': 'Form Filling Test (Template)',
      'ecommerce-flow': 'E-Commerce Flow Test (Template)',
      'basic-navigation': 'Basic Navigation Test (Template)',
    }

    const result = await importScenarioFromCSV(filePath, userId, {
      name: scenarioName || names[templateId] || `Template - ${templateId}`,
      description: `Imported from template: ${templateId}`,
      url: 'https://example.com'
    })

    return result
  } catch (error) {
    throw new Error(`Failed to import from template: ${error.message}`)
  }
}

/**
 * List available templates
 */
export function listTemplates() {
  const templates = [
    { id: 'login-test', name: 'Login Form Test', description: 'Login flow on the-internet.herokuapp.com', steps: 7, website: 'the-internet.herokuapp.com' },
    { id: 'form-test', name: 'Form Filling Test', description: 'Practice form on demoqa.com', steps: 7, website: 'demoqa.com' },
    { id: 'ecommerce-flow', name: 'E-Commerce Flow', description: 'Full shopping flow on saucedemo.com', steps: 14, website: 'saucedemo.com' },
    { id: 'basic-navigation', name: 'Basic Navigation', description: 'Search and navigate on wikipedia.org', steps: 6, website: 'wikipedia.org' },
  ]

  // Check which template files actually exist
  return templates.map(t => ({
    ...t,
    available: fs.existsSync(path.join(TEMPLATES_DIR, `${t.id}.csv`))
  }))
}

/**
 * Validate CSV format
 */
export function validateCSVFormat(csvContent) {
  const lines = csvContent.trim().split('\n')

  if (lines.length < 2) {
    return {
      valid: false,
      error: 'CSV must have a header and at least one data row'
    }
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const requiredHeaders = ['stepnumber', 'type', 'description']

  const hasRequired = requiredHeaders.some((req) => headers.includes(req))

  if (!hasRequired) {
    return {
      valid: false,
      error: `CSV must include at least one of: ${requiredHeaders.join(', ')}`
    }
  }

  return { valid: true }
}

/**
 * Convert scenario to CSV format
 */
export async function exportScenarioToCSV(scenarioId, userId) {
  try {
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      include: { testSteps: true }
    })

    if (!scenario || scenario.userId !== userId) {
      throw new Error('Scenario not found or unauthorized')
    }

    // Generate CSV
    let csv = 'stepNumber,type,description,selector,value\n'

    for (const step of scenario.testSteps) {
      const row = [
        step.stepNumber,
        step.type,
        `"${step.description}"`, // Wrap in quotes for safety
        step.selector || '',
        step.value || ''
      ]
      csv += row.join(',') + '\n'
    }

    return csv
  } catch (error) {
    throw new Error(`Failed to export scenario: ${error.message}`)
  }
}

/**
 * Bulk import multiple scenarios from file
 */
export async function bulkImportScenarios(filePath, userId, options = {}) {
  try {
    const results = {
      successful: 0,
      failed: 0,
      scenarios: [],
      errors: []
    }

    // For CSV multi-scenario format, parse and create each
    // This is a simplification - real implementation would handle more formats
    const content = fs.readFileSync(filePath, 'utf-8')
    const validation = validateCSVFormat(content)

    if (!validation.valid) {
      throw new Error(validation.error)
    }

    // Parse and import
    const importResult = await importScenarioFromCSV(filePath, userId, options)
    results.successful = 1
    results.scenarios.push(importResult.scenario)

    return results
  } catch (error) {
    throw new Error(`Failed to bulk import: ${error.message}`)
  }
}
