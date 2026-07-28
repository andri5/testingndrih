import {
  getBrowserLaunchOptions,
  CHROMIUM_DOCKER_ARGS,
} from '../../lib/browserLauncher.js'
import { chromium } from 'playwright'

describe('browserLauncher', () => {
  test('includes Docker-safe Chromium args', () => {
    expect(CHROMIUM_DOCKER_ARGS).toEqual(
      expect.arrayContaining(['--no-sandbox', '--disable-dev-shm-usage'])
    )
  })

  test('getBrowserLaunchOptions defaults to headless with chromium args', () => {
    const opts = getBrowserLaunchOptions(chromium, {})
    expect(opts.headless).toBe(true)
    expect(opts.args).toEqual(expect.arrayContaining(['--disable-dev-shm-usage']))
  })

  test('getBrowserLaunchOptions keeps headed when explicitly requested', () => {
    const opts = getBrowserLaunchOptions(chromium, { headless: false })
    // On CI Linux without DISPLAY this may force headless — still must include args
    expect(opts.args).toEqual(expect.arrayContaining(['--no-sandbox']))
    if (process.env.DISPLAY || process.platform !== 'linux') {
      expect(opts.headless).toBe(false)
    }
  })
})
