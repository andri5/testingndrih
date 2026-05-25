/**
 * Database Performance Tests - Phase 2.5
 * Tests for query performance, index effectiveness, and slow queries
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('Database Performance Tests', () => {
  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Query Performance Benchmarks', () => {
    test('should retrieve single user by ID quickly (< 100ms)', async () => {
      // Create test user
      const user = await prisma.user.create({
        data: {
          email: `perf-single-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Performance User'
        }
      })

      // Measure query time
      const start = performance.now()
      const retrieved = await prisma.user.findUnique({
        where: { id: user.id }
      })
      const duration = performance.now() - start

      expect(retrieved.id).toBe(user.id)
      expect(duration).toBeLessThan(100)

      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should retrieve user by email index quickly (< 150ms)', async () => {
      const testEmail = `perf-email-${Date.now()}@test.local`

      const user = await prisma.user.create({
        data: {
          email: testEmail,
          password: 'hashed_password',
          name: 'Email Index User'
        }
      })

      const start = performance.now()
      const retrieved = await prisma.user.findUnique({
        where: { email: testEmail }
      })
      const duration = performance.now() - start

      expect(retrieved.id).toBe(user.id)
      expect(duration).toBeLessThan(150)

      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should list scenarios quickly (< 200ms)', async () => {
      const user = await prisma.user.create({
        data: {
          email: `perf-list-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'List Performance User'
        }
      })

      // Create multiple scenarios
      for (let i = 0; i < 10; i++) {
        await prisma.testScenario.create({
          data: {
            name: `Scenario ${i}`,
            description: 'Test scenario',
            userId: user.id,
            steps: { create: [] }
          }
        })
      }

      const start = performance.now()
      const scenarios = await prisma.testScenario.findMany({
        where: { userId: user.id }
      })
      const duration = performance.now() - start

      expect(scenarios.length).toBe(10)
      expect(duration).toBeLessThan(200)

      // Cleanup
      await prisma.testScenario.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should search scenarios by name quickly', async () => {
      const user = await prisma.user.create({
        data: {
          email: `perf-search-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Search Performance User'
        }
      })

      // Create scenarios
      for (let i = 0; i < 20; i++) {
        await prisma.testScenario.create({
          data: {
            name: i % 2 === 0 ? 'Search Test' : 'Other Scenario',
            description: 'Test',
            userId: user.id,
            steps: { create: [] }
          }
        })
      }

      const start = performance.now()
      const found = await prisma.testScenario.findMany({
        where: {
          userId: user.id,
          name: {
            contains: 'Search'
          }
        }
      })
      const duration = performance.now() - start

      expect(found.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(300)

      // Cleanup
      await prisma.testScenario.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should retrieve execution history quickly', async () => {
      const user = await prisma.user.create({
        data: {
          email: `perf-exec-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Execution History User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'History Scenario',
          description: 'Test',
          userId: user.id,
          steps: { create: [] }
        }
      })

      // Create multiple executions
      for (let i = 0; i < 15; i++) {
        await prisma.testExecution.create({
          data: {
            scenarioId: scenario.id,
            userId: user.id,
            status: 'COMPLETED',
            successRate: Math.random() * 100,
            browser: ['chromium', 'firefox', 'webkit'][i % 3]
          }
        })
      }

      const start = performance.now()
      const executions = await prisma.testExecution.findMany({
        where: { scenarioId: scenario.id },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
      const duration = performance.now() - start

      expect(executions.length).toBe(10)
      expect(duration).toBeLessThan(250)

      // Cleanup
      await prisma.testExecution.deleteMany({ where: { scenarioId: scenario.id } })
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('Index Effectiveness', () => {
    test('should use index for userId lookups', async () => {
      const user = await prisma.user.create({
        data: {
          email: `index-user-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Index Test User'
        }
      })

      // Create multiple scenarios
      for (let i = 0; i < 50; i++) {
        await prisma.testScenario.create({
          data: {
            name: `Index Scenario ${i}`,
            description: 'Test',
            userId: user.id,
            steps: { create: [] }
          }
        })
      }

      // Query by userId (should use index)
      const start = performance.now()
      const scenarios = await prisma.testScenario.findMany({
        where: { userId: user.id }
      })
      const duration = performance.now() - start

      expect(scenarios.length).toBe(50)
      // Should be reasonably fast due to index
      expect(duration).toBeLessThan(500)

      // Cleanup
      await prisma.testScenario.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should use composite index for scenario and execution', async () => {
      const user = await prisma.user.create({
        data: {
          email: `composite-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Composite Index User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Composite Scenario',
          description: 'Test',
          userId: user.id,
          steps: { create: [] }
        }
      })

      // Create multiple executions
      for (let i = 0; i < 30; i++) {
        await prisma.testExecution.create({
          data: {
            scenarioId: scenario.id,
            userId: user.id,
            status: 'COMPLETED',
            successRate: Math.random() * 100,
            browser: 'chromium'
          }
        })
      }

      // Query by both scenarioId and userId
      const start = performance.now()
      const executions = await prisma.testExecution.findMany({
        where: {
          scenarioId: scenario.id,
          userId: user.id
        }
      })
      const duration = performance.now() - start

      expect(executions.length).toBe(30)
      expect(duration).toBeLessThan(300)

      // Cleanup
      await prisma.testExecution.deleteMany({ where: { scenarioId: scenario.id } })
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should efficiently sort by createdAt with index', async () => {
      const user = await prisma.user.create({
        data: {
          email: `sort-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Sort User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Sort Scenario',
          description: 'Test',
          userId: user.id,
          steps: { create: [] }
        }
      })

      // Create executions with delays
      for (let i = 0; i < 20; i++) {
        await prisma.testExecution.create({
          data: {
            scenarioId: scenario.id,
            userId: user.id,
            status: 'COMPLETED',
            successRate: Math.random() * 100,
            browser: 'chromium'
          }
        })
      }

      // Sort by createdAt descending
      const start = performance.now()
      const executions = await prisma.testExecution.findMany({
        where: { scenarioId: scenario.id },
        orderBy: { createdAt: 'desc' }
      })
      const duration = performance.now() - start

      expect(executions.length).toBe(20)
      expect(duration).toBeLessThan(300)

      // Verify sorted correctly
      for (let i = 0; i < executions.length - 1; i++) {
        expect(executions[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          executions[i + 1].createdAt.getTime()
        )
      }

      // Cleanup
      await prisma.testExecution.deleteMany({ where: { scenarioId: scenario.id } })
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('Batch Operations Performance', () => {
    test('should create multiple records efficiently', async () => {
      const user = await prisma.user.create({
        data: {
          email: `batch-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Batch User'
        }
      })

      const start = performance.now()

      // Create 25 scenarios
      const scenarios = await Promise.all(
        Array.from({ length: 25 }).map((_, i) =>
          prisma.testScenario.create({
            data: {
              name: `Batch Scenario ${i}`,
              description: 'Batch test',
              userId: user.id,
              steps: { create: [] }
            }
          })
        )
      )

      const duration = performance.now() - start

      expect(scenarios.length).toBe(25)
      expect(duration).toBeLessThan(2000) // 2 seconds for 25 records

      // Cleanup
      await prisma.testScenario.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should delete multiple records efficiently', async () => {
      const user = await prisma.user.create({
        data: {
          email: `batch-delete-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Batch Delete User'
        }
      })

      // Create scenarios
      for (let i = 0; i < 20; i++) {
        await prisma.testScenario.create({
          data: {
            name: `Delete Scenario ${i}`,
            description: 'To delete',
            userId: user.id,
            steps: { create: [] }
          }
        })
      }

      const start = performance.now()
      await prisma.testScenario.deleteMany({
        where: { userId: user.id }
      })
      const duration = performance.now() - start

      expect(duration).toBeLessThan(1000)

      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('Query Optimization', () => {
    test('should use pagination efficiently', async () => {
      const user = await prisma.user.create({
        data: {
          email: `pagination-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Pagination User'
        }
      })

      // Create many scenarios
      for (let i = 0; i < 100; i++) {
        await prisma.testScenario.create({
          data: {
            name: `Pagination Scenario ${i}`,
            description: 'Test',
            userId: user.id,
            steps: { create: [] }
          }
        })
      }

      // Test pagination
      const pageSize = 10
      const start = performance.now()

      const page1 = await prisma.testScenario.findMany({
        where: { userId: user.id },
        skip: 0,
        take: pageSize
      })

      const page2 = await prisma.testScenario.findMany({
        where: { userId: user.id },
        skip: pageSize,
        take: pageSize
      })

      const duration = performance.now() - start

      expect(page1.length).toBe(10)
      expect(page2.length).toBe(10)
      // Pagination should be fast
      expect(duration).toBeLessThan(500)

      // Cleanup
      await prisma.testScenario.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should use select to reduce payload size', async () => {
      const user = await prisma.user.create({
        data: {
          email: `select-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Select User'
        }
      })

      const scenario = await prisma.testScenario.create({
        data: {
          name: 'Select Scenario',
          description: 'Long description ' + 'x'.repeat(1000),
          userId: user.id,
          steps: { create: [] }
        }
      })

      // Query with select (smaller payload)
      const start1 = performance.now()
      const minimal = await prisma.testScenario.findMany({
        where: { userId: user.id },
        select: { id: true, name: true }
      })
      const duration1 = performance.now() - start1

      // Query without select (full payload)
      const start2 = performance.now()
      const full = await prisma.testScenario.findMany({
        where: { userId: user.id }
      })
      const duration2 = performance.now() - start2

      expect(minimal.length).toBe(full.length)
      // Select should be faster or similar
      expect(duration1).toBeLessThanOrEqual(duration2 + 50)

      // Cleanup
      await prisma.testScenario.delete({ where: { id: scenario.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })

    test('should use count for aggregate queries', async () => {
      const user = await prisma.user.create({
        data: {
          email: `count-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Count User'
        }
      })

      // Create scenarios
      for (let i = 0; i < 50; i++) {
        await prisma.testScenario.create({
          data: {
            name: `Count Scenario ${i}`,
            description: 'Test',
            userId: user.id,
            steps: { create: [] }
          }
        })
      }

      const start = performance.now()
      const count = await prisma.testScenario.count({
        where: { userId: user.id }
      })
      const duration = performance.now() - start

      expect(count).toBe(50)
      // Count should be very fast
      expect(duration).toBeLessThan(200)

      // Cleanup
      await prisma.testScenario.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })

  describe('Connection Pool Performance', () => {
    test('should handle concurrent queries efficiently', async () => {
      const user = await prisma.user.create({
        data: {
          email: `concurrent-${Date.now()}@test.local`,
          password: 'hashed_password',
          name: 'Concurrent User'
        }
      })

      const scenarios = await Promise.all(
        Array.from({ length: 10 }).map((_, i) =>
          prisma.testScenario.create({
            data: {
              name: `Concurrent Scenario ${i}`,
              description: 'Test',
              userId: user.id,
              steps: { create: [] }
            }
          })
        )
      )

      const start = performance.now()

      // Run multiple concurrent queries
      const results = await Promise.all(
        scenarios.map(scenario =>
          prisma.testScenario.findUnique({
            where: { id: scenario.id }
          })
        )
      )

      const duration = performance.now() - start

      expect(results.length).toBe(10)
      expect(duration).toBeLessThan(500)

      // Cleanup
      await prisma.testScenario.deleteMany({ where: { userId: user.id } })
      await prisma.user.delete({ where: { id: user.id } })
    })
  })
})
