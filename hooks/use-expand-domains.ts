import { useState, useEffect } from 'react'
import { expandDomains } from '@/lib/api'

export interface UseExpandDomainsResult {
  domains: string[]
  options: Record<string, string[]>
  isLoading: boolean
  error: string | null
}

export function useExpandDomains(query: string, enabled: boolean = true): UseExpandDomainsResult {
  const [domains, setDomains] = useState<string[]>([])
  const [options, setOptions] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim() || !enabled) {
      setDomains([])
      setOptions({})
      setError(null)
      return
    }

    const abortController = new AbortController()

    const fetchDomains = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await expandDomains(query)
        
        if (!abortController.signal.aborted) {
          setDomains(data.domains || [])
          setOptions(data.options || {})
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError('Failed to generate domains. Please try again.')
          console.error('Error expanding domains:', err)
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchDomains()

    return () => {
      abortController.abort()
    }
  }, [query, enabled])

  return { domains, options, isLoading, error }
}