import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import validator from 'validator'
import { generatePermutations, extractPatterns } from '@/lib/patterns'
import { generateObject } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

const requestSchema = z.object({
  query: z.string().min(1),
  generatedDomains: z.array(z.string()), // All previously generated domains to avoid duplicates
  options: z.record(z.array(z.string())) // Options by index: {"0": ["opt1", "opt2"], "1": ["opt3", "opt4"]}
})

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
      model: openrouter("openai/gpt-4o-mini:floor"),
      system: `Generate NEW options for domain patterns that are DIFFERENT from the excluded list.
Rules:
- CRITICAL: Generate ONLY new options that are NOT in the excluded list
- Keep words lowercase
- When pattern asks for "X words", generate X individual single words
- No multi-word phrases or spaces
- No TLDs (.com etc.)
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
      .filter((option) => !option.includes('.'))
      .filter((option) => !option.includes(' '))
      .filter((option) => !lowerExcluded.has(option.toLowerCase()))
      .slice(0, 20)
  } catch (error) {
    console.error('Failed to generate options for pattern:', pattern, error)
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, generatedDomains, options: previousOptions } = requestSchema.parse(body)
    
    // Extract patterns from query
    const patterns = extractPatterns(query)
    
    // Limit to maximum 4 patterns
    if (patterns.length > 4) {
      return NextResponse.json({ 
        error: 'Too many patterns. Maximum 4 patterns allowed per query.',
        domains: [], 
        query, 
        options: {},
        message: 'Too many patterns'
      }, { status: 400 })
    }
    
    const allGeneratedDomains = new Set(generatedDomains.map(d => d.toLowerCase()))
    
    // Generate new options for each pattern
    const newOptions: Record<string, string[]> = {}
    const combinedOptions: Record<string, string[]> = {}
    let hasNewOptions = false
    
    for (let i = 0; i < patterns.length; i++) {
      const index = i.toString()
      const previousOpts = previousOptions[index] || []
      const allUsedOptions = new Set(previousOpts.map(opt => opt.toLowerCase()))
      
      // Generate new options excluding previously used ones
      const freshOptions = await generateOptionsForPatternWithExclusions(
        patterns[i].pattern, 
        previousOpts // Pass only the options we already have for this pattern
      )
      
      // Filter to only truly new options
      const uniqueFreshOptions = freshOptions.filter(opt => 
        !allUsedOptions.has(opt.toLowerCase())
      )
      
      if (uniqueFreshOptions.length > 0) {
        // Store only the new options to return
        newOptions[index] = uniqueFreshOptions
        // Store combined options for permutation generation
        combinedOptions[index] = [...previousOpts, ...uniqueFreshOptions]
        hasNewOptions = true
      } else {
        // No new options for this pattern - return empty array
        newOptions[index] = []
        // Keep existing options for permutation generation
        combinedOptions[index] = previousOpts
      }
    }
    
    // Generate permutations with the combined options (old + new)
    const permutations = generatePermutations(query, combinedOptions)
    
    const validDomains = permutations
      .map((domain) => domain.toLowerCase())
      .filter((domain) => validator.isFQDN(domain, { require_tld: true }))
      .filter((domain, index, arr) => arr.indexOf(domain) === index)
      .filter((domain) => !allGeneratedDomains.has(domain))
      .slice(0, 50)
    
    // If no new options AND no new valid domains, then we're truly out
    if (!hasNewOptions && validDomains.length === 0) {
      return NextResponse.json({ 
        domains: [],
        query,
        options: newOptions, // Return empty new options
        message: "No more unique domain suggestions available"
      })
    }
    
    // Return the domains and only the NEW options
    return NextResponse.json({ 
      domains: validDomains,
      query,
      options: newOptions
    })
    
  } catch (error) {
    console.error('Error expanding more domains:', error)
    return NextResponse.json(
      { error: 'Failed to generate more domain suggestions' },
      { status: 500 }
    )
  }
}