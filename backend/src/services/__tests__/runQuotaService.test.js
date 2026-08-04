import { beginUserRun, endUserRun, getActiveRunCount, getMaxConcurrentRuns } from '../runQuotaService.js'

describe('runQuotaService', () => {
  const prev = process.env.MAX_CONCURRENT_RUNS_PER_USER

  afterEach(() => {
    if (prev === undefined) delete process.env.MAX_CONCURRENT_RUNS_PER_USER
    else process.env.MAX_CONCURRENT_RUNS_PER_USER = prev
    while (getActiveRunCount('u1') > 0) endUserRun('u1')
  })

  test('tracks concurrent runs and releases', () => {
    process.env.MAX_CONCURRENT_RUNS_PER_USER = '2'
    const release = beginUserRun('u1')
    expect(getActiveRunCount('u1')).toBe(1)
    release()
    expect(getActiveRunCount('u1')).toBe(0)
  })

  test('throws when over quota', () => {
    process.env.MAX_CONCURRENT_RUNS_PER_USER = '1'
    beginUserRun('u1')
    expect(() => beginUserRun('u1')).toThrow(/Batas run paralel/)
    endUserRun('u1')
  })

  test('getMaxConcurrentRuns defaults', () => {
    delete process.env.MAX_CONCURRENT_RUNS_PER_USER
    expect(getMaxConcurrentRuns()).toBe(2)
  })
})
