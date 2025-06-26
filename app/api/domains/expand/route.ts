import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import validator from 'validator'
import { extractPatterns, generatePermutations } from '@/lib/patterns'
import { captureEvent } from '@/lib/posthog-server'
import { generateObject } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

const requestSchema = z.object({
  query: z.string().min(1)
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
      model: openrouter("openai/gpt-4o-mini:floor"),
      system: `Generate options for domain patterns. 
Rules:
- If pattern contains "/" return those exact options
- For "dictionary word" return common English words suitable for domains
- For "with/without -" include both versions
- Keep words lowercase
- When pattern asks for "X words" (e.g., "3 words", "10 words"), generate exactly X individual single words
- When pattern mentions "combinations" or "compound", generate both individual words AND compound words
- Otherwise, words/terms are usually not compound words, also they are not TLDs (.com etc.)
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
      .filter((option) => !option.includes('.'))
      .filter((option) => !option.includes(' '))
      .slice(0, 50)
  } catch (error) {
    console.error('Failed to generate options for pattern:', pattern, error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = requestSchema.parse(body)
    
    const patterns = extractPatterns(query)
    
    // Limit to maximum 4 patterns
    if (patterns.length > 4) {
      return NextResponse.json({ 
        error: 'Too many patterns. Maximum 4 patterns allowed per query.',
        domains: [], 
        query, 
        options: {} 
      }, { status: 400 })
    }
    
    // If no patterns, just validate the domain
    if (patterns.length === 0) {
      const isValid = validator.isFQDN(query, { require_tld: true })
      if (!isValid) {
        return NextResponse.json({ domains: [], query, options: {} })
      }
      return NextResponse.json({ domains: [query], query, options: {} })
    }
    
    // Generate options for each pattern by index
    const options: Record<string, string[]> = {}
    
    for (let i = 0; i < patterns.length; i++) {
      const patternOptions = await generateOptionsForPattern(patterns[i].pattern)
      if (patternOptions.length > 0) {
        options[i.toString()] = patternOptions
      }
    }
    
    if (Object.keys(options).length === 0) {
      return NextResponse.json({ domains: [], query, options: {} })
    }
    
    // Generate all permutations
    const permutations = generatePermutations(query, options)
    const validDomains = permutations
      .map((domain) => domain.toLowerCase())
      .filter((domain) => validator.isFQDN(domain, { require_tld: true }))
      .filter((domain, index, arr) => arr.indexOf(domain) === index)
    
    // Log successful generation
    await captureEvent('domain_expansion_success', {
      query,
      domains_generated: validDomains.length,
      pattern_count: patterns.length,
      options_per_pattern: Object.entries(options).map(([index, opts]) => ({
        pattern_index: index,
        pattern: patterns[parseInt(index)].pattern,
        options_count: opts.length
      }))
    })
    
    return NextResponse.json({ 
      domains: validDomains,
      query,
      options
    })
    
  } catch (error) {
    console.error('Error expanding domains:', error)
    
    // Log the error
    await captureEvent('domain_expansion_error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { error: 'Failed to expand domains' },
      { status: 500 }
    )
  }
}