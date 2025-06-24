import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import validator from 'validator'
import { extractPatterns, generatePermutations } from '@/lib/patterns'
import { generateOptionsForPattern } from '@/lib/domain-expansion'

const requestSchema = z.object({
  query: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = requestSchema.parse(body)
    
    const patterns = extractPatterns(query)
    
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
      const patternOptions = await generateOptionsForPattern(patterns[i].pattern, [])
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
    
    return NextResponse.json({ 
      domains: validDomains,
      query,
      options
    })
    
  } catch {
    console.error('Error expanding domains')
    return NextResponse.json(
      { error: 'Failed to expand domains' },
      { status: 500 }
    )
  }
}