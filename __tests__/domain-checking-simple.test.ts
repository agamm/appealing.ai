import { describe, it, expect } from 'vitest'
import { isDomainAvailable } from '@/lib/whois'

describe('Domain Availability Integration Tests', () => {
  describe('Real domain checks', () => {
    it('should return false (not available) for example.com', { timeout: 20000 }, async () => {
      // This is a real test that will actually check example.com
      // example.com is a reserved domain that should always exist
      const result = await isDomainAvailable('example.com')
      expect(result).toBe(false)
    })

    it('should return true (available) for exampleforsurenottakenderp.com', { timeout: 20000 }, async () => {
      // This is a real test that will check a domain that's very unlikely to exist
      const result = await isDomainAvailable('exampleforsurenottakenderp.com')
      expect(result).toBe(true)
    })
  })
})