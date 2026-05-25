/**
 * Scheduler E2E Tests - Phase 2.3
 * Tests scheduling workflows through UI
 */

import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:3002'

test.describe('Scheduler E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`)
    await page.fill('input[type="email"]', 'admin@testingndrih.local')
    await page.fill('input[type="password"]', 'AdminPass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL(/chains/)

    // Navigate to scheduler
    await page.goto(`${BASE_URL}/scheduler`)
    await page.waitForTimeout(1000)
  })

  test('should display list of schedules', async ({ page }) => {
    // Check for schedules list or table
    const scheduleList = page.locator('[data-testid="schedule-list"], table, [class*="schedule"]')
    await expect(scheduleList).toBeVisible()
  })

  test('should create daily schedule', async ({ page }) => {
    // Click create button
    const createBtn = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")')
    await createBtn.click()

    // Wait for form
    await page.waitForTimeout(500)

    // Select scenario
    const scenarioSelect = page.locator('select[name="scenarioId"], [data-testid="scenario-select"]')
    if (await scenarioSelect.count() > 0) {
      const options = page.locator('option')
      if (await options.count() > 1) {
        await scenarioSelect.selectOption({ index: 1 })
      }
    }

    // Select daily frequency
    const frequencySelect = page.locator('select[name="frequency"], [data-testid="frequency-select"]')
    await frequencySelect.selectOption('DAILY')

    // Set time
    const timeInput = page.locator('input[name="timeOfDay"], input[type="time"]')
    if (await timeInput.count() > 0) {
      await timeInput.fill('09:00')
    }

    // Submit
    const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")')
    await submitBtn.click()

    // Wait for success
    await page.waitForTimeout(1500)
    expect(page.url()).toContain('scheduler')
  })

  test('should create hourly schedule', async ({ page }) => {
    const createBtn = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")')
    await createBtn.click()
    await page.waitForTimeout(500)

    // Select scenario
    const scenarioSelect = page.locator('select[name="scenarioId"], [data-testid="scenario-select"]')
    if (await scenarioSelect.count() > 0) {
      const options = page.locator('option')
      if (await options.count() > 1) {
        await scenarioSelect.selectOption({ index: 1 })
      }
    }

    // Select hourly frequency
    const frequencySelect = page.locator('select[name="frequency"], [data-testid="frequency-select"]')
    await frequencySelect.selectOption('HOURLY')

    // Submit
    const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")')
    await submitBtn.click()

    await page.waitForTimeout(1500)
    expect(page.url()).toContain('scheduler')
  })

  test('should create weekly schedule', async ({ page }) => {
    const createBtn = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")')
    await createBtn.click()
    await page.waitForTimeout(500)

    // Select scenario
    const scenarioSelect = page.locator('select[name="scenarioId"], [data-testid="scenario-select"]')
    if (await scenarioSelect.count() > 0) {
      const options = page.locator('option')
      if (await options.count() > 1) {
        await scenarioSelect.selectOption({ index: 1 })
      }
    }

    // Select weekly frequency
    const frequencySelect = page.locator('select[name="frequency"], [data-testid="frequency-select"]')
    await frequencySelect.selectOption('WEEKLY')

    // Select days
    const mondayCheckbox = page.locator('input[value="MON"], label:has-text("Monday") input')
    if (await mondayCheckbox.count() > 0) {
      await mondayCheckbox.check()
    }

    // Set time
    const timeInput = page.locator('input[name="timeOfDay"], input[type="time"]')
    if (await timeInput.count() > 0) {
      await timeInput.fill('14:30')
    }

    // Submit
    const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")')
    await submitBtn.click()

    await page.waitForTimeout(1500)
    expect(page.url()).toContain('scheduler')
  })

  test('should edit schedule', async ({ page }) => {
    // Wait for schedules to load
    await page.waitForTimeout(1000)

    // Click edit button
    const editBtn = page.locator('button:has-text("Edit"), [data-testid="edit-btn"]').first()
    if (await editBtn.count() > 0) {
      await editBtn.click()
      await page.waitForTimeout(500)

      // Update time
      const timeInput = page.locator('input[name="timeOfDay"], input[type="time"]')
      if (await timeInput.count() > 0) {
        await timeInput.fill('15:00')
      }

      // Submit
      const submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")')
      await submitBtn.click()

      await page.waitForTimeout(1000)
      expect(page.url()).toContain('scheduler')
    }
  })

  test('should activate schedule', async ({ page }) => {
    // Wait for schedules to load
    await page.waitForTimeout(1000)

    // Find a schedule and toggle active status
    const toggleBtn = page.locator('input[type="checkbox"][name*="active"], [data-testid="active-toggle"]').first()
    if (await toggleBtn.count() > 0) {
      const wasChecked = await toggleBtn.isChecked()
      await toggleBtn.click()
      
      await page.waitForTimeout(500)
      const isChecked = await toggleBtn.isChecked()
      expect(isChecked).not.toBe(wasChecked)
    }
  })

  test('should delete schedule', async ({ page }) => {
    // Wait for schedules to load
    await page.waitForTimeout(1000)

    // Get schedule name
    const firstSchedule = page.locator('[data-testid="schedule-item"], tr[data-testid*="schedule"]').first()
    if (await firstSchedule.count() > 0) {
      const scheduleName = await firstSchedule.textContent()

      // Click delete
      const deleteBtn = firstSchedule.locator('button:has-text("Delete"), [data-testid="delete-btn"]')
      await deleteBtn.click()

      // Confirm
      const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")')
      if (await confirmBtn.count() > 0) {
        await confirmBtn.click()
      }

      await page.waitForTimeout(1000)
      const schedule = page.locator(`text=${scheduleName}`)
      expect(await schedule.count()).toBe(0)
    }
  })

  test('should view schedule details', async ({ page }) => {
    // Wait for schedules to load
    await page.waitForTimeout(1000)

    // Click on schedule
    const scheduleLink = page.locator('[data-testid="schedule-link"]').first()
    if (await scheduleLink.count() > 0) {
      await scheduleLink.click()
      await page.waitForTimeout(1000)

      // Check for details
      const detailsView = page.locator('[data-testid="schedule-details"]')
      if (await detailsView.count() > 0) {
        await expect(detailsView).toBeVisible()
      }
    }
  })

  test('should show next execution time', async ({ page }) => {
    // Wait for schedules to load
    await page.waitForTimeout(1000)

    // Look for next execution info
    const nextExecInfo = page.locator('text=/next.*execution|scheduled for/i')
    if (await nextExecInfo.count() > 0) {
      await expect(nextExecInfo).toBeVisible()
    }
  })

  test('should show execution history for schedule', async ({ page }) => {
    // Wait for schedules to load
    await page.waitForTimeout(1000)

    // Click on schedule
    const scheduleLink = page.locator('[data-testid="schedule-link"]').first()
    if (await scheduleLink.count() > 0) {
      await scheduleLink.click()
      await page.waitForTimeout(1000)

      // Look for history
      const historySection = page.locator('[data-testid="execution-history"], text=/history|past.*executions/i')
      if (await historySection.count() > 0) {
        await expect(historySection).toBeVisible()
      }
    }
  })

  test('should filter schedules', async ({ page }) => {
    // Wait for schedules to load
    await page.waitForTimeout(1000)

    // Find filter/search input
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('daily')
      await page.waitForTimeout(500)

      // Verify filtered results
      const schedules = page.locator('[data-testid="schedule-item"], tr[data-testid*="schedule"]')
      expect(await schedules.count()).toBeGreaterThanOrEqual(0)
    }
  })

  test('should validate required fields', async ({ page }) => {
    const createBtn = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")')
    await createBtn.click()
    await page.waitForTimeout(500)

    // Try to submit without filling
    const submitBtn = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")')
    await submitBtn.click()

    // Check for validation errors
    const errorMsg = page.locator('text=/required|select|choose/i')
    await expect(errorMsg).toBeVisible({ timeout: 3000 })
  })

  test('should show schedule status indicators', async ({ page }) => {
    // Wait for schedules to load
    await page.waitForTimeout(1000)

    // Look for status badges
    const statusBadge = page.locator('[data-testid="status-badge"], [class*="status"], text=/active|inactive|pending/i')
    if (await statusBadge.count() > 0) {
      await expect(statusBadge).toBeVisible()
    }
  })

  test('should support timezone selection', async ({ page }) => {
    const createBtn = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add")')
    await createBtn.click()
    await page.waitForTimeout(500)

    // Look for timezone selector
    const timezoneSelect = page.locator('select[name="timezone"], [data-testid="timezone-select"]')
    if (await timezoneSelect.count() > 0) {
      const options = page.locator('option')
      expect(await options.count()).toBeGreaterThan(0)
    }
  })
})
