import { describe, it, expect } from 'vitest'
import { generateNamecheapAffiliateLink } from '@/lib/affiliate-links'

describe('Affiliate Links', () => {
  describe('generateNamecheapAffiliateLink', () => {
    it('should generate correct affiliate link for a simple domain', () => {
      const domain = 'example.com'
      const expectedUrl = 'http://www.anrdoezrs.net/links/22222/type/dlg/https://www.namecheap.com/domains/registration/results.aspx?domain=example.com'
      
      expect(generateNamecheapAffiliateLink(domain)).toBe(expectedUrl)
    })

    it('should properly handle domain names with special characters', () => {
      const domain = 'my-domain.com'
      const expectedUrl = 'http://www.anrdoezrs.net/links/22222/type/dlg/https://www.namecheap.com/domains/registration/results.aspx?domain=my-domain.com'
      
      expect(generateNamecheapAffiliateLink(domain)).toBe(expectedUrl)
    })

    it('should handle domains with spaces (though they are invalid)', () => {
      const domain = 'my domain.com'
      const expectedUrl = 'http://www.anrdoezrs.net/links/22222/type/dlg/https://www.namecheap.com/domains/registration/results.aspx?domain=my domain.com'
      
      expect(generateNamecheapAffiliateLink(domain)).toBe(expectedUrl)
    })

    it('should handle international domains', () => {
      const domain = '例え.com'
      const expectedUrl = 'http://www.anrdoezrs.net/links/22222/type/dlg/https://www.namecheap.com/domains/registration/results.aspx?domain=例え.com'
      
      expect(generateNamecheapAffiliateLink(domain)).toBe(expectedUrl)
    })
  })
})