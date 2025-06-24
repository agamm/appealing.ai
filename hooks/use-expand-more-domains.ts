import { useState } from 'react'
import { expandMoreDomains } from '@/lib/api'

export interface UseExpandMoreDomainsResult {
  expandMore: (query: string, generatedDomains: string[], currentOptions: Record<string, string[]>) => Promise<{
    domains: string[]
    options: Record<string, string[]>
    message?: string
  } | null>
  isLoading: boolean
  error: string | null
}

export function useExpandMoreDomains(): UseExpandMoreDomainsResult {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const expandMore = async (
    query: string,
    generatedDomains: string[],
    currentOptions: Record<string, string[]>
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await expandMoreDomains({
        query,
        generatedDomains,
        options: currentOptions
      })

      return data
    } catch (err) {
      setError('Failed to generate more suggestions.')
      console.error('Error expanding more domains:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { expandMore, isLoading, error }
}