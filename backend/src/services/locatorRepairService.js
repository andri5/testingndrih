/**
 * Phase 2.1: Self Healing Selector / Locator Repair Service
 * ═══════════════════════════════════════════════════════════════
 * Jika selector gagal, cari alternatif:
 * 1. Find same text
 * 2. Find nearest button/element
 * 3. Find elemen dengan role sama
 * 4. Find sekitar posisi lama
 * 
 * Benefit: Test tetap jalan walau UI berubah kecil
 */

class LocatorRepairService {
  /**
   * Repair selector when primary fails
   * @param {Page} page - Playwright page object
   * @param {string} originalSelector - Selector yang gagal
   * @param {Object} stepInfo - Info step: type, value, description
   * @returns {Promise<string|null>} - New selector atau null jika gagal
   */
  async repairLocator(page, originalSelector, stepInfo = {}) {
    console.log(`[REPAIR] Attempting to repair selector: ${originalSelector}`);

    // Strategy 0: FILL — find visible search/text inputs (desktop + mobile layouts)
    if (stepInfo.type === 'FILL') {
      const fillMatch = await this.findFillInput(page, stepInfo);
      if (fillMatch) {
        console.log(`[REPAIR] ✅ Found fill input: ${fillMatch}`);
        return fillMatch;
      }
    }

    // Strategy 0b: CLICK on mobile-style pages — common video/link patterns
    if (stepInfo.type === 'CLICK') {
      const clickMatch = await this.findClickableFallback(page, stepInfo);
      if (clickMatch) {
        console.log(`[REPAIR] ✅ Found clickable fallback: ${clickMatch}`);
        return clickMatch;
      }
    }

    // Strategy 1: Text match — for FILL only use description (value is typed text, not UI label)
    const textSource = stepInfo.type === 'FILL'
      ? stepInfo.description
      : (stepInfo.description || stepInfo.value);
    if (textSource) {
      const textMatch = await this.findByText(page, textSource);
      if (textMatch) {
        console.log(`[REPAIR] ✅ Found by text: "${textSource}"`);
        return textMatch;
      }
    }

    // Strategy 2: Find nearest button/similar element
    if (stepInfo.type === 'CLICK') {
      const nearbyElement = await this.findNearestButton(page, originalSelector, stepInfo);
      if (nearbyElement) {
        console.log(`[REPAIR] ✅ Found nearest button: ${nearbyElement}`);
        return nearbyElement;
      }
    }

    // Strategy 3: Find element dengan role sama
    if (stepInfo.type === 'CLICK') {
      const roleMatch = await this.findByRole(page, originalSelector);
      if (roleMatch) {
        console.log(`[REPAIR] ✅ Found by role: ${roleMatch}`);
        return roleMatch;
      }
    }

    // Strategy 4: Find sekitar posisi lama (nth-child variation)
    const positionMatch = await this.findByPosition(page, originalSelector);
    if (positionMatch) {
      console.log(`[REPAIR] ✅ Found by position variation: ${positionMatch}`);
      return positionMatch;
    }

    console.log(`[REPAIR] ❌ All strategies failed for: ${originalSelector}`);
    return null;
  }

  /**
   * Open mobile search overlay when the input is hidden (e.g. m.youtube.com home)
   */
  async openMobileSearchIfNeeded(page) {
    const inputs = [
      page.locator('input[name="search_query"]').first(),
      page.locator('ytm-searchbox input').first(),
      page.getByRole('searchbox').first(),
    ];

    for (const input of inputs) {
      try {
        if (await input.isVisible({ timeout: 500 })) return;
      } catch (_) {
        /* continue */
      }
    }

    const triggers = [
      page.getByRole('button', { name: /search youtube|search|cari/i }).first(),
      page.locator('button[aria-label*="Search" i]').first(),
      page.locator('ytm-searchbox button').first(),
    ];

    for (const trigger of triggers) {
      try {
        if (await trigger.isVisible({ timeout: 1500 })) {
          await trigger.click({ timeout: 5000 });
          await page.waitForTimeout(800);
          return;
        }
      } catch (_) {
        /* try next */
      }
    }
  }

  /**
   * Try a selector and return a disambiguated version safe for resolveLocator
   */
  async tryVisibleSelector(page, selector) {
    if (selector === 'role:searchbox') {
      try {
        await page.getByRole('searchbox').first().waitFor({ state: 'visible', timeout: 2000 });
        return 'role:searchbox';
      } catch (_) {
        return null;
      }
    }
    if (selector === 'role:searchbox-named') {
      try {
        await page.getByRole('searchbox', { name: /search|cari/i }).first()
          .waitFor({ state: 'visible', timeout: 2000 });
        return 'role:searchbox-named';
      } catch (_) {
        return null;
      }
    }
    if (selector === 'role:textbox-search') {
      try {
        await page.getByRole('textbox', { name: /search|cari/i }).first()
          .waitFor({ state: 'visible', timeout: 2000 });
        return 'role:textbox-search';
      } catch (_) {
        return null;
      }
    }
    if (selector === 'role:button-search') {
      try {
        await page.getByRole('button', { name: /search youtube|search|cari/i }).first()
          .waitFor({ state: 'visible', timeout: 2000 });
        return 'role:button-search';
      } catch (_) {
        return null;
      }
    }

    try {
      const locator = page.locator(selector).first();
      await locator.waitFor({ state: 'visible', timeout: 2000 });
      const ariaLabel = await locator.getAttribute('aria-label');
      if (ariaLabel) {
        return `[aria-label="${ariaLabel.replace(/"/g, '\\"')}"]`;
      }
      return selector;
    } catch (_) {
      return null;
    }
  }

  /**
   * Find a visible input for FILL steps (works on mobile + desktop search boxes)
   */
  async findFillInput(page, stepInfo = {}) {
    await this.openMobileSearchIfNeeded(page);

    const roleChecks = ['role:searchbox-named', 'role:searchbox', 'role:textbox-search'];
    for (const roleSelector of roleChecks) {
      const found = await this.tryVisibleSelector(page, roleSelector);
      if (found) return found;
    }

    const cssCandidates = [
      'ytm-searchbox input',
      'input[name="search_query"]',
      'input[name="q"]',
      'input[type="search"]',
      'input[aria-label*="Search" i]',
      'input[placeholder*="Search" i]',
      'textarea[name="q"]',
      'form[role="search"] input',
    ];

    for (const selector of cssCandidates) {
      const found = await this.tryVisibleSelector(page, selector);
      if (found) return found;
    }

    return null;
  }

  /**
   * Find clickable elements on mobile layouts when desktop XPath fails
   */
  async findClickableFallback(page, stepInfo = {}) {
    const desc = (stepInfo.description || '').toLowerCase();
    const cssCandidates = [];

    // Search icon / bar — must come before generic "video" keyword matching
    if (/search|cari|pencarian|query/.test(desc)) {
      cssCandidates.push(
        'role:button-search',
        'button[aria-label*="Search" i]',
        'ytm-searchbox button',
        '[aria-label*="Search YouTube" i]'
      );
    }

    // Video result clicks — exclude search/input steps whose description mentions "video"
    const isVideoResultClick =
      (/watch|play|klik.*video|tap.*video|pilih.*video/.test(desc) ||
        (desc.includes('video') && !/pencarian|search|cari|input|nama/.test(desc)));

    if (isVideoResultClick) {
      cssCandidates.push(
        'a[href*="/watch"]',
        'ytm-compact-video-renderer a',
        'ytm-video-with-context-renderer a',
        'ytd-video-renderer a#thumbnail'
      );
    }

    cssCandidates.push('button[type="submit"]', 'input[type="submit"]');

    for (const selector of cssCandidates) {
      const found = await this.tryVisibleSelector(page, selector);
      if (found) return found;
    }

    return null;
  }

  /**
   * Strategy 1: Find element by visible text
   * Cocok untuk: Buttons, links, labels
   */
  async findByText(page, text) {
    if (!text || text.length === 0) return null;

    const cleanText = text.trim().substring(0, 100);

    // Try exact match dulu
    try {
      await page.waitForSelector(`text="${cleanText}"`, { timeout: 2000 });
      return `text="${cleanText}"`;
    } catch (_) {}

    // Try partial match
    try {
      // XPath untuk partial text match
      const xpathSelector = `//*[contains(text(), '${cleanText.replace(/'/g, "\\'")}')]`;
      await page.waitForSelector(xpathSelector, { timeout: 2000 });
      return xpathSelector;
    } catch (_) {}

    // Try button dengan text (playwright specific)
    try {
      const button = await page.getByRole('button', { name: cleanText }).first();
      if (await button.isVisible()) {
        return `button:has-text("${cleanText}")`;
      }
    } catch (_) {}

    return null;
  }

  /**
   * Strategy 2: Find nearest button/clickable element
   * Jika selector berubah, cari button terdekat dengan text similar
   */
  async findNearestButton(page, originalSelector, stepInfo) {
    try {
      // Get all buttons/clickable elements
      const buttons = await page.$$eval('button, a, [role="button"], input[type="button"]', els => {
        return els
          .filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0; // visible
          })
          .map(el => ({
            text: el.textContent?.trim() || el.getAttribute('aria-label') || '',
            ariaLabel: el.getAttribute('aria-label'),
            type: el.tagName.toLowerCase(),
            className: el.className,
          }));
      });

      if (!buttons.length) return null;

      // Find button dengan text mirip
      for (const btn of buttons) {
        if (btn.text.includes(stepInfo.value || '') || btn.ariaLabel?.includes(stepInfo.value || '')) {
          if (btn.ariaLabel) return `[aria-label="${btn.ariaLabel}"]`;
          if (btn.text) return `text="${btn.text}"`;
        }
      }

      return null;
    } catch (err) {
      console.log(`[REPAIR] Error in findNearestButton: ${err.message}`);
      return null;
    }
  }

  /**
   * Strategy 3: Find element dengan role sama
   * Untuk accessibility-first elements
   */
  async findByRole(page, originalSelector) {
    try {
      // Extract role dari selector jika ada
      const roleMatch = originalSelector.match(/\[role="([^"]+)"\]/);
      if (!roleMatch) return null;

      const role = roleMatch[1];

      // Find first visible element dengan role ini
      const elements = await page.$$(`[role="${role}"]`);
      
      for (const el of elements) {
        if (await el.isVisible()) {
          const ariaLabel = await el.getAttribute('aria-label');
          if (ariaLabel) {
            return `[role="${role}"][aria-label="${ariaLabel.replace(/"/g, '\\"')}"]`;
          }
        }
      }

      return null;
    } catch (err) {
      console.log(`[REPAIR] Error in findByRole: ${err.message}`);
      return null;
    }
  }

  /**
   * Strategy 4: Find by position variation
   * Jika selector adalah nth-child(5), coba nth-child(4), nth-child(6), dll
   */
  async findByPosition(page, originalSelector) {
    const nthMatch = originalSelector.match(/:nth-child\((\d+)\)/);
    if (!nthMatch) return null;

    const currentIndex = parseInt(nthMatch[1]);
    const baseSelector = originalSelector.replace(/:nth-child\(\d+\)/, '');

    // Try adjacent positions
    for (let offset = -2; offset <= 2; offset++) {
      if (offset === 0) continue;
      const newIndex = currentIndex + offset;
      if (newIndex <= 0) continue;

      const newSelector = `${baseSelector}:nth-child(${newIndex})`;
      try {
        const element = await page.$(newSelector);
        if (element && (await element.isVisible())) {
          console.log(`[REPAIR] Found at position offset ${offset}: ${newSelector}`);
          return newSelector;
        }
      } catch (_) {}
    }

    return null;
  }

  /**
   * Extended repair: Try variations of original selector
   * Untuk custom selectors yang mungkin berubah minor
   */
  async repairWithVariations(page, originalSelector) {
    const variations = this.generateSelectorVariations(originalSelector);

    for (const variant of variations) {
      try {
        const element = await page.$(variant);
        if (element && (await element.isVisible())) {
          console.log(`[REPAIR] ✅ Found selector variation: ${variant}`);
          return variant;
        }
      } catch (_) {}
    }

    return null;
  }

  /**
   * Generate minor variations of selector
   * Misal: input[name="email"] → input[placeholder="email"], input[type="email"]
   */
  generateSelectorVariations(selector) {
    const variations = [selector];

    // Remove classes (dynamic classes)
    if (selector.includes('.')) {
      variations.push(selector.replace(/\.[a-zA-Z0-9_-]+/g, ''));
    }

    // Remove nth-child
    if (selector.includes(':nth-child')) {
      variations.push(selector.replace(/:nth-child\(\d+\)/, ''));
    }

    // Simplify to tag only
    const tagMatch = selector.match(/^([a-zA-Z0-9]+)/);
    if (tagMatch) {
      variations.push(tagMatch[1]);
    }

    return [...new Set(variations)]; // Remove duplicates
  }
}

export default new LocatorRepairService();
