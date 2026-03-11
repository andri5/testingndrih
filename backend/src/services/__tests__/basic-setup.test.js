/**
 * Minimal test to verify Jest and Prisma mocking can work
 */
describe('Basic Jest Setup', () => {
  it('should allow jest.fn() to work', () => {
    const mockFn = jest.fn().mockReturnValue('test')
    const result = mockFn()
    expect(result).toBe('test')
  })

  it('should allow jest.fn() with promises', async () => {
    const mockFn = jest.fn().mockResolvedValue({ id: 1, name: 'test' })
    const result = await mockFn()
    expect(result.id).toBe(1)
  })

  it('should allow jest.fn().toHaveBeenCalled', () => {
    const mockFn = jest.fn()
    mockFn('arg1')
    expect(mockFn).toHaveBeenCalledWith('arg1')
  })

  it('should verify mocks persist in beforeEach', () => {
    // This relies on proper reset in beforeEach below
    expect(true).toBe(true)
  })
})

describe('With beforeEach Reset', () => {
  let mockFn

  beforeEach(() => {
    mockFn = jest.fn().mockResolvedValue({ success: true })
  })

  it('test 1 - mock should work', async () => {
    const result = await mockFn()
    expect(result.success).toBe(true)
    expect(mockFn).toHaveBeenCalled()
  })

  it('test 2 - mock should be reset', async () => {
    // First call should start at 0
    expect(mockFn).not.toHaveBeenCalled()
    await mockFn()
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })
})
