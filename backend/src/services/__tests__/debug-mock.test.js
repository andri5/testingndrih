import { createScenario } from '../scenarioService'

jest.mock('../../lib/prisma.js')

import { prisma } from '../../lib/prisma.js'

describe('Debug Mock', () => {
  it('should show what prisma is', () => {
    console.log('prisma:', prisma)
    console.log('prisma.scenario:', prisma.scenario)
    expect(prisma).toBeDefined()
  })

  it('should allow mocking', () => {
    // Manually set up the mock
    prisma.scenario = {
      create: jest.fn().mockResolvedValue({
        id: 'test-id',
        name: 'Test'
      })
    }

    console.log('prisma.scenario.create:', prisma.scenario.create)
    expect(prisma.scenario.create).toBeDefined()
  })

  it('should call mocked function', async () => {
    prisma.scenario = {
      create: jest.fn().mockResolvedValue({
        id: 'test-id',
        name: 'Test Scenario'
      })
    }

    const result = await prisma.scenario.create({ data: {} })
    console.log('Result:', result)

    expect(result).toEqual({ id: 'test-id', name: 'Test Scenario' })
    expect(prisma.scenario.create).toHaveBeenCalled()
  })

  it('should work with actual service', async () => {
    prisma.scenario = {
      create: jest.fn().mockResolvedValue({
        id: 'test-id',
        name: 'Test Scenario',
        description: 'A test',
        url: 'https://example.com',
        userId: 'user-123',
        steps: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    const result = await createScenario('user-123', {
      name: 'Test Scenario',
      description: 'A test',
      url: 'https://example.com'
    })

    console.log('Service result:', result)
    expect(result).toBeDefined()
    expect(result.id).toBe('test-id')
  })
})
