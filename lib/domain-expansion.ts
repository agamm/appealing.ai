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
  

  try {
    const { object } = await generateObject({
      model: openrouter("openai/gpt-4.1-nano"),
      system: `Generate options for domain patterns. 
Rules:
- If pattern contains "/" return those exact options
- For "dictionary word" return common English words suitable for domains
- For "with/without -" include both versions
- If asked to use prefixes, some common ones: get, try, use 
- Keep words lowercase
- When pattern asks for "X words" (e.g., "3 words", "10 words"), generate X individual single words, NOT multi-word phrases, and no spaces in between
- When pattern mentions "combinations" or "compound", generate both individual words AND compound words (e.g., for xxx/yyy/zzz pattern, include: xxx, yyy, zzz, xxxyyy, xxxzzz, yyyzzz, etc.)
- When pattern specifies "no more than 2" or similar limits, respect that constraint
- Otherwise, words/terms are usually not compound words, also they are not TLDs (.com etc.) - unless specifically asked for
- If user asks for play on words, a play on words return a clever use of word meanings or sounds for humor or effect.
- When pattern asks for "words similar to <word>" return words similar to <word> but also <word>.
- When pattern asks for "words like <word>" don't return "<word>like" or "<word>dup"...
- If pattern specifies a number (e.g., "10 words"), return exactly that many options
- Otherwise return max 50 options
- Unless constrained by pattern, return at least 5 options
${excludedOptions.length > 0 ? `- IMPORTANT: DO NOT return any of these already-used options: ${excludedOptions.join(', ')}\n- Generate new DIFFERENT options that are NOT in the list above` : ''}`,
      prompt: `Generate options for the following pattern: ${pattern}${excludedOptions.length > 0 ? `\n\nIMPORTANT: These options have already been used and must NOT be included in your response:\n${excludedOptions.join(', ')}\n\nGenerate NEW, DIFFERENT options that are NOT in the list above.` : ''}`,
      temperature: 0.9,
      seed: Math.round(Math.random()*100),
      maxTokens: 256,
      schema: z.object({
        options: z.array(z.string()).min(1),
      }),
    })

    // Check if pattern specifies a limit on compound words
    const maxCompoundMatch = pattern.match(/no more than (\d+)/i)
    const maxCompoundParts = maxCompoundMatch ? parseInt(maxCompoundMatch[1]) : null
    
    return object.options
      .filter((option) => option.trim().length > 0)
      .filter((option) => !option.includes('.')) // Remove any words with dots
      .filter((option) => !option.includes(' ')) // Remove any multi-word phrases
      .filter((option) => {
        // If there's a limit on compound parts, check it
        if (maxCompoundParts && pattern.toLowerCase().includes('compound')) {
          // Count how many base words might be in this option
          // This is a heuristic - compound words typically have 6+ chars per part
          const estimatedParts = Math.ceil(option.length / 6)
          return estimatedParts <= maxCompoundParts
        }
        return true
      })
      .slice(0, 50)
  } catch {
    console.warn('Failed to generate options for pattern:', pattern)
    return []
  }
}