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
        return NextResponse.json({ domains: [] })
      }
      return NextResponse.json({ domains: [query] })
    }
    
    // Generate options for each pattern
    const patternResults = []
    for (const p of patterns) {
      const options = await generateOptionsForPattern(p.pattern, [])
      patternResults.push({
        startIndex: p.startIndex,
        endIndex: p.endIndex,
        pattern: p.pattern,
        options,
      })
    }
    
    const validPatternResults = patternResults.filter((p) => p.options.length > 0)
    if (validPatternResults.length === 0) {
      return NextResponse.json({ domains: [] })
    }
    
    // Generate all permutations
    const permutations = generatePermutations(query, validPatternResults)
    const validDomains = permutations
      .map((domain) => domain.toLowerCase())
      .filter((domain) => validator.isFQDN(domain, { require_tld: true }))
      .filter((domain, index, arr) => arr.indexOf(domain) === index)
    
    return NextResponse.json({ 
      domains: validDomains,
      query,
      patternResults: validPatternResults
    })
    
  } catch {
    console.error('Error expanding domains')
    return NextResponse.json(
      { error: 'Failed to expand domains' },
      { status: 500 }
    )
  }
}