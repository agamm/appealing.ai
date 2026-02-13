import { readFileSync } from 'fs'
import { join } from 'path'
import axios from 'axios'
import whois from 'whois'
import { promisify } from 'util'
import { Semaphore } from './semaphore'
import { checkDns } from './dns-check'

// Configuration
const TLDS_PATH = join(process.cwd(), 'lib', 'tlds.json')

// Rate limiter for Domainr API
const domainrSemaphore = new Semaphore(1, 200) // 1 requests per 200ms

// Cache for RDAP servers
let rdapServers: Array<[string[], string[]]> | null = null

// Promisified whois lookup
const whoisLookupAsync = promisify(whois.lookup) as (domain: string) => Promise<string>

// Helper functions
function cleanDomain(domain: string): string {
  return domain
    .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
    .replace(/\/$/, '')
}

function extractTld(domain: string): string {
  const parts = domain.split('.')
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
  
  // First, check for explicit "not found" patterns - these should take precedence
  // over any incidental mentions of registration terms in legal disclaimers
  const availablePatterns = [
    'domain not found',
    'no match for',
    'not found',
    'no entries found',
    'status: available',
    'no data found',
    'domain status: no object found'
  ]
  
  const hasAvailablePattern = availablePatterns.some(pattern => lowerResponse.includes(pattern))
  if (hasAvailablePattern) {
    return true
  }
  
  // Only if we don't have explicit "not found" patterns, check for registration info
  // We need to be more specific about registration indicators to avoid false positives
  // from legal disclaimers that mention "registrant" in general terms
  const registrationIndicators = [
    'domain name:',
    'registrar:',
    'creation date:',
    'created:',
    'registry domain id:',
    'registrant name:',  // More specific than just "registrant"
    'registrant organization:',  // More specific
    'name server:',  // More specific than just "name server"
    'name servers:',
    'expiry date:',
    'expires:'
  ]
  
  const hasRegistrationInfo = registrationIndicators.some(indicator => 
    lowerResponse.includes(indicator)
  )
  
  // If we found specific registration information, the domain is taken
  if (hasRegistrationInfo) {
    return false
  }
  
  // If we don't have clear indicators either way, assume taken (conservative approach)
  return false
}

// Check domain availability using Domainr API
async function checkDomainrStatus(domain: string): Promise<boolean> {
  const apiKey = process.env.DOMAINR_RAPIDAPI_KEY
  
  if (!apiKey) {
    throw new Error('Domainr API key missing')
  }
  
  try {
    const { data } = await axios.get('https://domainr.p.rapidapi.com/v2/status', {
      params: { domain },
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'domainr.p.rapidapi.com'
      },
      timeout: 10000
    })
    
    // Check the status array for the domain
    if (data.status && Array.isArray(data.status)) {
      const domainStatus = data.status.find((s: { domain: string; status: string }) => s.domain === domain)
      if (domainStatus) {
        // Domainr status codes:
        // - 'active' or 'inactive' means domain is taken
        // - 'undelegated' means available
        // - 'unknown' means we should assume taken to be safe
        return domainStatus.status === 'undelegated' || domainStatus.status === 'undelegated inactive'
      }
    }
    
    // If we can't determine status, assume taken
    return false
  } catch (error) {
    console.error(`Error checking domain ${domain} with Domainr:`, error)
    throw error
  }
}

// Main functions
async function checkRdap(domain: string, rdapUrl: string): Promise<boolean> {
  try {
    await axios.get(`${rdapUrl}/domain/${domain}`, { timeout: 10000 })
    return false // Domain exists
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return true // Domain available
    }
    throw error
  }
}

async function checkWhois(domain: string): Promise<boolean> {
  const response = await whoisLookupAsync(domain)
  return isAvailableWhoisResponse(response)
}

export async function isDomainAvailable(domain: string): Promise<boolean> {
  try {
    const cleanedDomain = cleanDomain(domain)
    const tld = extractTld(cleanedDomain)
    
    // Try RDAP first
    const rdapUrl = getRdapUrl(tld)
    if (rdapUrl) {
      try {
        return await checkRdap(cleanedDomain, rdapUrl)
      } catch {
        // RDAP failed, try next method
        console.log(`RDAP check failed for ${domain}`)
      }
    }
    
    // Try DNS check as second option (only stops if definitely taken)
    try {
      const dnsResult = await checkDns(cleanedDomain)
      if (dnsResult === false) {
        // Domain has A records, definitely taken
        return false
      }
      // dnsResult is null (inconclusive), continue to WHOIS
    } catch {
      console.log(`DNS check failed for ${domain}`)
    }
    
    // Try WHOIS as third option
    try {
      return await checkWhois(cleanedDomain)
    } catch {
      console.log(`WHOIS check failed for ${domain}`)
    }
    
    // Use Domainr API as final fallback with rate limiting
    console.log(`Using Domainr API for ${domain}`)
    const isAvailable = await domainrSemaphore.run(() => checkDomainrStatus(cleanedDomain))
    return isAvailable
    
  } catch (error) {
    console.error(`Error checking domain ${domain}:`, error)
    // Conservative: assume taken on error
    return false
  }
}