import fs from 'fs'
import path from 'path'
import { prisma } from '../lib/prisma.js'
import { compareImages } from '../utils/imageDiff.js'

const VISUAL_DIR = path.resolve('./uploads/visual')
const BASELINE_DIR = path.join(VISUAL_DIR, 'baselines')
const CURRENT_DIR = path.join(VISUAL_DIR, 'current')
const DIFF_DIR = path.join(VISUAL_DIR, 'diff')

function ensureDirs() {
  for (const dir of [VISUAL_DIR, BASELINE_DIR, CURRENT_DIR, DIFF_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  }
}

function toPublicUrl(absPath) {
  const normalized = absPath.replace(/\\/g, '/')
  const idx = normalized.indexOf('/uploads/visual/')
  if (idx >= 0) {
    return `/api/visual/${normalized.slice(idx + '/uploads/visual/'.length)}`
  }
  return null
}

async function assertScenario(userId, scenarioId) {
  const scenario = await prisma.scenario.findFirst({ where: { id: scenarioId, userId } })
  if (!scenario) {
    throw Object.assign(new Error('Scenario not found'), { status: 404 })
  }
  return scenario
}

export async function handleStepScreenshot({
  userId,
  scenarioId,
  executionId,
  stepNumber,
  browser,
  screenshotPath,
  capture = false,
  compare = false,
  threshold = 0.1
}) {
  if (!capture && !compare) return null
  if (!screenshotPath || !fs.existsSync(screenshotPath)) return null

  ensureDirs()
  const browserKey = browser || 'chromium'

  if (capture) {
    const destName = `${scenarioId}_${browserKey}_step_${stepNumber}.png`
    const destPath = path.join(BASELINE_DIR, destName)
    fs.copyFileSync(screenshotPath, destPath)

    const { width, height } = await getImageSize(destPath)

    await prisma.visualBaseline.upsert({
      where: {
        scenarioId_stepNumber_browser: {
          scenarioId,
          stepNumber,
          browser: browserKey
        }
      },
      create: {
        userId,
        scenarioId,
        stepNumber,
        browser: browserKey,
        imagePath: destPath,
        width,
        height
      },
      update: {
        imagePath: destPath,
        width,
        height
      }
    })

    return { mode: 'capture', stepNumber, baselinePath: toPublicUrl(destPath) }
  }

  if (compare) {
    const baseline = await prisma.visualBaseline.findUnique({
      where: {
        scenarioId_stepNumber_browser: {
          scenarioId,
          stepNumber,
          browser: browserKey
        }
      }
    })

    const currentName = `${executionId}_step_${stepNumber}.png`
    const currentPath = path.join(CURRENT_DIR, currentName)
    fs.copyFileSync(screenshotPath, currentPath)

    if (!baseline) {
      const record = await prisma.visualComparison.create({
        data: {
          userId,
          scenarioId,
          executionId,
          stepNumber,
          browser: browserKey,
          baselinePath: '',
          currentPath,
          status: 'MISSING_BASELINE',
          threshold,
          diffPercent: 100
        }
      })
      return {
        mode: 'compare',
        stepNumber,
        status: 'MISSING_BASELINE',
        comparisonId: record.id,
        currentUrl: toPublicUrl(currentPath)
      }
    }

    const diffName = `${executionId}_step_${stepNumber}_diff.png`
    const diffPath = path.join(DIFF_DIR, diffName)
    const result = compareImages(baseline.imagePath, currentPath, diffPath)

    const status =
      !result.compared
        ? 'ERROR'
        : result.diffPercent <= threshold
          ? 'PASSED'
          : 'FAILED'

    const record = await prisma.visualComparison.create({
      data: {
        userId,
        scenarioId,
        executionId,
        stepNumber,
        browser: browserKey,
        baselinePath: baseline.imagePath,
        currentPath,
        diffPath: result.diffPath || null,
        diffPercent: result.diffPercent ?? 0,
        diffPixels: result.diffPixels ?? 0,
        totalPixels: result.totalPixels ?? 0,
        status,
        threshold
      }
    })

    return {
      mode: 'compare',
      stepNumber,
      status,
      diffPercent: result.diffPercent,
      comparisonId: record.id,
      baselineUrl: toPublicUrl(baseline.imagePath),
      currentUrl: toPublicUrl(currentPath),
      diffUrl: result.diffPath ? toPublicUrl(diffPath) : null
    }
  }

  return null
}

async function getImageSize(filePath) {
  try {
    const { PNG } = await import('pngjs')
    const img = PNG.sync.read(fs.readFileSync(filePath))
    return { width: img.width, height: img.height }
  } catch {
    return { width: null, height: null }
  }
}

export async function captureBaselines(userId, scenarioId, options = {}) {
  await assertScenario(userId, scenarioId)
  const { executionService } = await import('./executionService.js')
  const result = await executionService.executeScenario(userId, scenarioId, {
    headless: options.headless !== false,
    browser: options.browser || 'chromium',
    environmentId: options.environmentId || null,
    visualRegressionCapture: true
  })
  const baselines = await listBaselines(userId, scenarioId)
  return { execution: result.execution, baselines }
}

export async function runVisualRegression(userId, scenarioId, options = {}) {
  await assertScenario(userId, scenarioId)
  const threshold = options.threshold ?? 0.1
  const { executionService } = await import('./executionService.js')
  const result = await executionService.executeScenario(userId, scenarioId, {
    headless: options.headless !== false,
    browser: options.browser || 'chromium',
    environmentId: options.environmentId || null,
    visualRegression: true,
    visualThreshold: threshold
  })

  const comparisons = await prisma.visualComparison.findMany({
    where: { executionId: result.execution.id },
    orderBy: { stepNumber: 'asc' }
  })

  const failed = comparisons.filter((c) => c.status === 'FAILED' || c.status === 'MISSING_BASELINE')
  const passed = comparisons.filter((c) => c.status === 'PASSED')

  return {
    execution: result.execution,
    summary: {
      total: comparisons.length,
      passed: passed.length,
      failed: failed.length,
      threshold
    },
    comparisons: comparisons.map(formatComparison)
  }
}

function formatComparison(c) {
  return {
    id: c.id,
    scenarioId: c.scenarioId,
    executionId: c.executionId,
    stepNumber: c.stepNumber,
    browser: c.browser,
    status: c.status,
    diffPercent: c.diffPercent,
    diffPixels: c.diffPixels,
    totalPixels: c.totalPixels,
    threshold: c.threshold,
    baselineUrl: c.baselinePath ? toPublicUrl(c.baselinePath) : null,
    currentUrl: c.currentPath ? toPublicUrl(c.currentPath) : null,
    diffUrl: c.diffPath ? toPublicUrl(c.diffPath) : null,
    createdAt: c.createdAt
  }
}

export async function listBaselines(userId, scenarioId = null) {
  const where = { userId, ...(scenarioId ? { scenarioId } : {}) }
  const rows = await prisma.visualBaseline.findMany({
    where,
    include: { scenario: { select: { id: true, name: true } } },
    orderBy: [{ scenarioId: 'asc' }, { stepNumber: 'asc' }]
  })
  return rows.map((b) => ({
    id: b.id,
    scenarioId: b.scenarioId,
    scenarioName: b.scenario.name,
    stepNumber: b.stepNumber,
    browser: b.browser,
    width: b.width,
    height: b.height,
    imageUrl: toPublicUrl(b.imagePath),
    updatedAt: b.updatedAt
  }))
}

export async function listComparisons(userId, { scenarioId, limit = 50, status } = {}) {
  const where = {
    userId,
    ...(scenarioId ? { scenarioId } : {}),
    ...(status ? { status } : {})
  }
  const rows = await prisma.visualComparison.findMany({
    where,
    include: { scenario: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit
  })
  return rows.map((c) => ({
    ...formatComparison(c),
    scenarioName: c.scenario.name
  }))
}

export async function approveComparison(userId, comparisonId) {
  const comparison = await prisma.visualComparison.findFirst({
    where: { id: comparisonId, userId }
  })
  if (!comparison) {
    throw Object.assign(new Error('Comparison not found'), { status: 404 })
  }
  if (!comparison.currentPath || !fs.existsSync(comparison.currentPath)) {
    throw Object.assign(new Error('Current screenshot not found'), { status: 400 })
  }

  ensureDirs()
  const destName = `${comparison.scenarioId}_${comparison.browser}_step_${comparison.stepNumber}.png`
  const destPath = path.join(BASELINE_DIR, destName)
  fs.copyFileSync(comparison.currentPath, destPath)

  const { width, height } = await getImageSize(destPath)

  await prisma.visualBaseline.upsert({
    where: {
      scenarioId_stepNumber_browser: {
        scenarioId: comparison.scenarioId,
        stepNumber: comparison.stepNumber,
        browser: comparison.browser
      }
    },
    create: {
      userId,
      scenarioId: comparison.scenarioId,
      stepNumber: comparison.stepNumber,
      browser: comparison.browser,
      imagePath: destPath,
      width,
      height
    },
    update: { imagePath: destPath, width, height }
  })

  const updated = await prisma.visualComparison.update({
    where: { id: comparisonId },
    data: { status: 'APPROVED', baselinePath: destPath }
  })

  return formatComparison(updated)
}

export async function deleteBaseline(userId, baselineId) {
  const baseline = await prisma.visualBaseline.findFirst({
    where: { id: baselineId, userId }
  })
  if (!baseline) {
    throw Object.assign(new Error('Baseline not found'), { status: 404 })
  }
  if (fs.existsSync(baseline.imagePath)) {
    try { fs.unlinkSync(baseline.imagePath) } catch { /* ignore */ }
  }
  await prisma.visualBaseline.delete({ where: { id: baselineId } })
  return { success: true }
}
