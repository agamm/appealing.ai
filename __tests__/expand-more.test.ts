import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/domains/expand-more/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/domain-expansion', () => ({
  generateOptionsForPattern: vi.fn()
}))

import { generateOptionsForPattern } from '@/lib/domain-expansion'

describe('Expand More API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return only new options', async () => {
    const mockGenerate = vi.mocked(generateOptionsForPattern)
    mockGenerate
      .mockResolvedValueOnce(['get', 'use', 'try', 'new1', 'new2']) // For first pattern
      .mockResolvedValueOnce(['com', 'io', 'ai', 'dev']) // For second pattern

    const request = new NextRequest('http://localhost:3000/api/domains/expand-more', {
      method: 'POST',
      body: JSON.stringify({
        query: '{{prefix}}app.{{tld}}',
        generatedDomains: ['getapp.com', 'useapp.io'],
        options: {
          '0': ['get', 'use', 'try'],
          '1': ['com', 'io', 'ai']
        }
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.query).toBe('{{prefix}}app.{{tld}}')
    expect(data.options).toEqual({
      '0': ['new1', 'new2'], // Only new options
      '1': ['dev'] // Only new option
    })
    expect(data.domains).toContain('new1app.com')
    expect(data.domains).toContain('new2app.dev')
  })

  it('should handle no new options available', async () => {
    const mockGenerate = vi.mocked(generateOptionsForPattern)
    mockGenerate
      .mockResolvedValueOnce(['get', 'use']) // Same as existing
      .mockResolvedValueOnce(['com', 'io']) // Same as existing

    const request = new NextRequest('http://localhost:3000/api/domains/expand-more', {
      method: 'POST',
      body: JSON.stringify({
        query: '{{prefix}}app.{{tld}}',
        generatedDomains: ['getapp.com', 'getapp.io', 'useapp.com', 'useapp.io'],
        options: {
          '0': ['get', 'use'],
          '1': ['com', 'io']
        }
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.options).toEqual({
      '0': [], // No new options
      '1': [] // No new options
    })
    expect(data.domains).toHaveLength(0)
    expect(data.message).toBe('No more unique domain suggestions available')
  })

  it('should filter out already generated domains', async () => {
    const mockGenerate = vi.mocked(generateOptionsForPattern)
    mockGenerate
      .mockResolvedValueOnce(['get', 'use', 'try'])
      .mockResolvedValueOnce(['com', 'io', 'ai'])

    const request = new NextRequest('http://localhost:3000/api/domains/expand-more', {
      method: 'POST',
      body: JSON.stringify({
        query: '{{prefix}}app.{{tld}}',
        generatedDomains: ['getapp.com', 'useapp.io', 'tryapp.ai'], // Already generated
        options: {
          '0': ['get', 'use'],
          '1': ['com', 'io']
        }
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.options).toEqual({
      '0': ['try'], // New option
      '1': ['ai'] // New option
    })
    
    // Should not include already generated domains
    expect(data.domains).not.toContain('getapp.com')
    expect(data.domains).not.toContain('useapp.io')
    expect(data.domains).not.toContain('tryapp.ai')
    
    // Should include new combinations
    expect(data.domains).toContain('getapp.ai')
    expect(data.domains).toContain('tryapp.com')
  })

  it('should handle patterns with no previous options', async () => {
    const mockGenerate = vi.mocked(generateOptionsForPattern)
    mockGenerate
      .mockResolvedValueOnce(['get', 'use'])
      .mockResolvedValueOnce(['com', 'io'])

    const request = new NextRequest('http://localhost:3000/api/domains/expand-more', {
      method: 'POST',
      body: JSON.stringify({
        query: '{{prefix}}app.{{tld}}',
        generatedDomains: [],
        options: {} // No previous options
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.options).toEqual({
      '0': ['get', 'use'],
      '1': ['com', 'io']
    })
    expect(data.domains).toHaveLength(4) // 2 * 2 combinations
  })

  it('should respect the 50 domain limit', async () => {
    const mockGenerate = vi.mocked(generateOptionsForPattern)
    // Generate many options to exceed limit
    const manyOptions = Array.from({ length: 20 }, (_, i) => `option${i}`)
    mockGenerate
      .mockResolvedValueOnce(manyOptions)
      .mockResolvedValueOnce(manyOptions)

    const request = new NextRequest('http://localhost:3000/api/domains/expand-more', {
      method: 'POST',
      body: JSON.stringify({
        query: '{{prefix}}app.{{tld}}',
        generatedDomains: [],
        options: {}
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(data.domains.length).toBeLessThanOrEqual(50)
  })
})