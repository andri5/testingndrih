// Fix locator using Google Gemini AI (Free)
export async function fixLocator(req, res) {
  try {
    const { errorMessage, currentLocator, stepDescription, pageUrl, stepType } = req.body

    // Validate required fields
    if (!errorMessage || !currentLocator || !stepDescription || !stepType) {
      return res.status(400).json({
        error: 'Missing required fields: errorMessage, currentLocator, stepDescription, stepType'
      })
    }

    // Validate API key
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Google Gemini API key not configured'
      })
    }

    // Build prompt for Gemini
    const prompt = `You are an expert in web automation and CSS/XPath selectors. 

A test step failed with the following error:
Error: ${errorMessage}
Current locator: ${currentLocator}
Step type: ${stepType}
Step description: ${stepDescription}
Page URL: ${pageUrl}

Based on this information, suggest a better locator/selector that might work better. Consider:
1. The error message indicates what went wrong
2. Try alternative selector strategies: data-testid, id, name, aria-label, CSS classes, XPath
3. Be specific and concise

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "suggestedLocator": "the new locator/selector",
  "reason": "brief explanation why this might work better",
  "confidence": 0.0 to 1.0 confidence score
}`

    // Try multiple Gemini models in order (fallback if quota exceeded)
    const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash']
    let lastError = null

    for (const model of models) {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300
          }
        })
      })

      // If rate limited or quota exceeded, try next model
      if (response.status === 429) {
        console.warn(`Gemini model ${model}: quota exceeded, trying next...`)
        try { lastError = await response.json() } catch (e) { /* ignore */ }
        continue
      }

      // Other errors - return immediately
      if (!response.ok) {
        let errorData = {}
        try { errorData = await response.json() } catch (e) { /* ignore */ }
        console.error(`Gemini API Error (${model}):`, response.status, errorData)
        return res.status(response.status).json({
          error: 'Gemini API error',
          details: errorData.error?.message || 'Unknown API error',
          status: response.status
        })
      }

      // Success - parse response
      const apiResponse = await response.json()
      const responseText = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text || ''

      if (!responseText) {
        console.error(`Gemini (${model}): Empty response`)
        continue
      }

      // Parse JSON from response
      let suggestion
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          suggestion = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No JSON found in response')
        }
      } catch (parseError) {
        return res.status(500).json({
          error: 'Failed to parse AI response',
          details: parseError.message
        })
      }

      if (!suggestion.suggestedLocator || !suggestion.reason) {
        return res.status(500).json({
          error: 'Invalid AI response format'
        })
      }

      // Return successful suggestion
      return res.status(200).json({
        success: true,
        suggestion: {
          currentLocator,
          suggestedLocator: suggestion.suggestedLocator,
          reason: suggestion.reason,
          confidence: suggestion.confidence || 0.8,
          timestamp: new Date().toISOString(),
          model
        }
      })
    }

    // All models exhausted (quota exceeded on all)
    return res.status(429).json({
      error: 'AI quota exceeded',
      details: 'Semua model Gemini gratis telah mencapai batas kuota. Coba lagi nanti atau buat API key baru di https://ai.google.dev/',
      status: 429
    })

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to generate AI suggestion',
      details: error.message
    })
  }
}
