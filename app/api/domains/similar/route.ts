import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import validator from 'validator'
import { generateObject } from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
})

const requestSchema = z.object({
  savedDomains: z.array(z.string()).min(1),
  pattern: z.string().nullable().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { savedDomains, pattern } = requestSchema.parse(body)
    
    // Generate similar domains based on pattern and saved domains
    const { object } = await generateObject({
      model: openrouter("openai/gpt-4o-mini"),
      system: `You are a domain name generator. Generate new domain names based on the provided pattern and saved domains.

Rules:
- If a pattern is provided (e.g., "{{animals}}.ai"), generate domains that follow this exact pattern
- Look at the saved domains to understand what the user likes
- Generate domains that are similar in style, theme, and format to the saved ones
- Maintain the same structure and TLDs as the pattern/saved domains
- Keep domains short, memorable, and professional
- Generate 30-50 complete domain names (e.g., "example.com")
- Do NOT repeat any of the saved domains`,
      prompt: pattern 
        ? `Pattern: ${pattern}\nSaved domains the user liked: ${savedDomains.join(', ')}\n\nGenerate new domains following the pattern that are similar to what the user saved.`
        : `Saved domains: ${savedDomains.join(', ')}\n\nGenerate similar domain names that would appeal to someone who liked these.`,
      temperature: 0.9,
      schema: z.object({
        domains: z.array(z.string()),
      }),
    })

    // Validate generated domains
    const validDomains = object.domains
      .map((domain) => domain.toLowerCase())
      .filter((domain) => validator.isFQDN(domain, { require_tld: true }))
      .filter((domain, index, arr) => arr.indexOf(domain) === index) // Remove duplicates
      .filter((domain) => !savedDomains.includes(domain)) // Don't suggest already saved domains
      .slice(0, 50) // Limit results
    
    return NextResponse.json({ domains: validDomains })
    
  } catch (error) {
    console.error('Error expanding saved domains:', error)
    return NextResponse.json(
      { error: 'Failed to generate similar domain suggestions' },
      { status: 500 }
    )
  }
}