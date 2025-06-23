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
  pattern: z.string().min(1),
  unavailableDomains: z.array(z.string())
})

async function generateMoreOptionsForPattern(
  pattern: string, 
  patternPart: string,
  unavailableDomains: string[],
  patternStartIndex: number,
  patternEndIndex: number
): Promise<string[]> {
  // Extract what was used in unavailable domains for this specific pattern
  const usedOptions = new Set<string>()
  
  // Get the template before and after the pattern
  const beforePattern = pattern.substring(0, patternStartIndex)
  const afterPattern = pattern.substring(patternEndIndex)
  
  unavailableDomains.forEach(domain => {
    // Remove the static parts to extract what was used for this pattern
    let extracted = domain
    
    // Remove prefix if it exists
    if (beforePattern && domain.startsWith(beforePattern)) {
      extracted = extracted.substring(beforePattern.length)
    }
    
    // Remove suffix if it exists
    if (afterPattern) {
      // Find where the suffix starts in the extracted part
      const suffixIndex = extracted.indexOf(afterPattern)
      if (suffixIndex !== -1) {
        extracted = extracted.substring(0, suffixIndex)
      }
    }
    
    if (extracted && extracted.length > 0) {
      usedOptions.add(extracted.toLowerCase())
    }
  })

  try {
    const { object } = await generateObject({
      model: openrouter("openai/gpt-4o-mini"),
      system: `Generate NEW options for the pattern "${patternPart}". Rules:
- Generate ONLY the replacement text for the pattern, not the full domain
- For example, if pattern is "animals", generate: bear, eagle, tiger
- Do NOT include the domain extension or other parts
- Generate words/options that are conceptually similar but different from what was tried
- Keep words lowercase and simple
- Suitable for domain names (short, memorable)
- Return 20-30 new options
- IMPORTANT: These options were already tried and should NOT be generated: ${Array.from(usedOptions).join(', ')}`,
      prompt: `Pattern part: ${patternPart}
      
Examples of what was already used: ${Array.from(usedOptions).slice(0, 10).join(', ')}

Generate NEW alternatives that fit the pattern but are different.`,
      temperature: 0.9,
      schema: z.object({
        options: z.array(z.string()),
      }),
    })

    return object.options
      .filter((option) => option.trim().length > 0)
      .filter((option) => !usedOptions.has(option.toLowerCase()))
      .filter((option) => !option.includes('.')) // Ensure no domain extensions in options
  } catch {
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pattern, unavailableDomains } = requestSchema.parse(body)
    
    const patterns = extractPatterns(pattern)
    
    // If no patterns, can't generate more
    if (patterns.length === 0) {
      return NextResponse.json({ domains: [] })
    }
    
    // Generate new options for each pattern based on what didn't work
    const patternResults = []
    for (let i = 0; i < patterns.length; i++) {
      const p = patterns[i]
      const options = await generateMoreOptionsForPattern(
        pattern,
        p.pattern,
        unavailableDomains,
        p.startIndex,
        p.endIndex
      )
      
      if (options.length > 0) {
        patternResults.push({
          startIndex: p.startIndex,
          endIndex: p.endIndex,
          options,
        })
      }
    }
    
    if (patternResults.length === 0) {
      return NextResponse.json({ domains: [] })
    }
    
    // Generate new permutations
    const permutations = generatePermutations(pattern, patternResults)
    const validDomains = permutations
      .map((domain) => domain.toLowerCase())
      .filter((domain) => validator.isFQDN(domain, { require_tld: true }))
      .filter((domain, index, arr) => arr.indexOf(domain) === index)
      .filter((domain) => !unavailableDomains.includes(domain)) // Don't suggest already tried domains
      .slice(0, 50) // Limit results
    
    return NextResponse.json({ domains: validDomains })
    
  } catch (error) {
    console.error('Error expanding more domains:', error)
    return NextResponse.json(
      { error: 'Failed to generate more domain suggestions' },
      { status: 500 }
    )
  }
}