import { resolve as dnsResolve } from 'dns'
import { promisify } from 'util'

const dnsResolveAsync = promisify(dnsResolve)

/**
 * Check if a domain exists by attempting DNS resolution
 * If the domain resolves to an IP address, it's taken
 * This is a fast and reliable check that should run early
 */
export async function checkDns(domain: string): Promise<boolean> {
  try {
    // Try to resolve A records (IPv4 addresses)
    const addresses = await dnsResolveAsync(domain, 'A')
    
    // If we get any IP addresses back, the domain exists and is taken
    if (addresses && addresses.length > 0) {
      return false // Domain is taken
    }
    
    // No A records found, domain might be available
    return true
  } catch (error: any) {
    // DNS resolution failed
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      // Domain doesn't exist in DNS, likely available
      return true
    }
    
    // For other errors (network issues, etc.), we can't determine availability
    // Return null to indicate we should try other methods
    throw new Error(`DNS check failed: ${error.message}`)
  }
}