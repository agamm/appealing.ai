import { describe, it, expect, beforeAll } from 'vitest'
import { generateOptionsForPatternWithExclusions } from '@/lib/generate-options'
import { extractPatterns, generatePermutations } from '@/lib/patterns'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables before all tests
beforeAll(() => {
  config({ path: path.resolve(process.cwd(), '.env') })
  
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set. Please check your .env file')
  }
})

describe('Expand More with Real AI', () => {
  it('should generate unique tech words for {{2 tech words}}.io across 3 iterations', async () => {
    console.log('API Key present:', !!process.env.OPENROUTER_API_KEY)
    console.log('API Key length:', process.env.OPENROUTER_API_KEY?.length)
    
    const query = '{{2 tech words}}.io'
    const patterns = extractPatterns(query)
    
    expect(patterns).toHaveLength(1)
    expect(patterns[0].pattern).toBe('2 tech words')
    
    // Track all generated options
    const allOptions: string[] = []
    
    console.log('\n=== Testing expand-more functionality ===')
    
    // First test basic generation without exclusions
    console.log('\n--- Initial test without exclusions ---')
    const initialOptions = await generateOptionsForPatternWithExclusions('2 tech words', [])
    console.log(`Initial generation returned ${initialOptions.length} options:`, initialOptions)
    
    if (initialOptions.length === 0) {
      console.error('Failed to generate initial options. Check OPENROUTER_API_KEY and network connection.')
      // Skip the test if we can't generate options
      expect(initialOptions.length).toBeGreaterThan(0)
      return
    }
    
    // Add initial options to our tracking
    allOptions.push(...initialOptions)
    
    // Now test with exclusions
    for (let i = 1; i <= 2; i++) {
      console.log(`\n--- Iteration ${i} with exclusions ---`)
      console.log(`Excluding ${allOptions.length} options`)
      
      // Generate new options, excluding previously generated ones
      const newOptions = await generateOptionsForPatternWithExclusions('2 tech words', allOptions)
      
      console.log(`Generated ${newOptions.length} new options:`, newOptions.slice(0, 5), '...')
      
      if (newOptions.length === 0) {
        console.warn('No new options generated, AI might have exhausted unique options')
        break
      }
      
      // Check that new options don't duplicate existing ones
      const duplicates = newOptions.filter(opt => 
        allOptions.some(existing => existing.toLowerCase() === opt.toLowerCase())
      )
      
      if (duplicates.length > 0) {
        console.error('Found duplicates:', duplicates)
      }
      
      expect(duplicates.length).toBe(0)
      
      // Add to all options
      allOptions.push(...newOptions)
      
      // Generate some sample domains
      const options = { '0': allOptions.slice(-10) } // Just use last 10 options for sample
      const domains = generatePermutations(query, options).slice(0, 5)
      console.log('Sample domains:', domains)
    }
    
    console.log('\n=== Summary ===')
    console.log(`Total unique options generated: ${allOptions.length}`)
    console.log('First 10 options:', allOptions.slice(0, 10))
    
    // Should have generated multiple unique options
    expect(allOptions.length).toBeGreaterThan(3)
    
    // All options should be unique
    const uniqueOptions = new Set(allOptions.map(opt => opt.toLowerCase()))
    expect(uniqueOptions.size).toBe(allOptions.length)
  }, 90000) // 90 second timeout for multiple AI calls
})