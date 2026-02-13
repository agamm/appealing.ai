import { z } from 'zod'
import { generateObject } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

export const DEFAULT_MODEL = 'google/gemini-3-flash-preview'
export const MODEL_DISPLAY_NAME = 'Gemini 3.0 Flash'

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
      model: openrouter(DEFAULT_MODEL),
      system: `You are a domain name brainstorming expert. Generate creative, brandable, and memorable domain name options.

Rules for generation:
1. SLASH PATTERNS: If pattern contains "/", return EXACTLY those options (e.g., "(word1/word2/word3)" → return [word1, word2, word3])
2. WORD COUNTS: If pattern asks for "X words", generate exactly X individual words, not compounds
3. COMPOUND WORDS: Only create compounds if pattern explicitly asks for "combinations", "compound", or similar
4. DOMAIN QUALITY: Prioritize:
   - Easy to spell and pronounce
   - Memorable and brandable
   - No awkward letter combinations
   - Works well as a domain name
5. TLDs: Return without dot (e.g., "com", "io", not ".com", ".io")
6. DICTIONARY WORDS: Use actual English words suitable for domains when requested
7. SPACING: No spaces or multi-word phrases - only single words
8. WORD SIMILARITY: When asked for "similar to X", include X plus alternatives
9. CONSTRAINTS: Respect exact counts if specified
10. DEFAULTS: At least 5 options, max 50 unless constrained`,
      prompt: `Generate domain name options for this pattern: ${pattern}\n\nThink about what makes a good domain name: brevity, memorability, brandability, and ease of spelling.`,
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
      model: openrouter(DEFAULT_MODEL),
      system: `You are a domain name brainstorming expert. Generate creative, brandable, and memorable domain name options.

Rules for generation:
1. NEVER REPEAT: Do NOT generate any options from the excluded list - be completely different
2. SLASH PATTERNS: If pattern contains "/", return EXACTLY those options
3. WORD COUNTS: If pattern asks for "X words", generate exactly X individual words
4. DOMAIN QUALITY: Prioritize:
   - Easy to spell and pronounce
   - Memorable and brandable
   - Novel and creative (especially important since previous options were exhausted)
   - No awkward letter combinations
5. TLDs: Return without dot (e.g., "com", "io", not ".com", ".io")
6. SPACING: No spaces or multi-word phrases - only single words
7. DIVERSITY: Generate alternatives with different styles/themes from excluded options
8. CONSTRAINT: Generate at most ${Math.min(20, excludedOptions.length)} new options`,
      prompt: `Generate completely NEW and different domain name options for: ${pattern}

These options have ALREADY been used and MUST NOT be repeated:
${excludedOptions.join(', ')}

Generate fresh, creative alternatives that are distinctly different from the list above in style and meaning.`,
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