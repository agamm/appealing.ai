// API functions for React Query

export interface ExpandResponse {
  domains: string[]
  query: string
  patternResults: Array<{
    startIndex: number
    endIndex: number
    pattern: string
    options: string[]
  }>
}

export interface CheckResponse {
  domain: string
  isAvailable: boolean
}

export interface ExpandMoreResponse extends ExpandResponse {
  message?: string
}

// Expand domains API
export async function expandDomains(query: string): Promise<ExpandResponse> {
  const response = await fetch('/api/domains/expand', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })

  if (!response.ok) {
    throw new Error('Failed to expand domains')
  }

  return response.json()
}

// Check domain availability API
export async function checkDomainAvailability(domain: string): Promise<CheckResponse> {
  const response = await fetch('/api/domains/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain }),
  })

  if (!response.ok) {
    throw new Error('Failed to check domain availability')
  }

  return response.json()
}

// Expand more domains API
export async function expandMoreDomains(params: {
  query: string
  unavailableDomains: string[]
  patternResults: ExpandResponse['patternResults']
}): Promise<ExpandMoreResponse> {
  const response = await fetch('/api/domains/expand-more', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    throw new Error('Failed to generate more domain suggestions')
  }

  return response.json()
}