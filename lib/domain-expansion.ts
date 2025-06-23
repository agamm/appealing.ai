import { z } from 'zod'
import { generateObject } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

export async function generateOptionsForPattern(pattern: string, excludedOptions: string[] = []): Promise<string[]> {
  // Handle simple slash patterns first - strictly word/word/word format
  // Match patterns like: apple/banana/cherry or get/set/delete
  if (pattern.includes("/") && /^[a-zA-Z0-9]+(?:\/[a-zA-Z0-9]+)+$/.test(pattern.trim())) {
    return pattern
      .split("/")
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0)
  }

  // Extract number from patterns like "10 words", "5 dictionary words", etc.
  const numberMatch = pattern.match(/^(\d+)\s+(word|words|dictionary\s+word|dictionary\s+words)/)
  const requestedCount = numberMatch ? parseInt(numberMatch[1]) : null
  

  try {
    const { object } = await generateObject({
      model: openrouter("openai/gpt-4.1-nano"),
      system: `Generate options for domain patterns. Rules:
- If pattern contains "/" return those exact options
- For "dictionary word" return common English words suitable for domains
- For "with/without -" include both versions
- If asked to use prefixes, some common ones: get, try, use 
- Keep words lowercase
- When pattern asks for "X words" (e.g., "3 words", "10 words"), generate X individual single words, NOT multi-word phrases, and no spaces in between
- Words/terms are usually not compound words, also they are not TLDs - unless specifically asked for
- If user asks for play on words, a play on words return a clever use of word meanings or sounds for humor or effect.
- When pattern asks for "words similar to <word>" return words similar to <word> but also <word>.
- When pattern asks for "words like <word>" don't return "<word>like" or "<word>dup"...
- If pattern specifies a number (e.g., "10 words"), return exactly that many options
- Otherwise return max 50 options
- Unless constrained by pattern, return at least 5 options
${excludedOptions.length > 0 ? `- DO NOT generate these options that were already tried: ${excludedOptions.join(', ')}` : ''}`,
      prompt: `Generate options for the following pattern: ${pattern}${requestedCount ? `\n\nIMPORTANT: You MUST generate EXACTLY ${requestedCount} options, no more, no less.` : ''}${excludedOptions.length > 0 ? `\n\nDO NOT generate these options: ${excludedOptions.join(', ')}` : ''}`,
      temperature: requestedCount ? 1.0 : 0.9,
      seed: Math.round(Math.random()*100),
      schema: z.object({
        options: z.array(z.string()).min(requestedCount || 1),
      }),
    })

    return object.options
      .filter((option) => option.trim().length > 0)
      .filter((option) => !option.includes('.')) // Remove any words with dots
      .filter((option) => !option.includes(' ')) // Remove any multi-word phrases
      .slice(0, requestedCount || 50)
  } catch {

    // For test environments without API key
    if (process.env.NODE_ENV === 'test') {
      console.warn('LLM call failed, returning empty array for pattern:', pattern)
    }
    return []
  }
}