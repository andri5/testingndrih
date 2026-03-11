import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

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
 * Import from JSON template file
 */
export async function importScenarioFromTemplate(templateId, userId, scenarioName = null) {
  try {
    // In real scenario, this would load from file system or template storage
    // For now, we'll create a basic import
    const scenario = await prisma.scenario.create({
      data: {
        name: scenarioName || `Template Import - ${templateId}`,
        description: `Imported from template ${templateId}`,
        url: 'https://example.com',
        userId,
        steps: 0
      }
    })

    return scenario
  } catch (error) {
    throw new Error(`Failed to import from template: ${error.message}`)
  }
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
