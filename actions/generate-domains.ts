"use server"

import { generateObject } from "ai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { z } from "zod"
import validator from "validator"
import { extractPatterns, generatePermutations } from "@/lib/domain-utils"

import { isDomainAvailable } from "@/lib/whois"

const openrouter = createOpenRouter({
  apiKey: "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",
})


async function generateOptionsForPattern(pattern: string, excludedOptions: string[] = []): Promise<string[]> {
  // Handle simple slash patterns first
  if (pattern.includes("/") && !pattern.includes("with") && !pattern.includes("without")) {
    return pattern
      .split("/")
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0)
  }

  try {
    const { object } = await generateObject({
      model: openrouter("openai/gpt-4.1-nano"),
      system: `Generate options for domain patterns. Rules:
- If pattern contains "/" return those exact options
- For "dictionary word" return common English words suitable for domains
- For "with/without -" include both versions
- Common prefixes: get, try, use
- Keep words lowercase and simple
- When pattern asks for "words similar to <word>" return words similar to <word> but also <word>.
- When pattern asks for "words like <word>" don't return "<word>like" or "<word>dup"...
- Return max 50 options
- Unless constrained by pattern, return at least 5 options
${excludedOptions.length > 0 ? `- DO NOT generate these options that were already tried: ${excludedOptions.join(', ')}` : ''}`,
      prompt: `Generate options for the following pattern: ${pattern}${excludedOptions.length > 0 ? `\n\nDO NOT generate these options: ${excludedOptions.join(', ')}` : ''}`,
      temperature: 0.7,
      schema: z.object({
        options: z.array(z.string()),
      }),
    })

    return object.options.filter((option) => option.trim().length > 0)
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



async function checkDomainAvailability(domain: string): Promise<boolean> {
  try {
    const isAvailable = await isDomainAvailable(domain)
    
    if (isAvailable) {
      console.log(`Available domain found: ${domain}`)
    }
    
    return isAvailable
  } catch (error) {
    console.error(`Error checking domain availability for ${domain}:`, error)
    // Conservative: assume taken on error
    return false
  }
}

export interface DomainWithAvailability {
  domain: string
  isAvailable: boolean | null // null means checking
}

export interface DomainSearchResult {
  domains: DomainWithAvailability[]
  totalChecked: number
  availableCount: number
}

export async function generateDomains(pattern: string, excludedDomains: string[] = []): Promise<DomainSearchResult> {
  try {
    const patterns = extractPatterns(pattern)

    if (patterns.length === 0) {
      const isValid = validator.isFQDN(pattern, { require_tld: true })
      if (!isValid) return { domains: [], totalChecked: 0, availableCount: 0 }

      const isAvailable = await checkDomainAvailability(pattern)
      const domains = isAvailable ? [{ domain: pattern, isAvailable }] : []
      return {
        domains,
        totalChecked: 1,
        availableCount: isAvailable ? 1 : 0,
      }
    }

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
      return { domains: [], totalChecked: 0, availableCount: 0 }
    }

    const permutations = generatePermutations(pattern, validPatternResults)

    const validDomains = permutations
      .map((domain) => domain.toLowerCase())
      .filter((domain) => validator.isFQDN(domain, { require_tld: true }))
      .filter((domain, index, arr) => arr.indexOf(domain) === index)
      .filter((domain) => !excludedDomains.includes(domain)) // Exclude previously tried domains

    // Check availability for each domain with concurrency limit for Porkbun domains
    const domainsWithAvailability: Array<{ domain: string; isAvailable: boolean }> = []
    
    // Group domains by TLD to handle Porkbun rate limiting
    const porkbunDomains = validDomains.filter(domain => {
      const tld = domain.split('.').pop() || ''
      return ['dev', 'app', 'page', 'gay', 'foo', 'zip', 'mov'].includes(tld)
    })
    const otherDomains = validDomains.filter(domain => !porkbunDomains.includes(domain))
    
    // Check non-Porkbun domains in parallel
    const otherResults = await Promise.all(
      otherDomains.map(async (domain) => {
        const isAvailable = await checkDomainAvailability(domain)
        return { domain, isAvailable }
      })
    )
    domainsWithAvailability.push(...otherResults)
    
    // Check Porkbun domains sequentially (they'll be rate-limited internally)
    for (const domain of porkbunDomains) {
      const isAvailable = await checkDomainAvailability(domain)
      domainsWithAvailability.push({ domain, isAvailable })
    }

    // Filter to only return available domains
    const availableDomains = domainsWithAvailability.filter((domain) => domain.isAvailable)
    
    // If no available domains found and we haven't excluded any yet, retry with exclusions
    if (availableDomains.length === 0 && excludedDomains.length === 0 && validDomains.length > 0) {
      console.log(`No available domains found from ${validDomains.length} attempts, generating new options...`)
      
      // Tell the AI to generate different options
      const newPatternResults = []
      for (const p of patterns) {
        const options = await generateOptionsForPattern(p.pattern, validDomains)
        newPatternResults.push({
          startIndex: p.startIndex,
          endIndex: p.endIndex,
          options,
        })
      }
      
      const newValidPatternResults = newPatternResults.filter((p) => p.options.length > 0)
      if (newValidPatternResults.length > 0) {
        return generateDomains(pattern, validDomains)
      }
    }

    return {
      domains: availableDomains,
      totalChecked: domainsWithAvailability.length,
      availableCount: availableDomains.length,
    }
  } catch (error) {
    console.error("Error generating domains:", error)
    return { domains: [], totalChecked: 0, availableCount: 0 }
  }
}
