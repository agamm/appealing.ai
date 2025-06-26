import { describe, it, expect } from 'vitest'
import { generateNamecheapAffiliateLink } from '@/lib/affiliate-links'

describe('Affiliate Links', () => {
  describe('generateNamecheapAffiliateLink', () => {
    it('should generate correct affiliate link for a simple domain', () => {
      const domain = 'example.com'
      const expectedUrl = 'https://www.qksrv.net/links/101473094/type/am/sid/4055157/https://www.namecheap.com/domains/registration/results/?domain=example.com'
      
      expect(generateNamecheapAffiliateLink(domain)).toBe(expectedUrl)
    })

    it('should properly handle domain names with special characters', () => {
      const domain = 'my-domain.com'
      const expectedUrl = 'https://www.qksrv.net/links/101473094/type/am/sid/4055157/https://www.namecheap.com/domains/registration/results/?domain=my-domain.com'
      
      expect(generateNamecheapAffiliateLink(domain)).toBe(expectedUrl)
    })

    it('should handle domains with spaces (though they are invalid)', () => {
      const domain = 'my domain.com'
      const expectedUrl = 'https://www.qksrv.net/links/101473094/type/am/sid/4055157/https://www.namecheap.com/domains/registration/results/?domain=my%20domain.com'
      
      expect(generateNamecheapAffiliateLink(domain)).toBe(expectedUrl)
    })

    it('should handle international domains', () => {
      const domain = '例え.com'
      const expectedUrl = 'https://www.qksrv.net/links/101473094/type/am/sid/4055157/https://www.namecheap.com/domains/registration/results/?domain=%E4%BE%8B%E3%81%88.com'
      
      expect(generateNamecheapAffiliateLink(domain)).toBe(expectedUrl)
    })
  })
})