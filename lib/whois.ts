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

// TLDs that require Porkbun API
const PORKBUN_ONLY_TLDS = new Set([
  'dev', 'app', 'page', 'gay', 'foo', 'zip', 'mov',
  'nexus', 'phd', 'prof', 'bot', 'dad', 'eat', 'how',
  'new', 'rsvp', 'day', 'boo', 'cal', 'channel', 'fly',
  'gdn', 'here', 'ing', 'meme', 'search', 'select', 'wow'
])

// Types

// Cache for RDAP servers
let rdapServers: Array<[string[], string[]]> | null = null

// Rate limiting for Porkbun API
const porkbunRateLimit = {
  lastCheck: 0,
  minInterval: 10000, // 10 seconds minimum between checks
  queue: [] as Array<{domain: string, resolve: (value: boolean) => void, reject: (error: unknown) => void}>
}

let porkbunQueueProcessor: NodeJS.Timeout | null = null

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

async function processPorkbunQueue() {
  if (porkbunRateLimit.queue.length === 0) {
    porkbunQueueProcessor = null
    return
  }
  
  const now = Date.now()
  const timeSinceLastCheck = now - porkbunRateLimit.lastCheck
  
  if (timeSinceLastCheck < porkbunRateLimit.minInterval) {
    // Wait before processing next request
    const waitTime = porkbunRateLimit.minInterval - timeSinceLastCheck
    console.log(`Rate limiting: waiting ${waitTime}ms before next Porkbun check`)
    porkbunQueueProcessor = setTimeout(processPorkbunQueue, waitTime)
    return
  }
  
  const { domain, resolve, reject } = porkbunRateLimit.queue.shift()!
  porkbunRateLimit.lastCheck = now
  
  try {
    const result = await checkPorkbunDirect(domain)
    resolve(result)
  } catch (error) {
    reject(error)
  }
  
  // Process next item in queue
  if (porkbunRateLimit.queue.length > 0) {
    porkbunQueueProcessor = setTimeout(processPorkbunQueue, 100)
  }
}

async function checkPorkbunDirect(domain: string): Promise<boolean> {
  const apiKey = process.env.PORKBUN_API_KEY
  const secretKey = process.env.PORKBUN_SECRET_KEY
  
  if (!apiKey || !secretKey) {
    console.error('Porkbun API credentials not found in environment variables')
    throw new Error('Porkbun API credentials missing')
  }
  
  try {
    console.log(`Checking domain ${domain} via Porkbun API`)
    const url = `https://api.porkbun.com/api/json/v3/domain/checkDomain/${domain}`
    const payload = {
      apikey: apiKey,
      secretapikey: secretKey
    }
    
    const { data } = await axios.post(url, payload, { 
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    // Check rate limit info
    if (data.limits) {
      console.log(`Porkbun rate limit: ${data.limits.naturalLanguage}`)
      // Adjust rate limit if needed based on response
      if (data.limits.TTL) {
        porkbunRateLimit.minInterval = parseInt(data.limits.TTL) * 1000
      }
    }
    
    // Check if the response indicates availability
    if (data.status === 'SUCCESS' && data.response?.avail === 'yes') {
      console.log(`Domain ${domain} is available via Porkbun`)
      return true
    }
    
    console.log(`Domain ${domain} is NOT available via Porkbun`)
    return false
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Porkbun API error for ${domain}:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      
      // If rate limited, adjust interval
      if (error.response?.status === 429) {
        porkbunRateLimit.minInterval = 30000 // 30 seconds on rate limit
        console.log('Porkbun rate limit hit, increasing interval to 30s')
      }
    } else {
      console.error(`Porkbun API error for ${domain}:`, error)
    }
    throw error
  }
}

async function checkPorkbun(domain: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    porkbunRateLimit.queue.push({ domain, resolve, reject })
    
    if (!porkbunQueueProcessor) {
      processPorkbunQueue()
    }
  })
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
    
    // Use Porkbun API for specific TLDs
    if (PORKBUN_ONLY_TLDS.has(tld)) {
      return await checkPorkbun(cleanedDomain)
    }
    
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
        // Fall through to whois on non-404 errors
        if (!axios.isAxiosError(error) || error.response?.status !== 404) {
          // Try whois as fallback
        }
      }
    }
    
    // Fall back to whois
    return await checkWhois(cleanedDomain)
    
  } catch (error) {
    console.error(`Error checking domain ${domain}:`, error)
    // Conservative: assume taken on error
    return false
  }
}