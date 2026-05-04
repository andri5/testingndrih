import XLSX from 'xlsx'
import { prisma } from '../lib/prisma.js'

/**
 * Parse Excel file and validate structure
 * Returns preview data: scenarios with their steps
 */
export async function parseExcelFile(buffer) {
  try {
    // Read Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' })

    // Check required sheets
    if (!workbook.SheetNames.includes('Scenarios') || !workbook.SheetNames.includes('TestSteps')) {
      throw new Error('Excel must have "Scenarios" and "TestSteps" sheets')
    }

    // Parse Scenarios sheet
    const scenariosData = XLSX.utils.sheet_to_json(workbook.Sheets['Scenarios'])
    const stepsData = XLSX.utils.sheet_to_json(workbook.Sheets['TestSteps'])

    // Validate and transform scenarios
    const scenarios = scenariosData.map((row, idx) => {
      if (!row['Scenario Name']) {
        throw new Error(`Row ${idx + 1} in Scenarios: "Scenario Name" is required`)
      }
      if (!row['Base URL']) {
        throw new Error(`Row ${idx + 1} in Scenarios: "Base URL" is required`)
      }

      // Validate URL format
      const url = String(row['Base URL']).trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error(`Row ${idx + 1} in Scenarios: URL must start with http:// or https://`)
      }

      return {
        name: String(row['Scenario Name']).trim(),
        description: row['Description'] ? String(row['Description']).trim() : '',
        url: url,
        // Will be added during create
        steps: []
      }
    })

    // Validate and transform test steps
    const validStepTypes = [
      'NAVIGATE', 'CLICK', 'FILL', 'SCREENSHOT', 'WAIT', 'ASSERTION',
      'API_CALL', 'HOVER', 'SCROLL', 'FILE_UPLOAD', 'DRAG', 'MOCK_ROUTE'
    ]

    stepsData.forEach((row, idx) => {
      const scenarioName = row['Scenario Name'] ? String(row['Scenario Name']).trim() : null
      if (!scenarioName) {
        throw new Error(`Row ${idx + 1} in TestSteps: "Scenario Name" is required`)
      }

      if (!row['Step #']) {
        throw new Error(`Row ${idx + 1} in TestSteps: "Step #" is required`)
      }

      const type = row['Type'] ? String(row['Type']).toUpperCase().trim() : null
      if (!type || !validStepTypes.includes(type)) {
        throw new Error(
          `Row ${idx + 1} in TestSteps: Invalid "Type" "${row['Type']}". ` +
          `Must be one of: ${validStepTypes.join(', ')}`
        )
      }

      if (!row['Description']) {
        throw new Error(`Row ${idx + 1} in TestSteps: "Description" is required`)
      }

      // Check if scenario exists in parsed scenarios
      const scenarioExists = scenarios.some(s => s.name === scenarioName)
      if (!scenarioExists) {
        throw new Error(
          `Row ${idx + 1} in TestSteps: Scenario "${scenarioName}" not found in Scenarios sheet`
        )
      }

      // Add step to scenario
      const scenario = scenarios.find(s => s.name === scenarioName)
      scenario.steps.push({
        stepNumber: parseInt(row['Step #']),
        type: type,
        description: String(row['Description']).trim(),
        selector: row['Selector'] ? String(row['Selector']).trim() : null,
        value: row['Value'] ? String(row['Value']).trim() : null
      })
    })

    // Sort steps for each scenario
    scenarios.forEach(scenario => {
      scenario.steps.sort((a, b) => a.stepNumber - b.stepNumber)
    })

    return {
      success: true,
      scenarios,
      totalScenarios: scenarios.length,
      totalSteps: stepsData.length
    }
  } catch (error) {
    throw new Error(`Excel parsing error: ${error.message}`)
  }
}

/**
 * Create scenarios and test steps from parsed data
 * Uses transaction for atomic operation
 */
export async function createScenariosFromParsedData(userId, parsedData) {
  try {
    const results = await prisma.$transaction(async (tx) => {
      const createdScenarios = []

      for (const scenarioData of parsedData.scenarios) {
        // Create scenario
        const scenario = await tx.scenario.create({
          data: {
            name: scenarioData.name,
            description: scenarioData.description,
            url: scenarioData.url,
            userId: userId,
            steps: 0
          }
        })

        const createdSteps = []

        // Create test steps
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

        // Update scenario steps count
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
      message: `Successfully created ${results.length} scenario(s)`,
      scenarios: results
    }
  } catch (error) {
    throw new Error(`Failed to create scenarios: ${error.message}`)
  }
}

/**
 * Generate template Excel file buffer
 */
export function generateTemplateExcel() {
  // Create workbook
  const workbook = XLSX.utils.book_new()

  // Sample Scenarios sheet
  const scenariosData = [
    {
      'Scenario Name': 'Login Test',
      'Description': 'Verify login functionality',
      'Base URL': 'https://app.example.com'
    },
    {
      'Scenario Name': 'Search Feature',
      'Description': 'Test search functionality',
      'Base URL': 'https://app.example.com'
    }
  ]

  const scenariosSheet = XLSX.utils.json_to_sheet(scenariosData)
  XLSX.utils.book_append_sheet(workbook, scenariosSheet, 'Scenarios')

  // Sample TestSteps sheet
  const stepsData = [
    {
      'Scenario Name': 'Login Test',
      'Step #': 1,
      'Type': 'NAVIGATE',
      'Description': 'Open login page',
      'Selector': '-',
      'Value': 'https://app.example.com/login'
    },
    {
      'Scenario Name': 'Login Test',
      'Step #': 2,
      'Type': 'FILL',
      'Description': 'Enter username',
      'Selector': '#username',
      'Value': 'testuser'
    },
    {
      'Scenario Name': 'Login Test',
      'Step #': 3,
      'Type': 'FILL',
      'Description': 'Enter password',
      'Selector': '#password',
      'Value': 'password123'
    },
    {
      'Scenario Name': 'Login Test',
      'Step #': 4,
      'Type': 'CLICK',
      'Description': 'Click login button',
      'Selector': 'button.btn-login',
      'Value': '-'
    },
    {
      'Scenario Name': 'Login Test',
      'Step #': 5,
      'Type': 'ASSERTION',
      'Description': 'Verify success message',
      'Selector': '-',
      'Value': 'Login successful'
    },
    {
      'Scenario Name': 'Search Feature',
      'Step #': 1,
      'Type': 'NAVIGATE',
      'Description': 'Open search page',
      'Selector': '-',
      'Value': 'https://app.example.com/search'
    },
    {
      'Scenario Name': 'Search Feature',
      'Step #': 2,
      'Type': 'FILL',
      'Description': 'Enter search term',
      'Selector': '#search-input',
      'Value': 'test'
    },
    {
      'Scenario Name': 'Search Feature',
      'Step #': 3,
      'Type': 'CLICK',
      'Description': 'Click search button',
      'Selector': 'button.search-btn',
      'Value': '-'
    }
  ]

  const stepsSheet = XLSX.utils.json_to_sheet(stepsData)
  XLSX.utils.book_append_sheet(workbook, stepsSheet, 'TestSteps')

  // Set column widths
  scenariosSheet['!cols'] = [
    { wch: 25 },
    { wch: 35 },
    { wch: 35 }
  ]

  stepsSheet['!cols'] = [
    { wch: 20 },
    { wch: 10 },
    { wch: 15 },
    { wch: 30 },
    { wch: 25 },
    { wch: 30 }
  ]

  // Generate buffer
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
}
