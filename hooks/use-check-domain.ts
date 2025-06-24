import { useState, useEffect } from 'react'
import { checkDomainAvailability } from '@/lib/api'

export interface UseCheckDomainResult {
  isAvailable: boolean | null
  isLoading: boolean
  error: string | null
}

export function useCheckDomain(domain: string, enabled: boolean = true): UseCheckDomainResult {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!domain.trim() || !enabled) {
      return
    }

    const abortController = new AbortController()

    const checkDomain = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const data = await checkDomainAvailability(domain)
        
        if (!abortController.signal.aborted) {
          setIsAvailable(data.isAvailable)
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError(`Failed to check domain ${domain}`)
          console.error(`Failed to check domain ${domain}:`, err)
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    checkDomain()

    return () => {
      abortController.abort()
    }
  }, [domain, enabled])

  return { isAvailable, isLoading, error }
}