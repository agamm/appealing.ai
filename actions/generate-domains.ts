"use server"

import { generateObject } from "ai"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { z } from "zod"
import validator from "validator"
import whois from "freewhois"

const openrouter = createOpenRouter({
  apiKey: "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",
})

export function extractPatterns(input: string): { pattern: string; startIndex: number; endIndex: number }[] {
  const patterns: { pattern: string; startIndex: number; endIndex: number }[] = []
  const regex = /\{\{([^{}]*)\}\}/g
  let match

  while ((match = regex.exec(input)) !== null) {
    patterns.push({
      pattern: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    })
  }

  return patterns
}

async function generateOptionsForPattern(pattern: string): Promise<string[]> {
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
- Return max 20 options`,
      prompt: `Generate options for: ${pattern}`,
      schema: z.object({
        options: z.array(z.string()),
      }),
    })

    return object.options.filter((option) => option.trim().length > 0)
  } catch (error) {
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

export function cartesianProduct<T>(...arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => {
      const result: T[][] = []
      for (const accItem of acc) {
        for (const currItem of curr) {
          result.push([...accItem, currItem])
        }
      }
      return result
    },
    [[]],
  )
}

export function generatePermutations(
  template: string,
  patternResults: { startIndex: number; endIndex: number; options: string[] }[],
): string[] {
  if (patternResults.length === 0) {
    return [template]
  }

  const sortedPatterns = [...patternResults].sort((a, b) => a.startIndex - b.startIndex)
  const optionArrays = sortedPatterns.map((p) => p.options)
  const combinations = cartesianProduct(...optionArrays)

  return combinations.map((combination) => {
    let result = template
    let offset = 0

    sortedPatterns.forEach((pattern, index) => {
      const replacement = combination[index]
      const adjustedStart = pattern.startIndex + offset
      const adjustedEnd = pattern.endIndex + offset
      const originalLength = adjustedEnd - adjustedStart

      result = result.slice(0, adjustedStart) + replacement + result.slice(adjustedEnd)
      offset += replacement.length - originalLength
    })

    return result
  })
}

async function checkDomainAvailability(domain: string): Promise<boolean> {
  try {
    const data = await whois(domain)

    console.log(`Domain ${domain} whois data:`, data)

    // If whois returns data with ldhName, domain is registered
    if (data && data.ldhName) {
      return false // Domain is taken
    }

    // If no ldhName in response, consider it available
    return true
  } catch (error: any) {
    console.error(`Error checking domain availability for ${domain}:`, error)
    // If error status is 404, domain is available
    if (error.status === 404 || error.response?.status === 404) {
      return true
    }
    // For other errors, assume domain might be taken (conservative approach)
    return true
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

export async function generateDomains(pattern: string): Promise<DomainSearchResult> {
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
      const options = await generateOptionsForPattern(p.pattern)
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
      .slice(0, 50) // Reduced limit for availability checking

    // Check availability for each domain
    const domainsWithAvailability = await Promise.all(
      validDomains.map(async (domain) => {
        const isAvailable = await checkDomainAvailability(domain)
        return { domain, isAvailable }
      }),
    )

    // Filter to only return available domains
    const availableDomains = domainsWithAvailability.filter((domain) => domain.isAvailable)

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
