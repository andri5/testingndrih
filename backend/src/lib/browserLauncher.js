/**
 * Browser Launcher Helper
 * Handles headless/headed mode based on environment
 * Supports Xvfb virtual display for server environments
 */

import { chromium, firefox, webkit } from 'playwright'
import os from 'os'

// Detect if running on Windows or Linux
const isWindows = os.platform() === 'win32'
const isLinux = os.platform() === 'linux'

/**
 * Get appropriate launch options for the environment
 */
export const getBrowserLaunchOptions = (browserType, options = {}) => {
  const { headless = true, channel = undefined } = options

  // Default launch options
  const launchOptions = {
    channel,
    // Always use headless on server/Linux environments
    headless: isLinux ? true : headless,
  }

  // Add Xvfb support for Linux if available
  if (isLinux && !headless) {
    console.log('[BROWSER] ℹ️ Running on Linux. Using headless mode with Xvfb support.')
    launchOptions.headless = true
  }

  return launchOptions
}

/**
 * Launch browser with environment-aware settings
 */
export const launchBrowser = async (browserType, options = {}) => {
  const launchOptions = getBrowserLaunchOptions(browserType, options)
  
  console.log(`[BROWSER] 🚀 Launching browser with options:`, launchOptions)
  
  try {
    const browser = await browserType.launch(launchOptions)
    return browser
  } catch (error) {
    console.error(`[BROWSER] ❌ Failed to launch browser:`, error.message)
    
    // Provide helpful error messages
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
 * Usage: xvfb-run npm run test
 */
export const getXvfbRunCommand = () => {
  if (!isLinux) return null
  
  return 'xvfb-run -a --server-args="-screen 0 1920x1080x24"'
}

export default {
  getBrowserLaunchOptions,
  launchBrowser,
  getXvfbRunCommand,
  isWindows,
  isLinux
}
