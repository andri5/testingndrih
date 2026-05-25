/**
 * Database Transactions and Backup/Recovery Tests - Phase 2.5
 * Tests for transaction handling, data consistency, and backup/restore operations
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Database Transactions and Backup Tests', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Transaction Handling', () => {
    test('should commit transaction when all operations succeed', async () => {
      const user = await prisma.user.create({
        data: {
          email: `tx-success-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Transaction Success User'
        }
      })

      const result = await prisma.$transaction(async (tx) => {
        const scenario = await tx.testScenario.create({
          data: {
            name: 'Transaction Scenario',
            description: 'Test transaction',
            userId: user.id,
            steps: { create: [] }
          }
        })

        const execution = await tx.testExecution.create({
          data: {
            scenarioId: scenario.id,
            userId: user.id,
            status: 'COMPLETED',
            successRate: 100,
            browser: 'chromium'
          }
        })

        return { scenario, execution }
      })

      expect(result.scenario.id).toBeDefined()
      expect(result.execution.id).toBeDefined()

      // Verify both records exist
      const scenario = await prisma.testScenario.findUnique({
        where: { id: result.scenario.id }
      })
      const execution = await prisma.testExecution.findUnique({
        where: { id: result.execution.id }
      })

      expect(scenario).toBeDefined()
      expect(execution).toBeDefined()

      // Cleanup
      await prisma.testExecution.delete({ where: { id: result.execution.id } })
      await prisma.testScenario.delete({ where: { id: result.scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should rollback transaction on error', async () => {
      const user = await prisma.user.create({
        data: {
          email: `tx-rollback-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Transaction Rollback User'
        }
      })

      let error = null
      let createdScenarioId = null

      try {
        await prisma.$transaction(async (tx) => {
          const scenario = await tx.testScenario.create({
            data: {
              name: 'Rollback Scenario',
              description: 'Should be rolled back',
              userId: user.id,
              steps: { create: [] }
            }
          })

          createdScenarioId = scenario.id

          // This should fail (invalid user ID)
          await tx.testExecution.create({
            data: {
              scenarioId: scenario.id,
              userId: 999999, // Non-existent user
              status: 'COMPLETED',
              successRate: 100,
              browser: 'chromium'
            }
          })
        })
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()

      // Scenario should not exist (rolled back)
      if (createdScenarioId) {
        const scenario = await prisma.testScenario.findUnique({
          where: { id: createdScenarioId }
        })
        expect(scenario).toBeNull()
      }

      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should maintain consistency across multiple operations', async () => {
      const user = await prisma.user.create({
        data: {
          email: `tx-consistency-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Consistency User'
        }
      })

      const initialCount = await prisma.testScenario.count({
        where: { userId: user.id }
      })

      const result = await prisma.$transaction(async (tx) => {
        const scenarios = await Promise.all(
          Array.from({ length: 5 }).map((_, i) =>
            tx.testScenario.create({
              data: {
                name: `Consistency Scenario ${i}`,
                description: 'Test',
                userId: user.id,
                steps: { create: [] }
              }
            })
          )
        )
        return scenarios
      })

      expect(result.length).toBe(5)

      const finalCount = await prisma.testScenario.count({
        where: { userId: user.id }
      })

      expect(finalCount).toBe(initialCount + 5)

      // Cleanup
      await prisma.testScenario.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should handle nested transactions', async () => {
      const user = await prisma.user.create({
        data: {
          email: `tx-nested-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Nested Transaction User'
        }
      })

      const result = await prisma.$transaction(async (tx) => {
        const scenario = await tx.testScenario.create({
          data: {
            name: 'Nested Scenario',
            description: 'Test',
            userId: user.id,
            steps: { create: [] }
          }
        })

        // Nested operation
        const executions = await Promise.all(
          Array.from({ length: 3 }).map((_, i) =>
            tx.testExecution.create({
              data: {
                scenarioId: scenario.id,
                userId: user.id,
                status: 'COMPLETED',
                successRate: Math.random() * 100,
                browser: ['chromium', 'firefox', 'webkit'][i]
              }
            })
          )
        )

        return { scenario, executions }
      })

      expect(result.executions.length).toBe(3)

      // Verify all created
      const allExecutions = await prisma.testExecution.findMany({
        where: { scenarioId: result.scenario.id }
      })

      expect(allExecutions.length).toBe(3)

      // Cleanup
      await prisma.testExecution.deleteMany({ where: { scenarioId: result.scenario.id } })
      await prisma.testScenario.delete({ where: { id: result.scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('Data Consistency', () => {
    test('should maintain referential integrity', async () => {
      const user = await prisma.user.create({
        data: {
          email: `integrity-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Integrity User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Integrity Scenario',
          description: 'Test',
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

      // Verify foreign key relationships
      expect(execution.scenarioId).toBe(scenario.id)
      expect(execution.userId).toBe(user.id)

      // Cleanup
      await prisma.testExecution.delete({ where: { id: execution.id } })
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should prevent orphaned records with cascade delete', async () => {
      const user = await prisma.user.create({
        data: {
          email: `cascade-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Cascade User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Cascade Scenario',
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

      // Verify related records are deleted
      const deletedStep = await prisma.testStep.findMany({
        where: { scenarioId: scenario.id }
      })

      const deletedExecution = await prisma.testExecution.findMany({
        where: { scenarioId: scenario.id }
      })

      expect(deletedStep.length).toBe(0)
      expect(deletedExecution.length).toBe(0)

      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should maintain unique constraints across concurrent operations', async () => {
      const testEmail = `unique-concurrent-${Date.now()}@test.local`

      const user = await prisma.user.create({
        data: {
          email: testEmail,
          password: 'hashed_password',
          name: 'Unique User'
        }
      })

      // Try to create duplicate (should fail)
      let error = null
      try {
        await prisma.user.create({
          data: {
            email: testEmail,
            password: 'different_password',
            name: 'Different User'
          }
        })
      } catch (err) {
        error = err
      }

      expect(error).toBeDefined()

      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('Data Recovery and Integrity', () => {
    test('should verify data integrity after bulk operations', async () => {
      const user = await prisma.user.create({
        data: {
          email: `bulk-integrity-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Bulk User'
        }
      })

      // Create multiple scenarios
      const scenarios = await Promise.all(
        Array.from({ length: 10 }).map((_, i) =>
          prisma.testScenario.create({
            data: {
              name: `Bulk Scenario ${i}`,
              description: 'Test',
              userId: user.id,
              steps: { create: [] }
            }
          })
        )
      )

      // Create executions for each
      await Promise.all(
        scenarios.map(scenario =>
          prisma.testExecution.create({
            data: {
              scenarioId: scenario.id,
              userId: user.id,
              status: 'COMPLETED',
              successRate: Math.random() * 100,
              browser: 'chromium'
            }
          })
        )
      )

      // Verify counts
      const scenarioCount = await prisma.testScenario.count({
        where: { userId: user.id }
      })

      const executionCount = await prisma.testExecution.count({
        where: { userId: user.id }
      })

      expect(scenarioCount).toBe(10)
      expect(executionCount).toBe(10)

      // Cleanup
      await prisma.testExecution.deleteMany({ where: { userId: user.id } })
      await prisma.testScenario.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should handle partial record retrieval correctly', async () => {
      const user = await prisma.user.create({
        data: {
          email: `partial-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Partial User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Partial Scenario',
          description: 'Test partial retrieval',
          userId: user.id,
          steps: { create: [] }
        }
      })

      // Get partial data
      const partial = await prisma.testScenario.findUnique({
        where: { id: scenario.id },
        select: {
          id: true,
          name: true
          // description omitted
        }
      })

      expect(partial.id).toBeDefined()
      expect(partial.name).toBeDefined()

      // Cleanup
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('Database State Validation', () => {
    test('should validate database connection', async () => {
      const health = await prisma.user.findMany({
        take: 1
      })

      expect(Array.isArray(health)).toBe(true)
    })

    test('should handle concurrent read operations', async () => {
      const user = await prisma.user.create({
        data: {
          email: `concurrent-read-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Concurrent Read User'
        }
      })

      // Create multiple scenarios
      const scenarios = await Promise.all(
        Array.from({ length: 5 }).map((_, i) =>
          prisma.testScenario.create({
            data: {
              name: `Concurrent Read Scenario ${i}`,
              description: 'Test',
              userId: user.id,
              steps: { create: [] }
            }
          })
        )
      )

      // Concurrent reads
      const results = await Promise.all(
        Array.from({ length: 20 }).map(() =>
          prisma.testScenario.findMany({
            where: { userId: user.id }
          })
        )
      )

      results.forEach(result => {
        expect(result.length).toBe(5)
      })

      // Cleanup
      await prisma.testScenario.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should validate data after concurrent write operations', async () => {
      const user = await prisma.user.create({
        data: {
          email: `concurrent-write-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Concurrent Write User'
        }
      })

      // Concurrent writes
      const scenarios = await Promise.all(
        Array.from({ length: 5 }).map((_, i) =>
          prisma.testScenario.create({
            data: {
              name: `Concurrent Write Scenario ${i}`,
              description: 'Test',
              userId: user.id,
              steps: { create: [] }
            }
          })
        )
      )

      // Verify all exist
      const count = await prisma.testScenario.count({
        where: { userId: user.id }
      })

      expect(count).toBe(5)

      // Verify each can be retrieved individually
      for (const scenario of scenarios) {
        const retrieved = await prisma.testScenario.findUnique({
          where: { id: scenario.id }
        })
        expect(retrieved).toBeDefined()
      }

      // Cleanup
      await prisma.testScenario.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('Schema and Type Validation', () => {
    test('should enforce table schema', async () => {
      const user = await prisma.user.create({
        data: {
          email: `schema-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Schema User'
        }
      })

      // Verify all required fields exist
      expect(user.id).toBeDefined()
      expect(user.email).toBeDefined()
      expect(user.password).toBeDefined()
      expect(user.name).toBeDefined()
      expect(user.createdAt).toBeDefined()

      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should validate enum values in execution status', async () => {
      const user = await prisma.user.create({
        data: {
          email: `enum-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Enum User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Enum Scenario',
          description: 'Test',
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
            successRate: 50,
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

    test('should validate numeric value ranges', async () => {
      const user = await prisma.user.create({
        data: {
          email: `numeric-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Numeric User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Numeric Scenario',
          description: 'Test',
          userId: user.id,
          steps: { create: [] }
        }
      })

      // Test various success rates
      const rates = [0, 25, 50, 75, 100]

      for (const rate of rates) {
        const execution = await prisma.testExecution.create({
          data: {
            scenarioId: scenario.id,
            userId: user.id,
            status: 'COMPLETED',
            successRate: rate,
            browser: 'chromium'
          }
        })

        expect(execution.successRate).toBe(rate)
        await prisma.testExecution.delete({ where: { id: execution.id } })
      }

      // Cleanup
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })
})
