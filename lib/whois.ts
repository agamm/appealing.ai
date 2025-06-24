import axios from 'axios'
import { lookup as whoisLookup } from 'whois'
import { promisify } from 'util'
import { promises as dns } from 'dns'
import { Semaphore } from './semaphore'
import tldData from './tlds.json'

// TLDs that only have WHOIS (no RDAP)
const WHOIS_ONLY_TLDS = new Set([
  'io', 'sh', 'ac', 'tm', 'to', 'tk', 'gg', 'je', 'im', 
  'me', 'la', 'ly', 'so', 'sn', 'sc', 'vc', 'ws', 'be',
  'eu', 'at', 'priv.at', 'co.at', 'or.at', 'nu', 'ch',
  'li', 'de', 'it', 'nl', 'ro', 'ru', 'su', 'uk', 'co.uk',
  'org.uk', 'me.uk', 'ac.uk', 'gov.uk', 'plc.uk', 'ltd.uk'
])

// TLDs that require Porkbun API
const PORKBUN_ONLY_TLDS = new Set([
  'dev', 'app', 'page', 'gay', 'foo', 'zip', 'mov',
  'nexus', 'phd', 'prof', 'bot', 'dad', 'eat', 'how',
  'new', 'rsvp', 'day', 'boo', 'cal', 'channel', 'fly',
  'gdn', 'here', 'ing', 'meme', 'search', 'select', 'wow'
])

// Porkbun rate limiter: 1 request per 10 seconds
const porkbunSemaphore = new Semaphore(1, 10000)

// Cache for RDAP servers
const rdapServers: Array<[string[], string[]]> = tldData as Array<[string[], string[]]>

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
    if (WHOIS_ONLY_TLDS.has(sld) || PORKBUN_ONLY_TLDS.has(sld)) {
      return sld
    }
  }
  
  return parts[parts.length - 1]
}

function getRdapUrl(tld: string): string | null {
  const entry = rdapServers.find(([tlds]) => tlds.includes(tld))
  return entry ? entry[1][0].replace(/\/$/, '') : null
}

// Check if domain has DNS records
async function hasDnsRecords(domain: string): Promise<boolean> {
  try {
    const checks = await Promise.allSettled([
      dns.resolve4(domain),
      dns.resolve6(domain),
      dns.resolveCname(domain),
      dns.resolveMx(domain),
      dns.resolveNs(domain),
      dns.resolveTxt(domain)
    ])
    
    return checks.some(result => 
      result.status === 'fulfilled' && 
      result.value && 
      result.value.length > 0
    )
  } catch {
    return false
  }
}

// Check RDAP
async function hasRdapRecord(domain: string, rdapUrl: string): Promise<boolean> {
  try {
    await axios.get(`${rdapUrl}/domain/${domain}`, { timeout: 10000 })
    return true // Domain exists
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return false // Domain available
    }
    throw error
  }
}

// Check WHOIS
async function hasWhoisRecord(domain: string): Promise<boolean> {
  const response = await whoisLookupAsync(domain)
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
  
  // If any available pattern is found, domain is available (no record)
  return !availablePatterns.some(pattern => lowerResponse.includes(pattern))
}

// Check Porkbun
async function hasPorkbunRecord(domain: string): Promise<boolean> {
  const apiKey = process.env.PORKBUN_API_KEY
  const secretKey = process.env.PORKBUN_SECRET_KEY
  
  if (!apiKey || !secretKey) {
    throw new Error('Porkbun API credentials missing')
  }
  
  const { data } = await axios.post(
    `https://api.porkbun.com/api/json/v3/domain/check/${domain}`,
    {
      apikey: apiKey,
      secretapikey: secretKey
    },
    { 
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    }
  )
  
  // Domain is taken if avail is "no"
  return data.status === 'SUCCESS' && data.response?.avail === 'no'
}

// Main function
export async function isDomainAvailable(domain: string): Promise<boolean> {
  try {
    const cleanedDomain = cleanDomain(domain)
    const tld = extractTld(cleanedDomain)
    
    // 1. Check DNS first - fastest check
    const hasDns = await hasDnsRecords(cleanedDomain)
    if (hasDns) {
      return false
    }
    
    // 2. Check RDAP if available
    const rdapUrl = getRdapUrl(tld)
    if (rdapUrl && !WHOIS_ONLY_TLDS.has(tld) && !PORKBUN_ONLY_TLDS.has(tld)) {
      try {
        const hasRdap = await hasRdapRecord(cleanedDomain, rdapUrl)
        if (hasRdap) {
          return false
        }
      } catch {
        // RDAP check failed, continue to other methods
      }
    }
    
    // 3. For Porkbun-only TLDs
    if (PORKBUN_ONLY_TLDS.has(tld)) {
      const hasPorkbun = await porkbunSemaphore.run(() => hasPorkbunRecord(cleanedDomain))
      if (hasPorkbun) {
        return false
      }
      return true
    }
    
    // 4. Check WHOIS (for WHOIS-only TLDs or as fallback)
    const hasWhois = await hasWhoisRecord(cleanedDomain)
    if (hasWhois) {
      return false
    }
    
    return true
    
  } catch (error) {
    console.error(`Error checking domain ${domain}:`, error)
    // Conservative: assume taken on error
    return false
  }
}