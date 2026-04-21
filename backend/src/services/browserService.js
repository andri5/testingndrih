/**
 * Browser Service - Define and manage available browsers for testing
 */

// Available browsers for cross-browser testing
const AVAILABLE_BROWSERS = {
  chromium: {
    name: 'Chromium',
    key: 'chromium',
    displayName: 'Chrome/Chromium',
    description: 'Chromium-based browser (Chrome, Edge compatible)',
    isDefault: true,
    launchArgs: ['--disable-blink-features=AutomationControlled']
  },
  firefox: {
    name: 'Firefox',
    key: 'firefox',
    displayName: 'Firefox',
    description: 'Mozilla Firefox browser',
    isDefault: false,
    launchArgs: []
  },
  webkit: {
    name: 'WebKit',
    key: 'webkit',
    displayName: 'Safari',
    description: 'WebKit-based browser (Safari compatible)',
    isDefault: false,
    launchArgs: []
  }
};

/**
 * Get all available browsers
 */
export function getAvailableBrowsers() {
  return Object.values(AVAILABLE_BROWSERS);
}

/**
 * Get browser by key
 */
export function getBrowserConfig(browserKey) {
  const browser = AVAILABLE_BROWSERS[browserKey];
  if (!browser) {
    throw new Error(`Browser not supported: ${browserKey}`);
  }
  return browser;
}

/**
 * Get default browser
 */
export function getDefaultBrowser() {
  return Object.values(AVAILABLE_BROWSERS).find(b => b.isDefault);
}

/**
 * Validate browser choice
 */
export function isValidBrowser(browserKey) {
  return browserKey in AVAILABLE_BROWSERS;
}

/**
 * Get Playwright launch options for browser
 */
export function getLaunchOptions(browserKey, headless = false) {
  const browser = getBrowserConfig(browserKey);
  
  return {
    headless: headless,
    args: browser.launchArgs,
    // Common options across all browsers
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/New_York'
  };
}

/**
 * Get browser display info for UI
 */
export function getBrowserInfo(browserKey) {
  const browser = getBrowserConfig(browserKey);
  return {
    key: browser.key,
    displayName: browser.displayName,
    description: browser.description,
    isDefault: browser.isDefault
  };
}

export default {
  getAvailableBrowsers,
  getBrowserConfig,
  getDefaultBrowser,
  isValidBrowser,
  getLaunchOptions,
  getBrowserInfo,
  AVAILABLE_BROWSERS
};
