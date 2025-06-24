import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import validator from 'validator'
import { generatePermutations } from '@/lib/patterns'
import { generateOptionsForPattern } from '@/lib/domain-expansion'

const requestSchema = z.object({
  pattern: z.string().min(1),
  unavailableDomains: z.array(z.string()),
  patternResults: z.array(z.object({
    startIndex: z.number(),
    endIndex: z.number(),
    options: z.array(z.string())
  }))
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pattern, unavailableDomains, patternResults } = requestSchema.parse(body)
    
    // Generate new options for each pattern, excluding what was already used
    const newPatternResults = []
    
    for (const patternResult of patternResults) {
      // Extract the pattern text from the original pattern string
      const patternText = pattern.substring(patternResult.startIndex + 2, patternResult.endIndex - 2)
      
      // Extract what options were already used from unavailable domains
      const usedOptions = new Set<string>()
      const beforePattern = pattern.substring(0, patternResult.startIndex)
      const afterPattern = pattern.substring(patternResult.endIndex)
      
      unavailableDomains.forEach(domain => {
        let extracted = domain
        
        // Remove prefix if it exists
        if (beforePattern && domain.startsWith(beforePattern)) {
          extracted = extracted.substring(beforePattern.length)
        }
        
        // Remove suffix if it exists  
        if (afterPattern) {
          const suffixIndex = extracted.indexOf(afterPattern)
          if (suffixIndex !== -1) {
            extracted = extracted.substring(0, suffixIndex)
          }
        }
        
        if (extracted && extracted.length > 0) {
          usedOptions.add(extracted.toLowerCase())
        }
      })
      
      // Generate new options excluding the used ones
      const newOptions = await generateOptionsForPattern(
        patternText, 
        Array.from(usedOptions)
      )
      
      if (newOptions.length > 0) {
        newPatternResults.push({
          startIndex: patternResult.startIndex,
          endIndex: patternResult.endIndex,
          options: newOptions
        })
      }
    }
    
    if (newPatternResults.length === 0) {
      return NextResponse.json({ domains: [] })
    }
    
    // Generate new permutations
    const permutations = generatePermutations(pattern, newPatternResults)
    const validDomains = permutations
      .map((domain) => domain.toLowerCase())
      .filter((domain) => validator.isFQDN(domain, { require_tld: true }))
      .filter((domain, index, arr) => arr.indexOf(domain) === index)
      .filter((domain) => !unavailableDomains.includes(domain))
      .slice(0, 50)
    
    // If no new domains were generated, indicate we're done
    if (validDomains.length === 0) {
      return NextResponse.json({ 
        domains: [],
        pattern,
        patternResults: newPatternResults,
        message: "No more unique domain suggestions available"
      })
    }
    
    return NextResponse.json({ 
      domains: validDomains,
      pattern,
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