// Jest setup file - Configure Prisma mocks for all tests

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true })
  })
)

// Mock prisma module at the lib level
jest.mock('./src/lib/prisma.js', () => {
  // Create individual mock functions that resolve to test data
  const createMock = jest.fn((args) => {
    return Promise.resolve({
      id: 'test-id-' + Date.now(),
      ...args.data
    })
  })

  const findManyMock = jest.fn(() => {
    return Promise.resolve([
      { id: '1', name: 'Test Item 1' },
      { id: '2', name: 'Test Item 2' }
    ])
  })

  const findUniqueMock = jest.fn(({ where }) => {
    return Promise.resolve({
      id: where.id || 'test-id',
      name: 'Test Item'
    })
  })

  const findFirstMock = jest.fn(() => {
    return Promise.resolve({
      id: 'test-id',
      name: 'Test Item'
    })
  })

  const updateMock = jest.fn(({ data, where }) => {
    return Promise.resolve({
      id: where.id,
      ...data
    })
  })

  const updateManyMock = jest.fn(() => {
    return Promise.resolve({ count: 2 })
  })

  const deleteMock = jest.fn(({ where }) => {
    return Promise.resolve({ id: where.id })
  })

  const deletesManyMock = jest.fn(() => {
    return Promise.resolve({ count: 1 })
  })

  const countMock = jest.fn(() => {
    return Promise.resolve(2)
  })

  const createManyMock = jest.fn(() => {
    return Promise.resolve({ count: 2 })
  })

  return {
    prisma: {
      scenario: {
        create: createMock,
        findMany: findManyMock,
        findUnique: findUniqueMock,
        findFirst: findFirstMock,
        update: updateMock,
        delete: deleteMock,
        count: countMock
      },
      execution: {
        create: jest.fn(() => Promise.resolve({ id: 'exec-1', status: 'PENDING' })),
        findMany: jest.fn(() => Promise.resolve([{ id: 'exec-1', status: 'PASSED' }])),
        findUnique: jest.fn(() => Promise.resolve({ id: 'exec-1', status: 'PASSED' })),
        findFirst: jest.fn(() => Promise.resolve({ id: 'exec-1', status: 'PASSED' })),
        update: jest.fn((args) => Promise.resolve({ id: args.where.id, ...args.data })),
        updateMany: updateManyMock,
        count: countMock
      },
      stepResult: {
        create: jest.fn(() => Promise.resolve({ id: 'sr-1', passed: true })),
        updateMany: jest.fn(() => Promise.resolve({ count: 1 }))
      },
      testStep: {
        deleteMany: jest.fn(() => Promise.resolve({ count: 1 })),
        findMany: jest.fn(() => Promise.resolve([])),
        create: jest.fn(() => Promise.resolve({ id: 'step-1' }))
      },
      qaseIntegration: {
        findUnique: jest.fn(() => Promise.resolve({ id: 'qi-1', connected: true })),
        create: jest.fn(() => Promise.resolve({ id: 'qi-1', connected: true })),
        update: jest.fn(() => Promise.resolve({ id: 'qi-1', connected: true })),
        deleteMany: jest.fn(() => Promise.resolve({ count: 1 }))
      },
      qaseTestCase: {
        createMany: jest.fn(() => Promise.resolve({ count: 2 })),
        deleteMany: jest.fn(() => Promise.resolve({ count: 2 })),
        findMany: jest.fn(() => Promise.resolve([{ id: 'qtc-1' }])),
        count: jest.fn(() => Promise.resolve(1)),
        upsert: jest.fn((args) => Promise.resolve({ id: 'qtc-1', ...args.create }))
      },
      user: {
        create: jest.fn((args) => Promise.resolve({ id: 'user-1', ...args.data })),
        findUnique: jest.fn(() => Promise.resolve(null)),
        findMany: jest.fn(() => Promise.resolve([])),
        update: jest.fn((args) => Promise.resolve({ id: args.where.id, ...args.data })),
        delete: jest.fn(() => Promise.resolve({ id: 'user-1' })),
        count: countMock
      }
    }
  }
}, { virtual: true })

// Optional: Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks()
})
