import { readFileSync } from 'fs'
import { join } from 'path'
import axios from 'axios'
import { lookup as whoisLookup } from 'whois'
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
const whoisLookupAsync = promisify(whoisLookup) as (domain: string) => Promise<string>

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
  
  // Check if this looks like a domain registration record first
  const registrationIndicators = [
    'domain name:',
    'registrar:',
    'creation date:',
    'created:',
    'registry domain id:',
    'registrant',
    'name server',
    'expiry date:',
    'expires:'
  ]
  
  const hasRegistrationInfo = registrationIndicators.some(indicator => 
    lowerResponse.includes(indicator)
  )
  
  // If we found registration information, the domain is taken
  if (hasRegistrationInfo) {
    return false
  }
  
  // Only check "not found" patterns if we didn't find registration info
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
    
    // Try DNS check as second option (fast and reliable)
    try {
      return await checkDns(cleanedDomain)
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