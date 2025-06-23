"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import { extractPatterns } from "@/lib/patterns"
import { HighlightedInput } from "@/components/highlighted-input"
import { ExamplePatterns } from "@/components/example-patterns"
import { DomainResult } from "@/components/domain-result"
import { useRateLimit } from "@/hooks/use-rate-limit"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"
import { UnseenDomainsIndicator } from "@/components/unseen-domains-indicator"

interface DomainResultData {
  domain: string
  isAvailable: boolean | null // null means checking
  isNewBatch?: boolean // marks domains from "Try More"
}

function validateDomainPattern(pattern: string): { isValid: boolean; error: string | null } {
  if (!pattern.trim()) {
    return { isValid: true, error: null }
  }

  const bracePattern = /\{\{|\}\}/g
  const matches = pattern.match(bracePattern) || []

  let openCount = 0
  for (const match of matches) {
    if (match === "{{") {
      openCount++
    } else if (match === "}}") {
      openCount--
      if (openCount < 0) {
        return { isValid: false, error: "Closing }} without opening {{" }
      }
    }
  }

  if (openCount !== 0) {
    return { isValid: false, error: "Unmatched {{ }} braces" }
  }

  // Check for empty patterns
  const emptyPatternMatch = pattern.match(/\{\{\s*\}\}/)
  if (emptyPatternMatch) {
    return { isValid: false, error: "Empty pattern {{}} is not allowed" }
  }

  const outsidePattern = pattern.replace(/\{\{[^}]*\}\}/g, "PLACEHOLDER")
  const invalidChars = outsidePattern.match(/[^a-zA-Z0-9.\-PLACEHOLDER]/g)

  if (invalidChars) {
    const firstInvalidChar = invalidChars[0]
    return {
      isValid: false,
      error: `Invalid character '${firstInvalidChar}' outside {{ }}. Only letters, numbers, dots, and dashes allowed.`,
    }
  }

  return { isValid: true, error: null }
}

function DomainList({ searchTerm, isValid }: { searchTerm: string; isValid: boolean }) {
  const [domains, setDomains] = useState<DomainResultData[]>([])
  const [isExpanding, setIsExpanding] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(100)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null)
  const [tryMoreLimitReached, setTryMoreLimitReached] = useState(false)
  const [tryMoreRemaining, setTryMoreRemaining] = useState<number | null>(null)
  const [seenAvailableDomains, setSeenAvailableDomains] = useState<Set<string>>(new Set())
  const [scrollTrigger, setScrollTrigger] = useState(0)
  const checkingRef = useRef<Set<string>>(new Set())
  const abortControllerRef = useRef<AbortController | null>(null)
  const checkAbortControllersRef = useRef<Map<string, AbortController>>(new Map())
  const domainRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const { entries, observe, unobserve } = useIntersectionObserver({ threshold: 0.5 })
  
  const { 
    checkDailySearchLimit, 
    incrementDailySearches, 
    checkTryMoreLimit, 
    incrementTryMore
  } = useRateLimit()

  // Track when available domains are viewed
  useEffect(() => {
    entries.forEach((entry, element) => {
      if (entry.isIntersecting) {
        const domain = element.getAttribute('data-domain')
        const isAvailable = element.getAttribute('data-available') === 'true'
        
        if (domain && isAvailable) {
          setSeenAvailableDomains(prev => {
            const newSet = new Set(prev)
            newSet.add(domain)
            return newSet
          })
        }
      }
    })
  }, [entries])

  // Set up observers for domain elements - using a stable ref
  const observeFunctions = useRef({ observe, unobserve })
  useEffect(() => {
    observeFunctions.current = { observe, unobserve }
  }, [observe, unobserve])

  const setDomainRef = useCallback((domain: string, element: HTMLDivElement | null) => {
    const prevElement = domainRefs.current.get(domain)
    
    if (element && element !== prevElement) {
      // Only observe if it's a new element
      domainRefs.current.set(domain, element)
      observeFunctions.current.observe(element)
    } else if (!element && prevElement) {
      // Clean up when element is removed
      observeFunctions.current.unobserve(prevElement)
      domainRefs.current.delete(domain)
    }
  }, [])

  // Clean up observers when domains change or component unmounts
  useEffect(() => {
    return () => {
      // Clean up all observers
      domainRefs.current.forEach((element, domain) => {
        observeFunctions.current.unobserve(element)
      })
      domainRefs.current.clear()
    }
  }, [])

  // Add scroll listener to update unseen domains position
  useEffect(() => {
    const handleScroll = () => {
      setScrollTrigger(prev => prev + 1)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate unseen available domains
  const unseenAvailableDomainsAbove = useMemo(() => {
    const unseenAvailable: string[] = []
    
    for (const domain of domains) {
      // Only count available domains that haven't been seen
      if (domain.isAvailable === true && !seenAvailableDomains.has(domain.domain)) {
        const element = domainRefs.current.get(domain.domain)
        if (element) {
          const rect = element.getBoundingClientRect()
          // Only count if it's above the viewport
          if (rect.bottom < 0) {
            unseenAvailable.push(domain.domain)
          }
        }
      }
    }
    
    return unseenAvailable
  }, [domains, seenAvailableDomains, scrollTrigger])

  // Scroll to first unseen available domain
  const scrollToFirstUnseen = () => {
    if (unseenAvailableDomainsAbove.length > 0) {
      const firstUnseenDomain = unseenAvailableDomainsAbove[0]
      const element = domainRefs.current.get(firstUnseenDomain)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  // Check domain availability
  const checkDomain = useCallback(async (domain: string) => {
    if (checkingRef.current.has(domain)) return
    
    // Create abort controller for this specific check
    const abortController = new AbortController()
    checkAbortControllersRef.current.set(domain, abortController)
    checkingRef.current.add(domain)
    
    try {
      const response = await fetch('/api/domains/check', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain }),
        signal: abortController.signal
      })
      
      if (response.ok) {
        const data = await response.json()
        setDomains(prev => 
          prev.map(d => d.domain === domain ? { ...d, isAvailable: data.isAvailable } : d)
        )
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error(`Error checking ${domain}:`, error)
      }
    } finally {
      checkingRef.current.delete(domain)
      checkAbortControllersRef.current.delete(domain)
    }
  }, [])

  // Abort all ongoing domain checks
  const abortAllChecks = () => {
    // Abort individual domain checks
    checkAbortControllersRef.current.forEach((controller, domain) => {
      controller.abort()
    })
    checkAbortControllersRef.current.clear()
    checkingRef.current.clear()
    
    // Abort the main expand operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  useEffect(() => {
    // Abort all ongoing checks when search term changes
    abortAllChecks()
    
    if (!searchTerm.trim() || !isValid) {
      setDomains([])
      setIsChecking(false)
      setIsExpanding(false)
      setSeenAvailableDomains(new Set())
      return
    }

    abortControllerRef.current = new AbortController()

    const expandDomains = async () => {
      // Check daily search limit
      const { allowed, remaining } = checkDailySearchLimit()
      if (!allowed) {
        setError(`Daily search limit reached - try tomorrow?`)
        console.log(`Daily searches remaining: ${remaining}`)
        return
      }
      console.log(`Daily searches remaining: ${remaining}`)

      setIsExpanding(true)
      setError(null)
      setDomains([])
      setTryMoreLimitReached(false)
      setTryMoreRemaining(2) // Reset to initial limit
      checkingRef.current.clear()
      setSeenAvailableDomains(new Set())
      
      // Generate a new search ID for this search
      const searchId = `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      setCurrentSearchId(searchId)

      try {
        const response = await fetch('/api/domains/expand', {
          method: 'POST',
          headers: { 
          'Content-Type': 'application/json'
        },
          body: JSON.stringify({ pattern: searchTerm }),
          signal: abortControllerRef.current?.signal
        })

        if (!response.ok) {
          throw new Error('Failed to expand domains')
        }

        const data = await response.json()
        const domainResults: DomainResultData[] = data.domains.map((domain: string) => ({
          domain,
          isAvailable: null
        }))
        
        setDomains(domainResults)
        setIsExpanding(false)
        
        // Increment daily searches on success
        incrementDailySearches()
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setError("Failed to generate domains. Please try again.")
          console.error('Error:', error)
        }
        setIsExpanding(false)
        setIsChecking(false)
      }
    }

    const timer = setTimeout(expandDomains, 300)
    return () => {
      clearTimeout(timer)
      abortAllChecks()
    }
  }, [searchTerm, isValid])

  // Monitor try more limit for current search
  useEffect(() => {
    if (currentSearchId) {
      const { allowed, remaining } = checkTryMoreLimit(currentSearchId)
      setTryMoreRemaining(remaining)
      if (!allowed) {
        setTryMoreLimitReached(true)
      }
    }
  }, [currentSearchId, domains.length, checkTryMoreLimit])

  // Check domains as they become visible
  useEffect(() => {
    const checkVisibleDomains = async () => {
      const visibleDomains = domains.slice(0, visibleCount)
      const uncheckedVisibleDomains = visibleDomains.filter(d => 
        d.isAvailable === null && !checkingRef.current.has(d.domain)
      )
      
      if (uncheckedVisibleDomains.length === 0) {
        // Update checking state if no domains left to check
        if (checkingRef.current.size === 0) {
          setIsChecking(false)
        }
        return
      }
      
      setIsChecking(true)
      
      try {
        // Group by TLD for better rate limiting
        const porkbunDomains = uncheckedVisibleDomains.filter(d => {
          const tld = d.domain.split('.').pop() || ''
          return ['dev', 'app', 'page', 'gay', 'foo', 'zip', 'mov'].includes(tld)
        })
        
        const otherDomains = uncheckedVisibleDomains.filter(d => !porkbunDomains.some(p => p.domain === d.domain))
        
        // Check non-Porkbun domains in parallel batches
        const batchSize = 5
        for (let i = 0; i < otherDomains.length; i += batchSize) {
          const batch = otherDomains.slice(i, i + batchSize)
          await Promise.all(batch.map(d => checkDomain(d.domain)))
        }
        
        // Check Porkbun domains sequentially
        for (const d of porkbunDomains) {
          await checkDomain(d.domain)
        }
      } finally {
        // Ensure checking state is updated
        if (checkingRef.current.size === 0) {
          setIsChecking(false)
        }
      }
    }
    
    checkVisibleDomains()
  }, [visibleCount, domains.length, checkDomain])

  // Load more domains based on unavailable ones
  const loadMoreDomains = async () => {
    // Prevent multiple clicks
    if (isLoadingMore) return
    
    if (!currentSearchId) {
      setError("No active search to expand")
      return
    }
    
    // Check try more limit
    const { allowed, remaining } = checkTryMoreLimit(currentSearchId)
    if (!allowed) {
      setTryMoreLimitReached(true)
      console.log(`Try more suggestions remaining: ${remaining}`)
      return
    }
    
    // Update remaining count
    setTryMoreRemaining(remaining - 1)
    
    // Increment immediately to prevent race conditions
    incrementTryMore(currentSearchId)
    console.log(`Try more suggestions remaining: ${remaining - 1}`)
    
    setIsLoadingMore(true)
    setError(null)
    
    // Create a new abort controller for this operation
    const loadMoreAbortController = new AbortController()
    
    try {
      // Get all unavailable domains
      const unavailableDomains = domains
        .filter(d => d.isAvailable === false)
        .map(d => d.domain)
      
      if (unavailableDomains.length === 0) {
        setError("No unavailable domains to base suggestions on")
        setIsLoadingMore(false)
        return
      }
      
      const response = await fetch('/api/domains/expand-more', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          pattern: searchTerm,
          unavailableDomains 
        }),
        signal: loadMoreAbortController.signal
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate more suggestions')
      }
      
      const data = await response.json()
      const newDomainResults: DomainResultData[] = data.domains.map((domain: string) => ({
        domain,
        isAvailable: null,
        isNewBatch: true
      }))
      
      // Add new domains to the list
      setDomains(prev => [...prev, ...newDomainResults])
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error loading more domains:', error)
        setError("Failed to generate more suggestions. Please try again.")
      }
    } finally {
      setIsLoadingMore(false)
    }
  }

  const visibleDomains = domains.slice(0, visibleCount)
  const hasMore = visibleCount < domains.length
  const checkedCount = domains.filter(d => d.isAvailable !== null).length
  const availableCount = domains.filter(d => d.isAvailable === true).length

  if (!searchTerm.trim() || !isValid) return null

  if (isExpanding) {
    return (
      <div className="mt-4">
        <div className="space-y-4">
          <div className="space-y-1.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div 
                key={index} 
                className="fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="px-4 py-2.5 rounded-md border border-gray-100 bg-white overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="h-4 rounded shimmer" 
                        style={{ 
                          width: `${Math.random() * 60 + 100}px`,
                        }}
                      ></div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                      <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center pt-2">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500 font-light">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25"></circle>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
              </svg>
              <span>Generating domains...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-500 text-sm py-4 font-light">{error}</div>
  }

  if (domains.length === 0) {
    return <div className="text-center text-gray-400 text-sm py-4 font-light">No domains generated. Try a different pattern.</div>
  }

  return (
    <div className="space-y-4">
      <UnseenDomainsIndicator 
        unseenAvailableCount={unseenAvailableDomainsAbove.length}
        onClick={scrollToFirstUnseen}
      />
      
      <div className="space-y-1">
        {visibleDomains.map((item, index) => {
          const isFirstNewBatch = item.isNewBatch && 
            (index === 0 || !visibleDomains[index - 1].isNewBatch)
          
          return (
            <div
              key={item.domain}
              ref={(el) => setDomainRef(item.domain, el)}
              data-domain={item.domain}
              data-available={item.isAvailable?.toString()}
            >
              <DomainResult
                domain={item.domain}
                isAvailable={item.isAvailable}
                isFirstNewBatch={isFirstNewBatch}
                showNewBatchDivider={index > 0}
              />
            </div>
          )
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => setVisibleCount((prev) => Math.min(prev + 20, domains.length))} className="text-sm font-light">
            Load More ({domains.length - visibleCount} remaining)
          </Button>
        </div>
      )}

      <div className="text-center text-sm text-gray-500 pt-2 font-light">
        {availableCount} available out of {checkedCount} checked
        {isChecking && (
          <span className="ml-2">
            <span className="inline-block animate-pulse">•</span> Still checking...
          </span>
        )}
      </div>

      {/* Try More button - show when we have patterns and all domains are visible */}
      {domains.length > 0 && extractPatterns(searchTerm).length > 0 && !isLoadingMore && !isChecking && !hasMore && !tryMoreLimitReached && (
        <div className="flex flex-col items-center pt-6 space-y-2">
          <Button 
            onClick={loadMoreDomains}
            className="font-light cursor-pointer"
            variant="default"
            disabled={isLoadingMore}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 opacity-70" />
            Try More Suggestions
          </Button>
          {tryMoreRemaining === 1 && (
            <p className="text-xs text-gray-400 font-light">Last try more attempt</p>
          )}
        </div>
      )}

      {isLoadingMore && (
        <div className="text-center text-sm text-gray-500 pt-4 font-light">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Generating more suggestions based on unavailable domains...
        </div>
      )}

      {/* Show message when try more limit is reached */}
      {domains.length > 0 && extractPatterns(searchTerm).length > 0 && !isLoadingMore && !isChecking && !hasMore && tryMoreLimitReached && (
        <div className="text-center text-sm text-gray-400 pt-6 font-light">
          Try more limit reached
        </div>
      )}
    </div>
  )
}

export default function DomainGenerator() {
  const [searchTerm, setSearchTerm] = useState("")
  const [validation, setValidation] = useState<{ isValid: boolean; error: string | null }>({
    isValid: true,
    error: null,
  })

  const examplePatterns = [
    { label: "{{cybersecurity startup terms}}.ai", value: "{{cybersecurity startup terms}}.ai" },
    { label: "{{use/try}}myapp.{{com/io}}", value: "{{use/try}}myapp.{{com/io}}" },
    { label: "{{one dictionary word}}.io", value: "{{one dictionary word}}.io" },
  ]

  const validateAndSetSearchTerm = (pattern: string) => {
    const result = validateDomainPattern(pattern)
    setValidation(result)
    setSearchTerm(pattern)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="space-y-2">
        <HighlightedInput
          value={searchTerm}
          onChange={validateAndSetSearchTerm}
          placeholder="Enter domain pattern: example.com or {{get/use}}app.{{com/io}}"
          error={!!validation.error}
        />
        {validation.error && <p className="text-sm text-red-500 font-light">{validation.error}</p>}
      </div>

      <ExamplePatterns 
        patterns={examplePatterns}
        onSelect={validateAndSetSearchTerm}
      />

      <DomainList searchTerm={searchTerm} isValid={validation.isValid} />
      
    </div>
  )
}