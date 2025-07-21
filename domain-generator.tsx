"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import { extractPatterns } from "@/lib/patterns"
import { HighlightedInput } from "@/components/highlighted-input"
import { ExamplePatterns } from "@/components/example-patterns"
import { DomainResult } from "@/components/domain-result"
import { useRateLimit } from "@/hooks/use-rate-limit"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"
import { useExpandDomains } from "@/hooks/use-expand-domains"
import { useExpandMoreDomains } from "@/hooks/use-expand-more-domains"
import { useCheckDomain } from "@/hooks/use-check-domain"
import { useDebounce } from "@/hooks/use-debounce"
import { useQueryState } from "nuqs"
import { HowToSection } from "@/components/how-to-section"

interface DomainResultData {
  domain: string
  isAvailable: boolean | null
  isNewBatch?: boolean
  batchId?: string
}

function validateDomainQuery(query: string): { isValid: boolean; error: string | null } {
  if (!query.trim()) {
    return { isValid: true, error: null }
  }

  const bracePattern = /\(|\)/g
  const matches = query.match(bracePattern) || []

  let openCount = 0
  for (const match of matches) {
    if (match === "(") {
      openCount++
    } else if (match === ")") {
      openCount--
      if (openCount < 0) {
        return { isValid: false, error: "Found closing ) without opening ( - did you forget to add an opening parenthesis?" }
      }
    }
  }

  if (openCount !== 0) {
    return { isValid: false, error: "Unmatched parentheses - make sure each ( has a closing )" }
  }

  const emptyPatternMatch = query.match(/\(\s*\)/)
  if (emptyPatternMatch) {
    return { isValid: false, error: "Empty pattern () is not allowed - try to write something inside the parentheses. " }
  }

  const outsidePattern = query.replace(/\([^)]*\)/g, "PLACEHOLDER")
  const invalidChars = outsidePattern.match(/[^a-zA-Z0-9.\-PLACEHOLDER]/g)

  if (invalidChars) {
    const firstInvalidChar = invalidChars[0]
    return {
      isValid: false,
      error: `Invalid character '${firstInvalidChar}' outside parentheses. ${firstInvalidChar === '/' ? 'Did you mean to put it inside parentheses like (option1/option2)?' : 'Only letters, numbers, dots, and dashes allowed outside ( ).'}`,
    }
  }

  // Check pattern count limit
  const patternMatches = query.match(/\([^)]*\)/g) || []
  if (patternMatches.length > 4) {
    return {
      isValid: false,
      error: "Too many patterns. Maximum 4 patterns allowed per query.",
    }
  }

  return { isValid: true, error: null }
}

// Component to handle individual domain checking
function DomainChecker({ domain, onResult }: { domain: string; onResult: (domain: string, isAvailable: boolean) => void }) {
  const { isAvailable } = useCheckDomain(domain)
  
  useEffect(() => {
    if (isAvailable !== null) {
      onResult(domain, isAvailable)
    }
  }, [isAvailable, domain, onResult])
  
  return null
}

function DomainList({ searchTerm, isValid }: { searchTerm: string; isValid: boolean }) {
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const [domains, setDomains] = useState<DomainResultData[]>([])
  const [visibleCount, setVisibleCount] = useState(100)
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null)
  const [tryMoreLimitReached, setTryMoreLimitReached] = useState(false)
  const [tryMoreRemaining, setTryMoreRemaining] = useState<number | null>(null)
  const [seenAvailableDomains, setSeenAvailableDomains] = useState<Set<string>>(new Set())
  const [fadingDomains, setFadingDomains] = useState<Set<string>>(new Set())
  const [allGeneratedDomains, setAllGeneratedDomains] = useState<Set<string>>(new Set())
  const [domainsToCheck, setDomainsToCheck] = useState<string[]>([])
  const [currentOptions, setCurrentOptions] = useState<Record<string, string[]>>({})
  const domainRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const processingDomainsRef = useRef<Set<string>>(new Set())
  const { entries, observe, unobserve } = useIntersectionObserver({ threshold: 0.5 })
  
  const { 
    checkDailySearchLimit, 
    incrementDailySearches, 
    checkTryMoreLimit, 
    incrementTryMore
  } = useRateLimit()
  
  // Use domain expansion hooks with debounced search term
  const { 
    domains: expandedDomains, 
    options: expandedOptions, 
    isLoading: isExpanding, 
    error: expandError 
  } = useExpandDomains(debouncedSearchTerm, isValid)
  
  const { 
    expandMore, 
    isLoading: isExpandingMore 
  } = useExpandMoreDomains()

  // Track when available domains are viewed
  useEffect(() => {
    const toFade: string[] = []
    
    entries.forEach((entry, element) => {
      if (entry.isIntersecting) {
        const domain = element.getAttribute('data-domain')
        const isAvailable = element.getAttribute('data-available') === 'true'
        
        if (domain && isAvailable && !seenAvailableDomains.has(domain) && !processingDomainsRef.current.has(domain)) {
          processingDomainsRef.current.add(domain)
          toFade.push(domain)
          
          setTimeout(() => {
            setSeenAvailableDomains(prev => {
              const newSet = new Set(prev)
              newSet.add(domain)
              return newSet
            })
            setFadingDomains(prev => {
              const newSet = new Set(prev)
              newSet.delete(domain)
              return newSet
            })
            processingDomainsRef.current.delete(domain)
          }, 3000)
        }
      }
    })
    
    if (toFade.length > 0) {
      setFadingDomains(prev => {
        const newSet = new Set(prev)
        toFade.forEach(d => newSet.add(d))
        return newSet
      })
    }
  }, [entries, seenAvailableDomains])

  // Set domain ref for intersection observer
  const setDomainRef = useCallback((domain: string, element: HTMLDivElement | null) => {
    if (element) {
      domainRefs.current.set(domain, element)
      observe(element)
    } else {
      const existingElement = domainRefs.current.get(domain)
      if (existingElement) {
        unobserve(existingElement)
        domainRefs.current.delete(domain)
      }
    }
  }, [observe, unobserve])

  // Clean up observers
  useEffect(() => {
    return () => {
      domainRefs.current.forEach(el => unobserve(el))
      domainRefs.current.clear()
      processingDomainsRef.current.clear()
    }
  }, [unobserve])

  // Handle domain checking results
  const handleDomainCheckResult = useCallback((domain: string, isAvailable: boolean) => {
    setDomains(prev => 
      prev.map(d => d.domain === domain ? { ...d, isAvailable } : d)
    )
    setDomainsToCheck(prev => prev.filter(d => d !== domain))
  }, [])

  // Handle expanded domains from hook
  useEffect(() => {
    if (expandedDomains.length > 0) {
      const newDomains: DomainResultData[] = expandedDomains.map((domain: string) => ({
        domain,
        isAvailable: null
      }))
      
      setDomains(newDomains)
      setAllGeneratedDomains(new Set(expandedDomains.map((d: string) => d.toLowerCase())))
      setCurrentOptions(expandedOptions)
      setFadingDomains(new Set())
      setSeenAvailableDomains(new Set())
      setTryMoreLimitReached(false)
      setVisibleCount(100)
      
      // Generate a new search ID
      const searchId = `search-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
      setCurrentSearchId(searchId)
      
      // Check daily search limit after setting domains
      const { allowed } = checkDailySearchLimit()
      if (allowed) {
        incrementDailySearches()
      }
      
      // Start checking domains
      const visibleDomains = newDomains.slice(0, 100)
      setDomainsToCheck(visibleDomains.map(d => d.domain))
    }
  }, [expandedDomains, expandedOptions, checkDailySearchLimit, incrementDailySearches])
  
  // Clear state when search term changes
  useEffect(() => {
    if (!searchTerm.trim() || extractPatterns(searchTerm).length === 0) {
      setDomains([])
      setAllGeneratedDomains(new Set())
      setFadingDomains(new Set())
      setSeenAvailableDomains(new Set())
      setTryMoreLimitReached(false)
      setCurrentOptions({})
      setVisibleCount(100)
      setDomainsToCheck([])
    }
  }, [searchTerm])

  // Monitor try more limit
  useEffect(() => {
    if (currentSearchId) {
      const { allowed, remaining } = checkTryMoreLimit(currentSearchId)
      setTryMoreRemaining(remaining)
      if (!allowed) {
        setTryMoreLimitReached(true)
      }
    }
  }, [currentSearchId, domains.length, checkTryMoreLimit])

  // Check more domains when visible count increases
  useEffect(() => {
    const visibleDomains = domains.slice(0, visibleCount)
    const uncheckedDomains = visibleDomains
      .filter(d => d.isAvailable === null)
      .filter(d => !domainsToCheck.includes(d.domain))
      .map(d => d.domain)
    
    if (uncheckedDomains.length > 0) {
      setDomainsToCheck(prev => [...prev, ...uncheckedDomains])
    }
  }, [visibleCount, domains, domainsToCheck])

  // Load more domains handler
  const loadMoreDomains = async () => {
    if (!currentSearchId) return
    
    const { allowed, remaining } = checkTryMoreLimit(currentSearchId)
    if (!allowed) {
      setTryMoreLimitReached(true)
      return
    }
    
    setTryMoreRemaining(remaining - 1)
    incrementTryMore(currentSearchId)
    
    const handleExpandMore = async () => {
      const data = await expandMore(searchTerm, Array.from(allGeneratedDomains), currentOptions)
      
      if (!data || data.message || data.domains.length === 0) {
        setTryMoreLimitReached(true)
        return
      }
      
      // Merge the new options with current options
      const mergedOptions = { ...currentOptions }
      Object.entries(data.options).forEach(([index, newOpts]) => {
        if (newOpts.length > 0) {
          mergedOptions[index] = [...(mergedOptions[index] || []), ...newOpts]
        }
      })
      setCurrentOptions(mergedOptions)
      
      const batchId = `batch-${Date.now()}`
      const newDomainResults: DomainResultData[] = data.domains.map((domain: string) => ({
        domain,
        isAvailable: null,
        isNewBatch: true,
        batchId
      }))
      
      const newDomainsSet = new Set(allGeneratedDomains)
      data.domains.forEach((domain: string) => newDomainsSet.add(domain.toLowerCase()))
      setAllGeneratedDomains(newDomainsSet)
      
      setDomains(prev => [...prev, ...newDomainResults])
      
      // Increase visible count to show all domains including new ones
      setVisibleCount(prev => prev + data.domains.length)
      
      // Start checking new domains
      setDomainsToCheck(prev => [...prev, ...data.domains])
    }
    
    handleExpandMore()
  }

  const visibleDomains = domains.slice(0, visibleCount)
  const hasMore = visibleCount < domains.length
  const checkedCount = domains.filter(d => d.isAvailable !== null).length
  const availableCount = domains.filter(d => d.isAvailable === true).length
  const isChecking = domainsToCheck.length > 0

  if (!searchTerm.trim() || !isValid) return null

  if (isExpanding) {
    return (
      <div className="mt-4">
        <div className="space-y-4">
          <div className="space-y-1.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-12 bg-gray-50 rounded-md animate-pulse"></div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-500 font-light">
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating domains...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (expandError) {
    return <div className="text-center text-red-500 text-sm py-4 font-light">Failed to generate domains. Please try again.</div>
  }

  if (domains.length === 0) {
    return <HowToSection />
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {visibleDomains.map((item, index) => {
          const previousItem = index > 0 ? visibleDomains[index - 1] : null
          const isFirstInBatch = item.isNewBatch && 
            (!previousItem || previousItem.batchId !== item.batchId)
          
          return (
            <div
              key={`${item.domain}-${index}`}
              ref={(el) => setDomainRef(item.domain, el)}
              data-domain={item.domain}
              data-available={item.isAvailable?.toString()}
            >
              <DomainResult
                domain={item.domain}
                isAvailable={item.isAvailable}
                isFirstNewBatch={isFirstInBatch}
                showNewBatchDivider={isFirstInBatch}
                isHighlighted={item.isAvailable === true && !seenAvailableDomains.has(item.domain)}
                isFadingOut={fadingDomains.has(item.domain)}
              />
            </div>
          )
        })}
      </div>

      {/* Render domain checkers */}
      {domainsToCheck.map(domain => (
        <DomainChecker
          key={domain}
          domain={domain}
          onResult={handleDomainCheckResult}
        />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => setVisibleCount(prev => Math.min(prev + 20, domains.length))} className="text-sm font-light">
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

      {/* Try More button */}
      {domains.length > 0 && extractPatterns(searchTerm).length > 0 && !isExpandingMore && !isChecking && !hasMore && !tryMoreLimitReached && (
        <div className="flex flex-col items-center pt-6 space-y-2">
          <Button 
            onClick={loadMoreDomains}
            className="font-light cursor-pointer"
            variant="default"
            disabled={isExpandingMore}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 opacity-70" />
            Try More Suggestions
          </Button>
          {tryMoreRemaining === 1 && (
            <p className="text-xs text-gray-400 font-light">Last try more attempt</p>
          )}
        </div>
      )}

      {isExpandingMore && (
        <div className="text-center text-sm text-gray-500 pt-4 font-light">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Generating more suggestions...
        </div>
      )}

      {/* Show message when try more limit is reached */}
      {domains.length > 0 && extractPatterns(searchTerm).length > 0 && !isExpandingMore && !isChecking && !hasMore && tryMoreLimitReached && (
        <div className="text-center text-sm text-gray-400 pt-6 font-light">
          No more unique domain suggestions available
        </div>
      )}
    </div>
  )
}

export default function DomainGenerator() {
  const [searchTerm, setSearchTerm] = useQueryState('q', {
    defaultValue: '',
    shallow: false,
    throttleMs: 500, // Match the debounce delay for domain expansion
  })
  const [validation, setValidation] = useState<{ isValid: boolean; error: string | null }>({
    isValid: true,
    error: null,
  })

  const examplePatterns = [
    { label: "(two cybersecurity startup terms).ai", value: "(two cybersecurity startup terms).ai" },
    { label: "(action words)myapp.(com/io)", value: "(action words)myapp.(com/io)" },
    { label: "(one dictionary word).io", value: "(one dictionary word).io" },
  ]

  const validateAndSetSearchTerm = (query: string) => {
    const result = validateDomainQuery(query)
    setValidation(result)
    setSearchTerm(query)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="space-y-2">
        <HighlightedInput
          value={searchTerm}
          onChange={validateAndSetSearchTerm}
          placeholder="Enter domain query: example.com or (get/use)app.(com/io)"
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