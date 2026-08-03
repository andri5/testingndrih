/**
 * Browser Launcher Helper
 * Environment-aware Playwright launch options for Docker/Linux/desktop.
 */

import { chromium, firefox, webkit } from 'playwright'
import os from 'os'

const isWindows = os.platform() === 'win32'
const isLinux = os.platform() === 'linux'

// Do NOT pass Chromium --incognito here: with Playwright launch + newContext it can
// open an extra blank window and break CDP screencast / live viewer. Isolation comes
// from browser.newContext() (ephemeral, no storageState) — Incognito-equivalent.
export const CHROMIUM_DOCKER_ARGS = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
]

/**
 * Get appropriate launch options for the environment
 */
export const getBrowserLaunchOptions = (browserType, options = {}) => {
  const { headless = true, channel = undefined } = options

  const launchOptions = {
    channel,
    headless: headless === false ? false : true,
  }

  if (browserType === chromium || browserType === 'chromium') {
    launchOptions.args = [...CHROMIUM_DOCKER_ARGS]
  }

  if (isLinux && headless === false && !process.env.DISPLAY) {
    console.log('[BROWSER] ℹ️ No DISPLAY on Linux — forcing headless')
    launchOptions.headless = true
  }

  return launchOptions
}

/**
 * Launch browser with environment-aware settings
 */
export const launchBrowser = async (browserType, options = {}) => {
  const engine = typeof browserType === 'string'
    ? { chromium, firefox, webkit }[browserType] || chromium
    : browserType

  const launchOptions = getBrowserLaunchOptions(engine, options)

  console.log(`[BROWSER] 🚀 Launching browser with options:`, launchOptions)

  try {
    return await engine.launch(launchOptions)
  } catch (error) {
    console.error(`[BROWSER] ❌ Failed to launch browser:`, error.message)

    if (error.message.includes('Failed to connect to Xvfb')) {
      console.error('[BROWSER] 💡 Tip: Xvfb not available. Install with: sudo apt-get install xvfb')
    } else if (error.message.includes('Unable to open X display')) {
      console.error('[BROWSER] 💡 Tip: No display server found. Use Xvfb or headless mode.')
    }

    throw error
  }
}

/**
 * Wrap xvfb-run command (Linux only)
 */
export const getXvfbRunCommand = () => {
  if (!isLinux) return null
  return 'xvfb-run -a --server-args="-screen 0 1920x1080x24"'
}

export default {
  getBrowserLaunchOptions,
  launchBrowser,
  getXvfbRunCommand,
  CHROMIUM_DOCKER_ARGS,
  isWindows,
  isLinux
}
