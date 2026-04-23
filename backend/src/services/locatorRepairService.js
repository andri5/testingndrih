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

    // Strategy 1: Text match (paling reliable untuk buttons & links)
    if (stepInfo.description || stepInfo.value) {
      const textMatch = await this.findByText(page, stepInfo.description || stepInfo.value);
      if (textMatch) {
        console.log(`[REPAIR] ✅ Found by text: "${stepInfo.description || stepInfo.value}"`);
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
          if (ariaLabel) return `[role="${role}"][aria-label="${ariaLabel}"]`;
          return `[role="${role}"]`;
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
