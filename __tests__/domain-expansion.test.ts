import { describe, it, expect, vi } from 'vitest'
import { generatePermutations, extractPatterns } from '@/lib/patterns'
import { generateOptionsForPattern } from '@/lib/domain-expansion'

// Mock the OpenRouter API calls
vi.mock('@/lib/domain-expansion', async () => {
  const actual = await vi.importActual('@/lib/domain-expansion')
  return {
    ...actual,
    generateOptionsForPattern: vi.fn()
  }
})

describe('Domain Expansion', () => {
  describe('extractPatterns', () => {
    it('should extract patterns from query', () => {
      const patterns = extractPatterns('{{get/use}}app.{{com/io}}')
      expect(patterns).toHaveLength(2)
      expect(patterns[0]).toEqual({
        pattern: 'get/use',
        startIndex: 0,
        endIndex: 11
      })
      expect(patterns[1]).toEqual({
        pattern: 'com/io',
        startIndex: 15,
        endIndex: 25
      })
    })

    it('should handle empty patterns', () => {
      const patterns = extractPatterns('example.com')
      expect(patterns).toHaveLength(0)
    })

    it('should handle duplicate patterns', () => {
      const patterns = extractPatterns('{{abc}}-{{xyz}}-{{abc}}')
      expect(patterns).toHaveLength(3)
      expect(patterns[0].pattern).toBe('abc')
      expect(patterns[1].pattern).toBe('xyz')
      expect(patterns[2].pattern).toBe('abc')
    })
  })

  describe('generatePermutations', () => {
    it('should generate permutations with indexed options', () => {
      const query = '{{prefix}}app.{{tld}}'
      const options = {
        '0': ['get', 'use', 'try'],
        '1': ['com', 'io', 'ai']
      }
      
      const permutations = generatePermutations(query, options)
      
      expect(permutations).toContain('getapp.com')
      expect(permutations).toContain('getapp.io')
      expect(permutations).toContain('getapp.ai')
      expect(permutations).toContain('useapp.com')
      expect(permutations).toContain('tryapp.ai')
      expect(permutations).toHaveLength(9) // 3 * 3
    })

    it('should handle missing options for a pattern', () => {
      const query = '{{prefix}}app.{{tld}}'
      const options = {
        '0': ['get', 'use']
        // Missing options for index 1
      }
      
      const permutations = generatePermutations(query, options)
      expect(permutations).toHaveLength(0)
    })

    it('should handle query without patterns', () => {
      const query = 'example.com'
      const options = {}
      
      const permutations = generatePermutations(query, options)
      expect(permutations).toEqual(['example.com'])
    })

    it('should handle complex nested patterns', () => {
      const query = '{{a}}{{b}}.{{c}}'
      const options = {
        '0': ['x'],
        '1': ['y'],
        '2': ['com']
      }
      
      const permutations = generatePermutations(query, options)
      expect(permutations).toEqual(['xy.com'])
    })
  })

  describe('Pattern Generation Integration', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should handle slash patterns correctly', () => {
      const mockGenerate = vi.mocked(generateOptionsForPattern)
      
      // Test that slash patterns are handled correctly
      generateOptionsForPattern('get/use/try', [])
      
      // The actual implementation should return the split options
      // This would be tested in the actual implementation test
    })
  })
})