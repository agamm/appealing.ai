import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import validator from 'validator'
import { generateObject } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { extractPatterns, generatePermutations } from '@/lib/patterns'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

const requestSchema = z.object({
  pattern: z.string().min(1)
})

async function generateOptionsForPattern(pattern: string, excludedOptions: string[] = []): Promise<string[]> {
  // Handle simple slash patterns first
  if (pattern.includes("/") && !pattern.includes("with") && !pattern.includes("without")) {
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
- Common prefixes: get, try, use
- Keep words lowercase
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

    return object.options.filter((option) => option.trim().length > 0).slice(0, requestedCount || 50)
  } catch {
    // Fallback
    if (pattern.includes("/")) {
      return pattern
        .split("/")
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0)
    }
    return pattern.trim().length > 0 ? [pattern.trim()] : []
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pattern } = requestSchema.parse(body)
    
    const patterns = extractPatterns(pattern)
    
    // If no patterns, just validate the domain
    if (patterns.length === 0) {
      const isValid = validator.isFQDN(pattern, { require_tld: true })
      if (!isValid) {
        return NextResponse.json({ domains: [] })
      }
      return NextResponse.json({ domains: [pattern] })
    }
    
    // Generate options for each pattern
    const patternResults = []
    for (const p of patterns) {
      const options = await generateOptionsForPattern(p.pattern, [])
      patternResults.push({
        startIndex: p.startIndex,
        endIndex: p.endIndex,
        options,
      })
    }
    
    const validPatternResults = patternResults.filter((p) => p.options.length > 0)
    if (validPatternResults.length === 0) {
      return NextResponse.json({ domains: [] })
    }
    
    // Generate all permutations
    const permutations = generatePermutations(pattern, validPatternResults)
    const validDomains = permutations
      .map((domain) => domain.toLowerCase())
      .filter((domain) => validator.isFQDN(domain, { require_tld: true }))
      .filter((domain, index, arr) => arr.indexOf(domain) === index)
    
    return NextResponse.json({ domains: validDomains })
    
  } catch (error) {
    console.error('Error expanding domains:', error)
    return NextResponse.json(
      { error: 'Failed to expand domains' },
      { status: 500 }
    )
  }
}