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

// Mobile device emulation presets (uses Playwright built-in device descriptors)
export const MOBILE_DEVICES = [
  {
    key: 'iphone-14',
    displayName: 'iPhone 14',
    playwrightDevice: 'iPhone 14',
    engine: 'webkit',
    type: 'phone',
    viewport: '390×844',
    description: 'Apple iPhone 14 — WebKit, 390×844'
  },
  {
    key: 'iphone-14-pro-max',
    displayName: 'iPhone 14 Pro Max',
    playwrightDevice: 'iPhone 14 Pro Max',
    engine: 'webkit',
    type: 'phone',
    viewport: '430×932',
    description: 'Apple iPhone 14 Pro Max — WebKit, 430×932'
  },
  {
    key: 'pixel-7',
    displayName: 'Pixel 7',
    playwrightDevice: 'Pixel 7',
    engine: 'chromium',
    type: 'phone',
    viewport: '412×915',
    description: 'Google Pixel 7 — Chromium, 412×915'
  },
  {
    key: 'galaxy-s9',
    displayName: 'Galaxy S9+',
    playwrightDevice: 'Galaxy S9+',
    engine: 'chromium',
    type: 'phone',
    viewport: '320×658',
    description: 'Samsung Galaxy S9+ — Chromium, 320×658'
  },
  {
    key: 'ipad-pro-11',
    displayName: 'iPad Pro 11"',
    playwrightDevice: 'iPad Pro 11',
    engine: 'webkit',
    type: 'tablet',
    viewport: '834×1194',
    description: 'Apple iPad Pro 11" — WebKit, 834×1194'
  }
];

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
