import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'appealing-ai-saved-domains'

export function useSavedDomains() {
  const [savedDomains, setSavedDomains] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load saved domains from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setSavedDomains(parsed)
        }
      }
    } catch (error) {
      console.error('Error loading saved domains:', error)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage whenever savedDomains changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDomains))
      } catch (error) {
        console.error('Error saving domains to localStorage:', error)
      }
    }
  }, [savedDomains, isLoaded])

  const addDomain = useCallback((domain: string) => {
    setSavedDomains(prev => {
      if (!prev.includes(domain)) {
        return [...prev, domain]
      }
      return prev
    })
  }, [])

  const removeDomain = useCallback((domain: string) => {
    setSavedDomains(prev => prev.filter(d => d !== domain))
  }, [])

  const clearAll = useCallback(() => {
    setSavedDomains([])
  }, [])

  return {
    savedDomains,
    addDomain,
    removeDomain,
    clearAll,
    isLoaded
  }
}