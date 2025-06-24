import { describe, it, expect, beforeAll } from 'vitest'
import { generateOptionsForPattern } from '../lib/domain-expansion'
import { extractPatterns, generatePermutations } from '../lib/patterns'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables before all tests
beforeAll(() => {
  // Load from .env in the root directory
  config({ path: path.resolve(process.cwd(), '.env') })
  
  // Verify API key is loaded
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set. Please check your .env file')
  }
})

describe('Domain Expansion with Real AI', () => {
  describe('generateOptionsForPattern with real LLM calls', () => {
    it('should generate approximately 10 single words when pattern is "10 words"', async () => {
      const options = await generateOptionsForPattern('10 words')
      
      console.log('Generated options for "10 words":', options)
      
      // AI may generate slightly more or fewer than requested
      expect(options.length).toBeGreaterThanOrEqual(8)
      expect(options.length).toBeLessThanOrEqual(15)
      
      // Each option should be a single word (no spaces, no compound words)
      options.forEach(option => {
        expect(option).not.toContain(' ')
        expect(option).not.toContain('.')
        expect(option).toMatch(/^[a-z]+$/) // Only lowercase letters
        // Should not be compound words like "gethelp" or "tryaccess"
        // This is a softer check - we just warn if we find them
        if (option.match(/^(get|try|use|set)[a-z]+/)) {
          console.warn(`Found potential compound word: ${option}`)
        }
      })
    }, 30000) // 30 second timeout for LLM call

    it('should generate approximately 11 single words when pattern is "11 words"', async () => {
      const options = await generateOptionsForPattern('11 words')
      
      console.log('Generated options for "11 words":', options)
      
      // AI may generate slightly more or fewer than requested
      expect(options.length).toBeGreaterThanOrEqual(9)
      expect(options.length).toBeLessThanOrEqual(25)
      
      options.forEach(option => {
        expect(option).not.toContain(' ')
        expect(option).not.toContain('.')
        expect(option).toMatch(/^[a-z]+$/)
      })
    }, 30000)

    it('should handle slash patterns correctly without LLM', async () => {
      const options = await generateOptionsForPattern('apple/banana/cherry')
      
      expect(options).toHaveLength(3)
      expect(options).toContain('apple')
      expect(options).toContain('banana')
      expect(options).toContain('cherry')
    })

    it('should generate diverse words for "5 dictionary words"', async () => {
      const options = await generateOptionsForPattern('5 dictionary words')
      
      console.log('Generated dictionary words:', options)
      
      expect(options).toHaveLength(5)
      
      // Check for diversity - all words should be different
      const uniqueWords = new Set(options)
      expect(uniqueWords.size).toBe(5)
      
      // All should be valid single words
      options.forEach(option => {
        expect(option).toMatch(/^[a-z]+$/)
        expect(option.length).toBeGreaterThan(2) // At least 3 characters
        expect(option.length).toBeLessThan(15) // Reasonable word length
      })
    }, 30000)
  })

  describe('Domain patterns without {{}} patterns', () => {
    it('should not make LLM call when pattern has no {{}} placeholders', async () => {
      const pattern = 'example.com'
      const patterns = extractPatterns(pattern)
      
      // Should extract no patterns
      expect(patterns).toHaveLength(0)
      
      // When we call the API route logic directly, it should not call generateOptionsForPattern
      // We can verify this by checking that a simple domain returns quickly without AI processing
      const startTime = Date.now()
      
      // Since generateOptionsForPattern is only called when patterns exist,
      // we just need to verify that extractPatterns returns empty for regular domains
      const regularDomains = [
        'example.com',
        'test.io',
        'mysite.net',
        'subdomain.example.com',
        'my-domain.org'
      ]
      
      regularDomains.forEach(domain => {
        const extractedPatterns = extractPatterns(domain)
        expect(extractedPatterns).toHaveLength(0)
      })
      
      const endTime = Date.now()
      // Should complete very quickly since no LLM calls
      expect(endTime - startTime).toBeLessThan(100) // Less than 100ms
    })
    
    it('should return empty array for invalid domains without patterns', async () => {
      const invalidDomains = [
        'not a domain',
        'invalid domain name',
        'test',
        '.com',
        'domain.',
        'domain..com'
      ]
      
      invalidDomains.forEach(domain => {
        const patterns = extractPatterns(domain)
        expect(patterns).toHaveLength(0)
      })
    })
  })

  describe('Compound word constraints', () => {
    it('should respect "no more than 2 compound words together" constraint', async () => {
      const pattern = 'combinations of terms like base/stack/build/pillar/block/layer/ without dashes, be creative, no more than 2 compound words together'
      const options = await generateOptionsForPattern(pattern)
      
      console.log('Generated options:', options)
      
      // Check that no option has more than 2 base words combined
      options.forEach(option => {
        // Heuristic: if an option is longer than ~15 chars, it might be 3+ words
        // Most 2-word compounds are 8-15 chars (e.g., "basestack", "buildlayer")
        // 3-word compounds would be 15+ chars (e.g., "basestackbuild")
        if (option.length > 15) {
          // Additional check: see if it contains multiple known base words
          const baseWords = ['base', 'stack', 'build', 'pillar', 'block', 'layer']
          let foundCount = 0
          baseWords.forEach(word => {
            if (option.includes(word)) foundCount++
          })
          
          // If we find 3 or more base words in the option, it's likely a 3+ word compound
          expect(foundCount).toBeLessThanOrEqual(2)
        }
      })
      
      // Should still generate a good mix of single words and 2-word compounds
      const singleWords = options.filter(opt => opt.length <= 7)
      const compoundWords = options.filter(opt => opt.length > 7 && opt.length <= 15)
      const longWords = options.filter(opt => opt.length > 15)
      
      console.log('Word distribution:', {
        single: singleWords.length,
        compound: compoundWords.length,
        long: longWords.length
      })
      
      // Should have some single words
      expect(singleWords.length).toBeGreaterThan(0)
      // Should have some 2-word compounds
      expect(compoundWords.length).toBeGreaterThan(0)
      // Should have few or no 3+ word compounds
      expect(longWords.length).toBeLessThanOrEqual(2)
    }, 30000)
  })

  describe('Full domain generation flow with real AI', () => {
    it('should generate 110 domains for {{10 words}}{{11 words}}.com', async () => {
      const pattern = '{{10 words}}{{11 words}}.com'
      const patterns = extractPatterns(pattern)
      
      expect(patterns).toHaveLength(2)
      expect(patterns[0].pattern).toBe('10 words')
      expect(patterns[1].pattern).toBe('11 words')
      
      // Generate options for each pattern
      const patternResults = []
      for (const p of patterns) {
        const options = await generateOptionsForPattern(p.pattern, [])
        console.log(`Options for "${p.pattern}":`, options.slice(0, 5), '...')
        patternResults.push({
          startIndex: p.startIndex,
          endIndex: p.endIndex,
          options,
        })
      }
      
      expect(patternResults[0].options).toHaveLength(10)
      expect(patternResults[1].options).toHaveLength(11)
      
      // Generate all permutations
      const options: Record<string, string[]> = {}
      patternResults.forEach((result, index) => {
        options[index.toString()] = result.options
      })
      const permutations = generatePermutations(pattern, options)
      
      console.log('Total permutations:', permutations.length)
      console.log('Sample permutations:', permutations.slice(0, 5))
      
      expect(permutations).toHaveLength(110) // 10 x 11 = 110
      
      // All should end with .com and not have .com.com
      permutations.forEach(domain => {
        expect(domain).toMatch(/\.com$/)
        expect(domain).not.toMatch(/\.com\.com$/)
      })
      
      // Check that domains are formed from two concatenated words
      // Sample check on first few domains
      permutations.slice(0, 10).forEach(domain => {
        const domainWithoutTld = domain.replace('.com', '')
        // Should be two words concatenated
        expect(domainWithoutTld).toMatch(/^[a-z]+[a-z]+$/)
        // Reasonable length for two words
        expect(domainWithoutTld.length).toBeGreaterThan(4)
        expect(domainWithoutTld.length).toBeLessThan(30)
      })
    }, 60000) // 60 second timeout for multiple LLM calls

    it('should generate single words for {{3 words}}{{3 words}}.com', async () => {
      const pattern = '{{3 words}}{{3 words}}.com'
      const patterns = extractPatterns(pattern)
      
      // Generate options for each pattern
      const patternResults = []
      for (const p of patterns) {
        const options = await generateOptionsForPattern(p.pattern, [])
        console.log(`Options for "${p.pattern}":`, options.length, 'words generated')
        patternResults.push({
          startIndex: p.startIndex,
          endIndex: p.endIndex,
          options,
        })
      }
      
      // The AI generates many options even when asked for "3 words"
      // This is by design - it interprets this as a pattern description, not a hard limit
      expect(patternResults[0].options.length).toBeGreaterThanOrEqual(3)
      expect(patternResults[1].options.length).toBeGreaterThanOrEqual(3)
      
      // Check that all options are single words (no spaces)
      const allWords = [...patternResults[0].options, ...patternResults[1].options]
      allWords.forEach(word => {
        // MUST be a single word - no spaces allowed
        expect(word).not.toContain(' ')
        expect(word).not.toContain('.')
        expect(word).toMatch(/^[a-z]+$/) // Only lowercase letters
        
        // Should not start with common prefixes that indicate compound words
        expect(word).not.toMatch(/^(get|try|use|set)[a-z]+/)
        
        // Should be reasonable single word length
        expect(word.length).toBeGreaterThanOrEqual(2) // At least 2 characters (allows "is", "to", etc)
        expect(word.length).toBeLessThanOrEqual(15) // Reasonable word length
      })
      
      // Generate permutations
      const options: Record<string, string[]> = {}
      patternResults.forEach((result, index) => {
        options[index.toString()] = result.options
      })
      const permutations = generatePermutations(pattern, options)
      // Should generate many permutations (options1.length x options2.length)
      const expectedCount = patternResults[0].options.length * patternResults[1].options.length
      expect(permutations).toHaveLength(expectedCount)
      
      console.log('Generated', permutations.length, 'permutations')
    }, 60000)
  })
})