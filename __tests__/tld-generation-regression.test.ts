import { describe, it, expect, beforeAll } from 'vitest'
import { generateOptionsForPattern } from '@/lib/generate-options'
import { generatePermutations } from '@/lib/patterns'
import validator from 'validator'

describe('TLD Generation Regression Tests', () => {
  const hasApiKey = !!process.env.OPENROUTER_API_KEY
  
  beforeAll(() => {
    if (hasApiKey) {
      console.log('🔑 API Key present - running tests with real AI calls')
    } else {
      console.log('⚠️ No API Key - skipping AI-dependent tests')
    }
  })

  describe('TLD Pattern Generation (AI-dependent)', () => {
    it.skipIf(!hasApiKey)('should generate TLDs without leading dots for "good tlds like .com"', async () => {
      const pattern = 'good tlds like .com'
      const options = await generateOptionsForPattern(pattern)
      
      console.log('Generated TLD options:', options)
      
      // Should generate at least some options
      expect(options.length).toBeGreaterThan(0)
      
      // None of the options should start with a dot
      options.forEach((option, index) => {
        expect(option).not.toMatch(/^\./, `Option ${index} "${option}" should not start with a dot`)
      })
      
      // Should contain common TLDs without dots
      const expectedTlds = ['com', 'org', 'net', 'io']
      const hasExpectedTlds = expectedTlds.some(tld => 
        options.some(opt => opt.toLowerCase().includes(tld))
      )
      expect(hasExpectedTlds).toBe(true)
    })

    it.skipIf(!hasApiKey)('should generate TLDs without leading dots for "domain extensions"', async () => {
      const pattern = 'domain extensions'
      const options = await generateOptionsForPattern(pattern)
      
      console.log('Generated domain extension options:', options)
      
      expect(options.length).toBeGreaterThan(0)
      
      // None should start with dots
      options.forEach((option, index) => {
        expect(option).not.toMatch(/^\./, `Option ${index} "${option}" should not start with a dot`)
      })
    })

    it.skipIf(!hasApiKey)('should generate TLDs without leading dots for "top-level domains"', async () => {
      const pattern = 'top-level domains'
      const options = await generateOptionsForPattern(pattern)
      
      console.log('Generated top-level domain options:', options)
      
      expect(options.length).toBeGreaterThan(0)
      
      // None should start with dots
      options.forEach((option, index) => {
        expect(option).not.toMatch(/^\./, `Option ${index} "${option}" should not start with a dot`)
      })
    })
  })

  describe('Domain Generation with TLD Patterns', () => {
    it.skipIf(!hasApiKey)('should generate valid domains for "crexai.(good tlds like .com)"', async () => {
      const query = 'crexai.(good tlds like .com)'
      const pattern = 'good tlds like .com'
      
      // Generate options using AI
      const tldOptions = await generateOptionsForPattern(pattern)
      expect(tldOptions.length).toBeGreaterThan(0)
      
      // Create options object as the API would
      const options = { '0': tldOptions }
      
      // Generate permutations
      const permutations = generatePermutations(query, options)
      console.log('Generated permutations:', permutations.slice(0, 5))
      
      expect(permutations.length).toBeGreaterThan(0)
      
      // Filter valid domains (same logic as API)
      const validDomains = permutations
        .map((domain) => domain.toLowerCase())
        .filter((domain) => validator.isFQDN(domain, { require_tld: true }))
        .filter((domain, index, arr) => arr.indexOf(domain) === index)
      
      console.log('Valid domains:', validDomains.slice(0, 5))
      
      // Should have valid domains (this was failing before the fix)
      expect(validDomains.length).toBeGreaterThan(0)
      
      // All domains should be valid FQDNs
      validDomains.forEach((domain, index) => {
        expect(validator.isFQDN(domain, { require_tld: true })).toBe(true)
        expect(domain).toMatch(/^crexai\.[a-z]+$/, `Domain ${index} "${domain}" should match pattern`)
        expect(domain).not.toMatch(/\.\./, `Domain ${index} "${domain}" should not have double dots`)
      })
      
      // Should contain some common domains
      expect(validDomains).toContain('crexai.com')
    })

    it.skipIf(!hasApiKey)('should generate valid domains for "myapp.(popular tlds)"', async () => {
      const query = 'myapp.(popular tlds)'
      const pattern = 'popular tlds'
      
      const tldOptions = await generateOptionsForPattern(pattern)
      const options = { '0': tldOptions }
      const permutations = generatePermutations(query, options)
      
      const validDomains = permutations
        .map((domain) => domain.toLowerCase())
        .filter((domain) => validator.isFQDN(domain, { require_tld: true }))
        .filter((domain, index, arr) => arr.indexOf(domain) === index)
      
      expect(validDomains.length).toBeGreaterThan(0)
      
      validDomains.forEach((domain) => {
        expect(domain).toMatch(/^myapp\.[a-z]+$/)
        expect(domain).not.toMatch(/\.\./)
      })
    })
  })

  describe('Non-TLD Pattern Generation (should still work)', () => {
    it.skipIf(!hasApiKey)('should generate action words without dots', async () => {
      const pattern = 'action words'
      const options = await generateOptionsForPattern(pattern)
      
      expect(options.length).toBeGreaterThan(0)
      
      // Action words should not contain dots
      options.forEach((option) => {
        expect(option).not.toMatch(/\./)
        expect(option).toMatch(/^[a-z]+$/)
      })
    })

    it.skipIf(!hasApiKey)('should generate tech terms without dots', async () => {
      const pattern = 'tech terms'
      const options = await generateOptionsForPattern(pattern)
      
      expect(options.length).toBeGreaterThan(0)
      
      options.forEach((option) => {
        expect(option).not.toMatch(/\./)
      })
    })
  })

  describe('Slash Pattern Generation (no AI needed)', () => {
    it('should handle slash patterns correctly without AI', async () => {
      const pattern = 'com/org/net'
      const options = await generateOptionsForPattern(pattern)
      
      expect(options).toEqual(['com', 'org', 'net'])
    })

    it('should generate valid domains with slash patterns', () => {
      const query = 'test.(com/org/net)'
      const options = { '0': ['com', 'org', 'net'] }
      const permutations = generatePermutations(query, options)
      
      expect(permutations).toEqual(['test.com', 'test.org', 'test.net'])
      
      const validDomains = permutations.filter(domain => 
        validator.isFQDN(domain, { require_tld: true })
      )
      
      expect(validDomains).toEqual(['test.com', 'test.org', 'test.net'])
    })
  })

  describe('Edge Cases', () => {
    it.skipIf(!hasApiKey)('should handle mixed patterns with TLDs', async () => {
      const query = '(action words)app.(good tlds like .com)'
      
      // Generate options for both patterns
      const actionOptions = await generateOptionsForPattern('action words')
      const tldOptions = await generateOptionsForPattern('good tlds like .com')
      
      const options = { 
        '0': actionOptions,
        '1': tldOptions
      }
      
      const permutations = generatePermutations(query, options)
      const validDomains = permutations
        .filter(domain => validator.isFQDN(domain, { require_tld: true }))
      
      expect(validDomains.length).toBeGreaterThan(0)
      
      // Should match pattern like "runapp.com", "jumpapp.org", etc.
      validDomains.forEach((domain) => {
        expect(domain).toMatch(/^[a-z]+app\.[a-z]+$/)
        expect(domain).not.toMatch(/\.\./)
      })
    })

    it('should handle empty patterns gracefully', async () => {
      const pattern = ''
      const options = await generateOptionsForPattern(pattern)
      
      expect(options).toEqual([])
    })
  })
})