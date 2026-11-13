/**
 * AI assistant for test automation — OpenAI-compatible chat API.
 * Requires AI_ENABLED=true and OPENAI_API_KEY in server env.
 */

const SENSITIVE_PATTERN = /(password|secret|token|api[_-]?key|authorization|bearer)\s*[:=]\s*\S+/gi

export function isAiEnabled() {
  return process.env.AI_ENABLED === 'true' && Boolean(process.env.OPENAI_API_KEY?.trim())
}

function getConfig() {
  if (!isAiEnabled()) {
    const err = new Error('AI features are not configured. Set AI_ENABLED=true and OPENAI_API_KEY on the server.')
    err.status = 503
    err.code = 'AI_NOT_CONFIGURED'
    throw err
  }
  return {
    apiKey: process.env.OPENAI_API_KEY.trim(),
    baseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, ''),
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  }
}

export function redactSensitiveText(text) {
  if (!text || typeof text !== 'string') return text
  return text.replace(SENSITIVE_PATTERN, '$1=[REDACTED]')
}

export function redactContext(payload) {
  return JSON.parse(redactSensitiveText(JSON.stringify(payload)))
}

function parseProviderError(status, bodyText) {
  let msg = null
  try {
    const parsed = JSON.parse(bodyText)
    msg = parsed?.error?.message || parsed?.message || null
  } catch {
    /* not JSON */
  }

  if (status === 401 || (msg && /incorrect api key|invalid.*api key/i.test(msg))) {
    return {
      message: 'API key AI tidak valid. Periksa OPENAI_API_KEY di backend/.env lalu restart server.',
      status: 401,
      code: 'AI_INVALID_KEY',
    }
  }

  if (status === 429 || (msg && /rate limit|quota|too many requests|tokens per day|requests per day/i.test(msg))) {
    return {
      message: 'Limit harian atau per-menit provider AI (Groq) sudah habis. Coba lagi nanti atau besok.',
      status: 429,
      code: 'AI_PROVIDER_RATE_LIMIT',
    }
  }

  if (msg) {
    return {
      message: msg.length > 300 ? `${msg.slice(0, 300)}…` : msg,
      status: status >= 500 ? 502 : 400,
      code: null,
    }
  }

  return {
    message: `AI provider error (${status})`,
    status: status >= 500 ? 502 : 400,
    code: null,
  }
}

async function callLlm(systemPrompt, userPrompt, { temperature = 0.3 } = {}) {
  const { apiKey, baseUrl, model } = getConfig()

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    const parsed = parseProviderError(response.status, body)
    const err = new Error(parsed.message)
    err.status = parsed.status
    err.code = parsed.code
    throw err
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from AI provider')
  }

  try {
    return JSON.parse(content)
  } catch {
    throw new Error('AI returned invalid JSON')
  }
}

const EXPLAIN_SYSTEM = `You are a QA automation expert for Playwright-based tests.
Analyze step failures and respond ONLY with valid JSON:
{
  "summary": "one sentence overview",
  "rootCause": "likely root cause",
  "fixSteps": ["actionable fix 1", "actionable fix 2"],
  "confidence": "high|medium|low"
}
Be concise. Never suggest putting real passwords in tests. Use Indonesian or English matching the user prompt language.`

export async function explainFailure(context) {
  const safe = redactContext(context)
  const userPrompt = `Explain this test step failure:\n${JSON.stringify(safe, null, 2)}`
  return callLlm(EXPLAIN_SYSTEM, userPrompt)
}

const LOCATOR_SYSTEM = `You are a Playwright locator expert.
Given a failed step and optional DOM hints, suggest alternative selectors.
Respond ONLY with valid JSON:
{
  "selectors": [
    {
      "selector": "playwright-compatible css or text selector",
      "strategy": "short label e.g. Role, Test ID, Text",
      "confidence": 0.0 to 1.0,
      "reasoning": "one sentence why this may work"
    }
  ]
}
Return 1-5 selectors ranked by confidence. Prefer resilient selectors over brittle nth-child.`

export async function suggestLocator(context) {
  const safe = redactContext(context)
  const userPrompt = `Suggest locators for this failed step:\n${JSON.stringify(safe, null, 2)}`
  const result = await callLlm(LOCATOR_SYSTEM, userPrompt)
  if (!Array.isArray(result.selectors) || result.selectors.length === 0) {
    throw new Error('AI returned no locator suggestions')
  }
  return {
    selectors: result.selectors.map((s) => ({
      selector: String(s.selector || '').trim(),
      strategy: s.strategy || 'AI',
      confidence: Math.min(1, Math.max(0, Number(s.confidence) || 0.5)),
      preview: s.reasoning || '',
    })).filter((s) => s.selector),
  }
}