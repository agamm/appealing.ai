import { z } from 'zod'
import { generateObject } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

export async function generateOptionsForPattern(pattern: string): Promise<string[]> {
  // Handle simple slash patterns first - strictly word/word/word format
  if (pattern.includes("/") && /^[a-zA-Z0-9]+(?:\/[a-zA-Z0-9]+)+$/.test(pattern.trim())) {
    return pattern
      .split("/")
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0)
  }

  try {
    const { object } = await generateObject({
      model: openrouter("moonshotai/kimi-k2.5"),
      system: `Generate options for domain patterns. 
Rules:
- If pattern contains "/" return those exact options
- For "dictionary word" return common English words suitable for domains
- For "with/without -" include both versions
- Keep words lowercase
- When pattern asks for "X words/terms" (e.g., "3 words", "10 words"), generate exactly X individual single words X>1 compound them together
- When pattern mentions "combinations" or "compound", generate both individual words AND compound words
- Otherwise, words/terms are usually not compound words, also they are not TLDs (.com etc.) UNLESS the pattern specifically asks for TLDs or domain extensions
- When generating TLDs or domain extensions, return them WITHOUT the leading dot (e.g., "com", "org", "io", not ".com", ".org", ".io")
- If user asks for play on words, return clever use of word meanings or sounds
- When pattern asks for "words similar to <word>" return words similar to <word> but also include <word>
- If pattern specifies a number (e.g., "10 words"), return exactly that many options
- Otherwise return max 50 options
- Unless constrained by pattern, return at least 5 options`,
      prompt: `Generate options for the following pattern: ${pattern}`,
      temperature: 0.8,
      maxTokens: 256,
      schema: z.object({
        options: z.array(z.string()).min(1),
      }),
    })

    return object.options
      .filter((option) => option.trim().length > 0)
      .filter((option) => !option.includes(' '))
      .slice(0, 50)
  } catch (error) {
    console.error('Failed to generate options for pattern:', pattern, error)
    return []
  }
}

export async function generateOptionsForPatternWithExclusions(pattern: string, excludedOptions: string[]): Promise<string[]> {
  // Handle simple slash patterns first
  if (pattern.includes("/") && /^[a-zA-Z0-9]+(?:\/[a-zA-Z0-9]+)+$/.test(pattern.trim())) {
    return pattern
      .split("/")
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0)
      .filter((opt) => !excludedOptions.includes(opt))
  }

  try {
    const { object } = await generateObject({
      model: openrouter("moonshotai/kimi-k2.5"),
      system: `Generate NEW options for domain patterns that are DIFFERENT from the excluded list.
Rules:
- CRITICAL: Generate ONLY new options that are NOT in the excluded list
- Keep words lowercase
- When pattern asks for "X words", generate X individual single words
- No multi-word phrases or spaces
- When generating TLDs or domain extensions, return them WITHOUT the leading dot (e.g., "com", "org", not ".com", ".org")
- Focus on generating fresh, creative alternatives
- The excluded list contains options that have ALREADY been used - DO NOT repeat them`,
      prompt: `Generate NEW options for pattern: ${pattern}

EXCLUDED OPTIONS (DO NOT USE THESE):
${excludedOptions.join(', ')}

Generate ${Math.min(20, excludedOptions.length)} NEW options that are completely different from the excluded list above.`,
      temperature: 0.95, // Higher temperature for more creativity
      maxTokens: 256,
      schema: z.object({
        options: z.array(z.string()).min(1),
      }),
    })

    // Double-check filtering to remove any duplicates
    const lowerExcluded = new Set(excludedOptions.map(opt => opt.toLowerCase()))
    
    return object.options
      .filter((option) => option.trim().length > 0)
      .filter((option) => !option.includes(' '))
      .filter((option) => !lowerExcluded.has(option.toLowerCase()))
      .slice(0, 20)
  } catch (error) {
    console.error('Failed to generate options for pattern:', pattern, error)
    return []
  }
}