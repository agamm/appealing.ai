import { checkDns } from '../lib/dns-check'

describe('DNS Check', () => {
  it('should return false (taken) for a known existing domain', async () => {
    const result = await checkDns('google.com')
    expect(result).toBe(false)
  })

  it('should return false (taken) for jot.io specifically', async () => {
    const result = await checkDns('jot.io')
    expect(result).toBe(false)
  })

  it('should return null (inconclusive) for a domain that likely does not exist', async () => {
    const result = await checkDns('thisdomainalmostcertainlydoesnotexistanywhere12345.com')
    expect(result).toBe(null)
  })

  it('should handle non-existent TLD gracefully', async () => {
    // This should fail DNS resolution and return null (inconclusive)
    const result = await checkDns('example.invalidtldthatdoesnotexist')
    expect(result).toBe(null)
  })
})