import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import validator from 'validator'
import { generatePermutations } from '@/lib/patterns'
import { generateOptionsForPattern } from '@/lib/domain-expansion'

const requestSchema = z.object({
  query: z.string().min(1),
  unavailableDomains: z.array(z.string()), // Actually all previously generated domains to avoid duplicates
  patternResults: z.array(z.object({
    startIndex: z.number(),
    endIndex: z.number(),
    pattern: z.string(),
    options: z.array(z.string())
  }))
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, unavailableDomains, patternResults } = requestSchema.parse(body)
    
    // Generate new options for each pattern, accumulating all previously used options
    const newPatternResults: typeof patternResults = []
    const allGeneratedDomains = new Set(unavailableDomains.map(d => d.toLowerCase()))
    
    for (const patternResult of patternResults) {
      // Get all previously used options
      const allUsedOptions = new Set<string>()
      patternResult.options.forEach(opt => allUsedOptions.add(opt.toLowerCase()))
      
      // Generate new options
      const newOptions = await generateOptionsForPattern(
        patternResult.pattern, 
        Array.from(allUsedOptions)
      )
      
      // Filter to only truly new options
      const freshOptions = newOptions.filter(opt => 
        !allUsedOptions.has(opt.toLowerCase())
      )
      
      if (freshOptions.length > 0) {
        // Found new options - include all options (old + new)
        newPatternResults.push({
          startIndex: patternResult.startIndex,
          endIndex: patternResult.endIndex,
          pattern: patternResult.pattern,
          options: [...patternResult.options, ...freshOptions]
        })
      } else {
        // No new options for this pattern, but we still need it for permutations
        // Just use the existing options
        newPatternResults.push({
          startIndex: patternResult.startIndex,
          endIndex: patternResult.endIndex,
          pattern: patternResult.pattern,
          options: patternResult.options
        })
      }
    }
    
    // Check if any pattern got new options
    const hasNewOptions = patternResults.some((original, index) => {
      const updated = newPatternResults[index]
      return updated && updated.options.length > original.options.length
    })
    
    // Generate permutations regardless of whether we have new options
    // We might still have new combinations from existing options
    const permutations = generatePermutations(query, newPatternResults)
    
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
        patternResults: newPatternResults,
        message: "No more unique domain suggestions available"
      })
    }
    
    // Only show "no more suggestions" if we truly couldn't generate any new valid domains
    // and we have no pattern results
    if (validDomains.length === 0 && newPatternResults.length === 0) {
      return NextResponse.json({ 
        domains: [],
        query,
        patternResults: [],
        message: "No more unique domain suggestions available"
      })
    }
    
    // Return the domains and updated pattern results
    return NextResponse.json({ 
      domains: validDomains,
      query,
      patternResults: newPatternResults
    })
    
  } catch (error) {
    console.error('Error expanding more domains:', error)
    return NextResponse.json(
      { error: 'Failed to generate more domain suggestions' },
      { status: 500 }
    )
  }
}