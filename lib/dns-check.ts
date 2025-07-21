import { resolve as dnsResolve } from 'dns'
import { promisify } from 'util'

const dnsResolveAsync = promisify(dnsResolve)

/**
 * Check if a domain is definitely taken by attempting DNS resolution
 * If the domain resolves to an IP address, it's definitely taken
 * If no A records, result is inconclusive - domain could still be registered
 */
export async function checkDns(domain: string): Promise<boolean | null> {
  try {
    // Try to resolve A records (IPv4 addresses)
    const addresses = await dnsResolveAsync(domain, 'A')
    
    // If we get any IP addresses back, the domain exists and is taken
    if (addresses && addresses.length > 0) {
      return false // Domain is definitely taken
    }
    
    // No A records found - inconclusive, domain could be registered but not configured
    return null
  } catch (error) {
    // DNS resolution failed
    const nodeError = error as NodeJS.ErrnoException
    if (nodeError.code === 'ENOTFOUND' || nodeError.code === 'ENODATA') {
      // Domain doesn't exist in DNS - inconclusive about registration status
      return null
    }
    
    // For other errors (network issues, etc.), we can't determine availability
    throw new Error(`DNS check failed: ${nodeError.message || 'Unknown error'}`)
  }
}