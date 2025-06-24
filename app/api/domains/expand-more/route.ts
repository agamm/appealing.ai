import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import validator from 'validator'
import { generatePermutations, extractPatterns } from '@/lib/patterns'
import { generateOptionsForPattern } from '@/lib/domain-expansion'

const requestSchema = z.object({
  query: z.string().min(1),
  generatedDomains: z.array(z.string()), // All previously generated domains to avoid duplicates
  options: z.record(z.array(z.string())) // Options by index: {"0": ["opt1", "opt2"], "1": ["opt3", "opt4"]}
})

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
      const freshOptions = await generateOptionsForPattern(
        patterns[i].pattern, 
        Array.from(allUsedOptions)
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