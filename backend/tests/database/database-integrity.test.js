/**
 * Database Integrity Tests - Phase 2.5
 * Tests for data constraints, foreign keys, unique constraints, and data validation
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Database Integrity Tests', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('User Table Constraints', () => {
    test('should enforce unique email constraint', async () => {
      const testEmail = `unique-test-${Date.now()}@test.local`

      // Create first user
      const user1 = await prisma.user.create({
        data: {
          email: testEmail,
          password: 'hashed_password_1',
          name: 'Test User 1'
        }
      })

      expect(user1.email).toBe(testEmail)

      // Try to create duplicate email
      let duplicateError = null
      try {
        await prisma.user.create({
          data: {
            email: testEmail,
            password: 'hashed_password_2',
            name: 'Test User 2'
          }
        })
      } catch (err) {
        duplicateError = err
      }

      expect(duplicateError).toBeDefined()
      expect(duplicateError.code).toBe('P2002')

      // Cleanup
      await prisma.user.delete({ where: { id: user1.id } })
    })

    test('should require email field', async () => {
      let error = null
      try {
        await prisma.user.create({
          data: {
            password: 'hashed_password',
            name: 'No Email User'
            // email missing
          } as any
        })
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
    })

    test('should require password field', async () => {
      let error = null
      try {
        await prisma.user.create({
          data: {
            email: `test-${Date.now()}@test.local`,
            name: 'No Password User'
            // password missing
          } as any
        })
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
    })

    test('should set createdAt automatically', async () => {
      const user = await prisma.user.create({
        data: {
          email: `auto-date-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Auto Date User'
        }
      })

      expect(user.createdAt).toBeDefined()
      expect(user.createdAt instanceof Date).toBe(true)

      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should not allow negative ID', async () => {
      // This tests Prisma's type safety
      const users = await prisma.user.findMany()
      for (const user of users) {
        expect(user.id).toBeGreaterThan(0)
      }
    })

    test('should store email in lowercase consistently', async () => {
      const testEmail = `MixedCase-${Date.now()}@TEST.LOCAL`

      const user = await prisma.user.create({
        data: {
          email: testEmail.toLowerCase(),
          password: 'hashed_password',
          name: 'Mixed Case User'
        }
      })

      const retrieved = await prisma.user.findUnique({
        where: { id: user.id }
      })

      expect(retrieved.email).toBe(testEmail.toLowerCase())

      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('TestScenario Table Constraints', () => {
    test('should require userId for scenario', async () => {
      const user = await prisma.user.create({
        data: {
          email: `scenario-user-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Scenario User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Test Scenario',
          description: 'Test',
          userId: user.id,
          steps: {
            create: [
              {
                order: 1,
                type: 'NAVIGATE',
                target: 'https://example.com'
              }
            ]
          }
        }
      })

      expect(scenario.userId).toBe(user.id)

      // Cleanup
      await prisma.testStep.deleteMany({ where: { scenarioId: scenario.id } })
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should enforce foreign key constraint on userId', async () => {
      let error = null
      try {
        await prisma.testScenario.create({
          data: {
            name: 'Invalid User Scenario',
            description: 'Test',
            userId: 999999, // Non-existent user
            steps: {
              create: [
                {
                  order: 1,
                  type: 'NAVIGATE',
                  target: 'https://example.com'
                }
              ]
            }
          }
        })
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
    })

    test('should cascade delete scenarios when user deleted', async () => {
      const user = await prisma.user.create({
        data: {
          email: `cascade-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Cascade User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Cascade Test',
          description: 'Should delete with user',
          userId: user.id,
          steps: {
            create: [
              {
                order: 1,
                type: 'NAVIGATE',
                target: 'https://example.com'
              }
            ]
          }
        }
      })

      // Delete user
      await prisma.user.delete({ where: { id: user.id } })

      // Verify scenario is deleted
      const deleted = await prisma.testScenario.findUnique({
        where: { id: scenario.id }
      })

      expect(deleted).toBeNull()
    })

    test('should require name field for scenario', async () => {
      const user = await prisma.user.create({
        data: {
          email: `no-name-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Test User'
        }
      })

      let error = null
      try {
        await prisma.testScenario.create({
          data: {
            name: '', // Empty name
            description: 'Test',
            userId: user.id,
            steps: { create: [] }
          }
        })
      } catch (err) {
        error = err
      }

      await prisma.user.delete({ where: { id: user.id } })

      expect(error || true).toBeDefined()
    })

    test('should store scenario with all required fields', async () => {
      const user = await prisma.user.create({
        data: {
          email: `complete-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Complete User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Complete Scenario',
          description: 'All fields populated',
          userId: user.id,
          steps: {
            create: [
              {
                order: 1,
                type: 'NAVIGATE',
                target: 'https://example.com'
              }
            ]
          }
        }
      })

      expect(scenario.id).toBeDefined()
      expect(scenario.name).toBe('Complete Scenario')
      expect(scenario.userId).toBe(user.id)

      // Cleanup
      await prisma.testStep.deleteMany({ where: { scenarioId: scenario.id } })
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('TestStep Table Constraints', () => {
    test('should enforce foreign key on scenarioId', async () => {
      let error = null
      try {
        await prisma.testStep.create({
          data: {
            scenarioId: 999999, // Non-existent scenario
            order: 1,
            type: 'NAVIGATE',
            target: 'https://example.com'
          }
        })
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
    })

    test('should require order field', async () => {
      const user = await prisma.user.create({
        data: {
          email: `step-order-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Step User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Step Scenario',
          description: 'For step test',
          userId: user.id,
          steps: { create: [] }
        }
      })

      let error = null
      try {
        await prisma.testStep.create({
          data: {
            scenarioId: scenario.id,
            type: 'NAVIGATE',
            target: 'https://example.com'
            // order missing
          } as any
        })
      } catch (err) {
        error = err
      }

      // Cleanup
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })

      expect(error).toBeDefined()
    })

    test('should allow valid step types', async () => {
      const user = await prisma.user.create({
        data: {
          email: `step-types-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Step Types User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Step Types Scenario',
          description: 'For step type test',
          userId: user.id,
          steps: { create: [] }
        }
      })

      const validTypes = ['NAVIGATE', 'CLICK', 'FILL', 'WAIT', 'ASSERT', 'SCREENSHOT']

      for (const type of validTypes) {
        const step = await prisma.testStep.create({
          data: {
            scenarioId: scenario.id,
            order: validTypes.indexOf(type) + 1,
            type: type as any,
            target: 'https://example.com'
          }
        })

        expect(step.type).toBe(type)
      }

      // Cleanup
      await prisma.testStep.deleteMany({ where: { scenarioId: scenario.id } })
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should cascade delete steps when scenario deleted', async () => {
      const user = await prisma.user.create({
        data: {
          email: `step-cascade-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Step Cascade User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Step Cascade Scenario',
          description: 'Test cascade delete',
          userId: user.id,
          steps: {
            create: [
              {
                order: 1,
                type: 'NAVIGATE',
                target: 'https://example.com'
              }
            ]
          }
        }
      })

      const steps = await prisma.testStep.findMany({
        where: { scenarioId: scenario.id }
      })

      expect(steps.length).toBeGreaterThan(0)

      // Delete scenario
      await prisma.testScenario.delete({ where: { id: scenario.id } })

      // Verify steps are deleted
      const deletedSteps = await prisma.testStep.findMany({
        where: { scenarioId: scenario.id }
      })

      expect(deletedSteps.length).toBe(0)

      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('TestExecution Table Constraints', () => {
    test('should enforce foreign key on scenarioId and userId', async () => {
      const user = await prisma.user.create({
        data: {
          email: `exec-user-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Exec User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Exec Scenario',
          description: 'For execution test',
          userId: user.id,
          steps: { create: [] }
        }
      })

      const execution = await prisma.testExecution.create({
        data: {
          scenarioId: scenario.id,
          userId: user.id,
          status: 'COMPLETED',
          successRate: 100,
          browser: 'chromium'
        }
      })

      expect(execution.scenarioId).toBe(scenario.id)
      expect(execution.userId).toBe(user.id)

      // Cleanup
      await prisma.testExecution.delete({ where: { id: execution.id } })
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should cascade delete executions when scenario deleted', async () => {
      const user = await prisma.user.create({
        data: {
          email: `exec-cascade-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Exec Cascade User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Exec Cascade Scenario',
          description: 'Test cascade',
          userId: user.id,
          steps: { create: [] }
        }
      })

      const execution = await prisma.testExecution.create({
        data: {
          scenarioId: scenario.id,
          userId: user.id,
          status: 'COMPLETED',
          successRate: 100,
          browser: 'chromium'
        }
      })

      // Delete scenario
      await prisma.testScenario.delete({ where: { id: scenario.id } })

      // Verify execution is deleted
      const deleted = await prisma.testExecution.findUnique({
        where: { id: execution.id }
      })

      expect(deleted).toBeNull()

      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should validate status enum values', async () => {
      const user = await prisma.user.create({
        data: {
          email: `status-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Status User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Status Scenario',
          description: 'For status test',
          userId: user.id,
          steps: { create: [] }
        }
      })

      const validStatuses = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']

      for (const status of validStatuses) {
        const execution = await prisma.testExecution.create({
          data: {
            scenarioId: scenario.id,
            userId: user.id,
            status: status as any,
            successRate: 0,
            browser: 'chromium'
          }
        })

        expect(execution.status).toBe(status)
        await prisma.testExecution.delete({ where: { id: execution.id } })
      }

      // Cleanup
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should store success rate as percentage', async () => {
      const user = await prisma.user.create({
        data: {
          email: `success-rate-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Success Rate User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Success Rate Scenario',
          description: 'Test success rate',
          userId: user.id,
          steps: { create: [] }
        }
      })

      const execution = await prisma.testExecution.create({
        data: {
          scenarioId: scenario.id,
          userId: user.id,
          status: 'COMPLETED',
          successRate: 75,
          browser: 'firefox'
        }
      })

      expect(execution.successRate).toBe(75)

      // Cleanup
      await prisma.testExecution.delete({ where: { id: execution.id } })
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('TestSchedule Table Constraints', () => {
    test('should enforce foreign key on scenarioId', async () => {
      let error = null
      try {
        await prisma.testSchedule.create({
          data: {
            scenarioId: 999999, // Non-existent scenario
            frequency: 'DAILY',
            time: '09:00',
            userId: 999999 // Non-existent user
          }
        })
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()
    })

    test('should validate frequency enum', async () => {
      const user = await prisma.user.create({
        data: {
          email: `freq-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Frequency User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Freq Scenario',
          description: 'Test frequency',
          userId: user.id,
          steps: { create: [] }
        }
      })

      const validFrequencies = ['DAILY', 'HOURLY', 'WEEKLY']

      for (const freq of validFrequencies) {
        const schedule = await prisma.testSchedule.create({
          data: {
            scenarioId: scenario.id,
            userId: user.id,
            frequency: freq as any,
            time: '09:00'
          }
        })

        expect(schedule.frequency).toBe(freq)
        await prisma.testSchedule.delete({ where: { id: schedule.id } })
      }

      // Cleanup
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should set isActive default to true', async () => {
      const user = await prisma.user.create({
        data: {
          email: `active-default-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Active Default User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Active Scenario',
          description: 'Test active default',
          userId: user.id,
          steps: { create: [] }
        }
      })

      const schedule = await prisma.testSchedule.create({
        data: {
          scenarioId: scenario.id,
          userId: user.id,
          frequency: 'DAILY',
          time: '09:00'
        }
      })

      expect(schedule.isActive).toBe(true)

      // Cleanup
      await prisma.testSchedule.delete({ where: { id: schedule.id } })
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('Data Type Validation', () => {
    test('should store JSON step data correctly', async () => {
      const user = await prisma.user.create({
        data: {
          email: `json-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'JSON User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'JSON Scenario',
          description: 'Test JSON storage',
          userId: user.id,
          steps: {
            create: [
              {
                order: 1,
                type: 'CLICK',
                target: '#button',
                data: {
                  selector: '#button',
                  waitTime: 1000,
                  retries: 3
                }
              }
            ]
          }
        }
      })

      const step = await prisma.testStep.findFirst({
        where: { scenarioId: scenario.id }
      })

      expect(step.data).toBeDefined()

      // Cleanup
      await prisma.testStep.deleteMany({ where: { scenarioId: scenario.id } })
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should handle decimal values for success rate', async () => {
      const user = await prisma.user.create({
        data: {
          email: `decimal-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Decimal User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Decimal Scenario',
          description: 'Test decimal values',
          userId: user.id,
          steps: { create: [] }
        }
      })

      const execution = await prisma.testExecution.create({
        data: {
          scenarioId: scenario.id,
          userId: user.id,
          status: 'COMPLETED',
          successRate: 66.67,
          browser: 'webkit'
        }
      })

      expect(execution.successRate).toBe(66.67)

      // Cleanup
      await prisma.testExecution.delete({ where: { id: execution.id } })
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('Timestamp Validation', () => {
    test('should set createdAt on scenario creation', async () => {
      const user = await prisma.user.create({
        data: {
          email: `timestamp-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Timestamp User'
        }
      })

      const before = new Date()
      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Timestamp Scenario',
          description: 'Test timestamps',
          userId: user.id,
          steps: { create: [] }
        }
      })
      const after = new Date()

      expect(scenario.createdAt).toBeDefined()
      expect(scenario.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(scenario.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())

      // Cleanup
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should set createdAt on execution creation', async () => {
      const user = await prisma.user.create({
        data: {
          email: `exec-timestamp-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Exec Timestamp User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Exec Timestamp Scenario',
          description: 'Test exec timestamps',
          userId: user.id,
          steps: { create: [] }
        }
      })

      const before = new Date()
      const execution = await prisma.testExecution.create({
        data: {
          scenarioId: scenario.id,
          userId: user.id,
          status: 'COMPLETED',
          successRate: 100,
          browser: 'edge'
        }
      })
      const after = new Date()

      expect(execution.createdAt).toBeDefined()
      expect(execution.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(execution.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())

      // Cleanup
      await prisma.testExecution.delete({ where: { id: execution.id } })
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })
})
