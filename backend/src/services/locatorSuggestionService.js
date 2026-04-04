/**
 * Smart Locator Suggestion Service
 * Analyzes the page DOM when a step fails and suggests alternative selectors.
 * No AI required — pure DOM analysis using Playwright's page.evaluate().
 */

/**
 * Given a failed selector and the current page, scan the DOM for similar elements
 * and generate ranked alternative selectors.
 *
 * @param {import('playwright').Page} page - Playwright page object (browser still open)
 * @param {string} failedSelector - The original selector that failed
 * @param {string} stepType - CLICK | FILL | ASSERTION
 * @param {string} [stepDescription] - Human description of the step (for text matching)
 * @param {string} [stepValue] - Value field (for FILL steps — helps identify input purpose)
 * @returns {Promise<Array<{selector: string, strategy: string, confidence: number, preview: string}>>}
 */
export async function suggestAlternativeLocators(page, failedSelector, stepType, stepDescription = '', stepValue = '') {
  try {
    const candidates = await page.evaluate(({ failedSelector, stepType, stepDescription, stepValue }) => {
      // ── Helper: generate all possible selectors for an element ──
      function generateSelectors(el) {
        const selectors = []
        const tag = el.tagName.toLowerCase()

        // 1. By ID (most robust)
        if (el.id) {
          selectors.push({ selector: `#${CSS.escape(el.id)}`, strategy: 'ID', confidence: 0.95 })
        }

        // 2. By data-testid / data-cy / data-test
        for (const attr of ['data-testid', 'data-cy', 'data-test', 'data-qa']) {
          const val = el.getAttribute(attr)
          if (val) {
            selectors.push({ selector: `[${attr}="${val}"]`, strategy: 'Test ID', confidence: 0.93 })
          }
        }

        // 3. By name attribute (forms)
        if (el.name) {
          selectors.push({ selector: `${tag}[name="${el.name}"]`, strategy: 'Name', confidence: 0.90 })
        }

        // 4. By aria-label
        if (el.getAttribute('aria-label')) {
          const label = el.getAttribute('aria-label')
          selectors.push({ selector: `${tag}[aria-label="${label}"]`, strategy: 'ARIA Label', confidence: 0.88 })
        }

        // 5. By role + text
        const role = el.getAttribute('role') || (tag === 'button' ? 'button' : tag === 'a' ? 'link' : null)
        const text = (el.textContent || '').trim().substring(0, 50)
        if (role && text) {
          selectors.push({ selector: `${tag}:has-text("${text}")`, strategy: 'Tag + Text', confidence: 0.82 })
        }

        // 6. By placeholder (inputs)
        if (el.placeholder) {
          selectors.push({ selector: `${tag}[placeholder="${el.placeholder}"]`, strategy: 'Placeholder', confidence: 0.85 })
        }

        // 7. By type attribute (inputs)
        if (el.type && ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(el.type)) {
          if (el.name) {
            selectors.push({ selector: `input[type="${el.type}"][name="${el.name}"]`, strategy: 'Type + Name', confidence: 0.87 })
          }
        }

        // 8. By class combination (less robust but common)
        if (el.classList.length > 0 && el.classList.length <= 4) {
          const classSelector = '.' + Array.from(el.classList).map(c => CSS.escape(c)).join('.')
          // Check uniqueness
          const count = document.querySelectorAll(tag + classSelector).length
          if (count === 1) {
            selectors.push({ selector: `${tag}${classSelector}`, strategy: 'CSS Class', confidence: 0.70 })
          }
        }

        // 9. By href (links)
        if (tag === 'a' && el.href) {
          try {
            const url = new URL(el.href)
            const path = url.pathname + url.search
            selectors.push({ selector: `a[href="${path}"]`, strategy: 'Href', confidence: 0.80 })
          } catch {}
        }

        // 10. By value attribute (buttons, inputs with value)
        if (el.value && (tag === 'input' || tag === 'button')) {
          selectors.push({ selector: `${tag}[value="${el.value}"]`, strategy: 'Value', confidence: 0.75 })
        }

        // 11. Nth-child as last resort
        if (el.parentElement) {
          const siblings = Array.from(el.parentElement.children).filter(c => c.tagName === el.tagName)
          if (siblings.length > 1) {
            const idx = siblings.indexOf(el) + 1
            const parentId = el.parentElement.id ? `#${CSS.escape(el.parentElement.id)} > ` : ''
            selectors.push({
              selector: `${parentId}${tag}:nth-of-type(${idx})`,
              strategy: 'Nth-of-type',
              confidence: 0.50
            })
          }
        }

        return selectors
      }

      // ── Helper: get preview text for an element ──
      function getPreview(el) {
        const tag = el.tagName.toLowerCase()
        const text = (el.textContent || '').trim().substring(0, 60)
        const attrs = []
        if (el.id) attrs.push(`id="${el.id}"`)
        if (el.className && typeof el.className === 'string') attrs.push(`class="${el.className.substring(0, 40)}"`)
        if (el.name) attrs.push(`name="${el.name}"`)
        if (el.placeholder) attrs.push(`placeholder="${el.placeholder}"`)
        const attrStr = attrs.length ? ' ' + attrs.join(' ') : ''
        return `<${tag}${attrStr}>${text ? text.substring(0, 30) + (text.length > 30 ? '...' : '') : ''}</${tag}>`
      }

      // ── Main logic: find candidate elements based on stepType ──
      let candidateElements = []

      // Determine what kind of element we're looking for
      const interactiveSelector = {
        'CLICK': 'button, a, [role="button"], [role="link"], [role="tab"], [role="menuitem"], input[type="submit"], input[type="button"], [onclick], summary, label, [tabindex]',
        'FILL': 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select, [contenteditable="true"]',
        'ASSERTION': '*'
      }

      const selector = interactiveSelector[stepType] || interactiveSelector['CLICK']
      const allInteractive = Array.from(document.querySelectorAll(selector))

      // ── Strategy 1: Parse the failed selector for clues ──
      const clues = {
        id: null,
        classes: [],
        tag: null,
        text: null,
        name: null,
        placeholder: null
      }

      // Extract ID from failed selector
      const idMatch = failedSelector.match(/#([\w-]+)/)
      if (idMatch) clues.id = idMatch[1]

      // Extract classes
      const classMatches = failedSelector.match(/\.([\w-]+)/g)
      if (classMatches) clues.classes = classMatches.map(c => c.substring(1))

      // Extract tag
      const tagMatch = failedSelector.match(/^(\w+)/)
      if (tagMatch && !['div', 'span'].includes(tagMatch[1])) clues.tag = tagMatch[1]

      // Extract text from :has-text("...")
      const textMatch = failedSelector.match(/:has-text\("(.+?)"\)/)
      if (textMatch) clues.text = textMatch[1]

      // Extract name from [name="..."]
      const nameMatch = failedSelector.match(/\[name="(.+?)"\]/)
      if (nameMatch) clues.name = nameMatch[1]

      // Extract placeholder
      const phMatch = failedSelector.match(/\[placeholder="(.+?)"\]/)
      if (phMatch) clues.placeholder = phMatch[1]

      // Also use step description as text clue
      const descWords = stepDescription.toLowerCase().split(/\s+/).filter(w => w.length > 2)

      // ── Strategy 2: Score each candidate element ──
      const scored = []

      for (const el of allInteractive) {
        // Skip invisible elements
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 && rect.height === 0) continue

        let score = 0
        const reasons = []

        // ID similarity
        if (clues.id && el.id) {
          if (el.id === clues.id) { score += 50; reasons.push('ID exact match') }
          else if (el.id.includes(clues.id) || clues.id.includes(el.id)) { score += 30; reasons.push('ID partial match') }
        }

        // Class overlap
        if (clues.classes.length > 0 && el.classList.length > 0) {
          const overlap = clues.classes.filter(c => el.classList.contains(c)).length
          if (overlap > 0) {
            score += overlap * 15
            reasons.push(`${overlap} class match`)
          }
        }

        // Tag match
        if (clues.tag && el.tagName.toLowerCase() === clues.tag) {
          score += 10
          reasons.push('Tag match')
        }

        // Text similarity
        const elText = (el.textContent || '').trim().toLowerCase()
        if (clues.text) {
          if (elText.includes(clues.text.toLowerCase())) { score += 40; reasons.push('Text match') }
          else {
            const words = clues.text.toLowerCase().split(/\s+/)
            const wordMatch = words.filter(w => elText.includes(w)).length
            if (wordMatch > 0) { score += wordMatch * 10; reasons.push(`${wordMatch} word match`) }
          }
        }

        // Name similarity
        if (clues.name && el.name) {
          if (el.name === clues.name) { score += 40; reasons.push('Name exact match') }
          else if (el.name.includes(clues.name) || clues.name.includes(el.name)) { score += 20; reasons.push('Name partial match') }
        }

        // Placeholder similarity
        if (clues.placeholder && el.placeholder) {
          if (el.placeholder.toLowerCase().includes(clues.placeholder.toLowerCase())) {
            score += 30; reasons.push('Placeholder match')
          }
        }

        // Description keyword matching
        if (descWords.length > 0 && elText) {
          const descMatch = descWords.filter(w => elText.includes(w)).length
          if (descMatch > 0) { score += descMatch * 8; reasons.push(`${descMatch} description words`) }
        }

        // For FILL steps, also match by input purpose
        if (stepType === 'FILL' && stepValue) {
          // Check if placeholder or label hints at the value type
          const ph = (el.placeholder || '').toLowerCase()
          const valLower = stepValue.toLowerCase()
          if (ph && (ph.includes(valLower) || valLower.includes(ph))) {
            score += 15; reasons.push('Value/placeholder match')
          }
        }

        // Boost visible elements
        const style = window.getComputedStyle(el)
        if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
          score += 5
        }

        if (score > 0) {
          const selectors = generateSelectors(el)
          if (selectors.length > 0) {
            scored.push({
              score,
              reasons,
              preview: getPreview(el),
              selectors,
              rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
            })
          }
        }
      }

      // Sort by score descending
      scored.sort((a, b) => b.score - a.score)

      // Take top 5 candidates, pick their best selector each
      return scored.slice(0, 5).map(c => ({
        selector: c.selectors[0].selector,
        strategy: c.selectors[0].strategy,
        confidence: Math.min(c.selectors[0].confidence, c.score / 100),
        preview: c.preview,
        reasons: c.reasons,
        allSelectors: c.selectors.slice(0, 3) // Include up to 3 alternative selector strategies
      }))
    }, { failedSelector, stepType, stepDescription, stepValue })

    return candidates || []
  } catch (err) {
    console.error('Locator suggestion failed:', err.message)
    return []
  }
}
