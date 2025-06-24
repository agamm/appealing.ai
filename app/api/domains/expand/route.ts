import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import validator from 'validator'
import { extractPatterns, generatePermutations } from '@/lib/patterns'
import { generateOptionsForPattern } from '@/lib/domain-expansion'
import { captureEvent } from '@/lib/posthog-server'

const requestSchema = z.object({
  query: z.string().min(1)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = requestSchema.parse(body)
    
    // Log the domain expansion query
    await captureEvent('domain_expansion_query', {
      query,
      timestamp: new Date().toISOString(),
      has_patterns: query.includes('{{'),
      pattern_count: (query.match(/\{\{[^}]*\}\}/g) || []).length
    })
    
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