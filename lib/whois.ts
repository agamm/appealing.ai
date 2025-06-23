import { readFileSync } from 'fs'
import { join } from 'path'
import axios from 'axios'
import { lookup as whoisLookup } from 'whois'
import { promisify } from 'util'

// Configuration
const TLDS_PATH = join(process.cwd(), 'actions', 'tlds.json')
const WHOIS_ONLY_TLDS = new Set([
  'io', 'sh', 'ac', 'tm', 'to', 'tk', 'gg', 'je', 'im', 
  'me', 'la', 'ly', 'so', 'sn', 'sc', 'vc', 'ws', 'be',
  'eu', 'at', 'priv.at', 'co.at', 'or.at', 'nu', 'ch',
  'li', 'de', 'it', 'nl', 'ro', 'ru', 'su', 'uk', 'co.uk',
  'org.uk', 'me.uk', 'ac.uk', 'gov.uk', 'plc.uk', 'ltd.uk'
])

// Types
interface WhoisResponse {
  ldhName?: string
  raw?: string
}

// Cache for RDAP servers
let rdapServers: Array<[string[], string[]]> | null = null

// Promisified whois lookup
const whoisLookupAsync = promisify(whoisLookup) as (domain: string) => Promise<string>

// Helper functions
function cleanDomain(domain: string): string {
  return domain
    .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
    .replace(/\/$/, '')
}

function extractTld(domain: string): string {
  const parts = domain.split('.')
  
  // Check for second-level TLDs (e.g., co.uk)
  if (parts.length > 2) {
    const sld = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`
    if (WHOIS_ONLY_TLDS.has(sld)) return sld
  }
  
  return parts[parts.length - 1]
}

function getRdapUrl(tld: string): string | null {
  // Load RDAP servers on first use
  if (!rdapServers) {
    rdapServers = JSON.parse(readFileSync(TLDS_PATH, 'utf-8'))
  }
  
  const entry = rdapServers?.find(([tlds]) => tlds.includes(tld))
  return entry ? entry[1][0].replace(/\/$/, '') : null
}

function isAvailableWhoisResponse(response: string): boolean {
  const lowerResponse = response.toLowerCase()
  
  const availablePatterns = [
    'domain not found',
    'no match for',
    'not found',
    'no entries found',
    'status: available',
    'no data found',
    'domain status: no object found'
  ]
  
  return availablePatterns.some(pattern => lowerResponse.includes(pattern))
}

// Main functions
async function checkRdap(domain: string, rdapUrl: string): Promise<WhoisResponse> {
  const { data } = await axios.get(`${rdapUrl}/domain/${domain}`, { timeout: 10000 })
  return data
}

async function checkWhois(domain: string): Promise<WhoisResponse> {
  const response = await whoisLookupAsync(domain)
  
  if (isAvailableWhoisResponse(response)) {
    return {} // Available
  }
  
  return { ldhName: domain, raw: response }
}

export async function whois(domain: string): Promise<WhoisResponse> {
  try {
    const cleanedDomain = cleanDomain(domain)
    const tld = extractTld(cleanedDomain)
    
    // Use whois for TLDs without RDAP
    if (WHOIS_ONLY_TLDS.has(tld)) {
      return await checkWhois(cleanedDomain)
    }
    
    // Try RDAP first
    const rdapUrl = getRdapUrl(tld)
    if (rdapUrl) {
      try {
        return await checkRdap(cleanedDomain, rdapUrl)
      } catch (error) {
        // 404 means domain is available
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return {}
        }
        // Fall through to whois on other errors
      }
    }
    
    // Fall back to whois
    return await checkWhois(cleanedDomain)
    
  } catch (error) {
    console.error(`Error checking domain ${domain}:`, error)
    // Conservative: assume taken on error
    return { ldhName: domain }
  }
}