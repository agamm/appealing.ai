"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, Sparkles } from "lucide-react"
import { extractPatterns } from "@/lib/patterns"
import { HighlightedInput } from "@/components/highlighted-input"

interface DomainResult {
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
  const [domains, setDomains] = useState<DomainResult[]>([])
  const [isExpanding, setIsExpanding] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(100)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const checkingRef = useRef<Set<string>>(new Set())
  const abortControllerRef = useRef<AbortController | null>(null)
  const checkAbortControllersRef = useRef<Map<string, AbortController>>(new Map())

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
        headers: { 'Content-Type': 'application/json' },
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
      return
    }

    abortControllerRef.current = new AbortController()

    const expandDomains = async () => {
      setIsExpanding(true)
      setError(null)
      setDomains([])
      checkingRef.current.clear()

      try {
        const response = await fetch('/api/domains/expand', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pattern: searchTerm }),
          signal: abortControllerRef.current?.signal
        })

        if (!response.ok) {
          throw new Error('Failed to expand domains')
        }

        const data = await response.json()
        const domainResults: DomainResult[] = data.domains.map((domain: string) => ({
          domain,
          isAvailable: null
        }))
        
        setDomains(domainResults)
        setIsExpanding(false)
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setError("Failed to generate domains. Please try again.")
          console.error('Error:', error)
        }
        setIsExpanding(false)
        setIsChecking(false)
      }
    }

    const timer = setTimeout(expandDomains, 500)
    return () => {
      clearTimeout(timer)
      abortAllChecks()
    }
  }, [searchTerm, isValid])

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
        headers: { 'Content-Type': 'application/json' },
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
      const newDomainResults: DomainResult[] = data.domains.map((domain: string) => ({
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
  const unavailableCount = domains.filter(d => d.isAvailable === false).length

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
      <div className="space-y-1">
        {visibleDomains.map((item, index) => {
          // Check if this is the first item from a new batch
          const isFirstNewBatch = item.isNewBatch && 
            (index === 0 || !visibleDomains[index - 1].isNewBatch)
          
          return (
            <div key={index}>
              {isFirstNewBatch && index > 0 && (
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-gray-400 font-light">New suggestions</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
              )}
              <div
                className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer transition-colors duration-150 border border-transparent hover:border-gray-200 flex items-center justify-between font-light"
                onClick={() => navigator.clipboard.writeText(item.domain)}
                title="Click to copy"
              >
            <span className={item.isAvailable === false ? 'text-gray-400' : 'text-gray-700'}>{item.domain}</span>
            {item.isAvailable === null ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full loading-dot"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full loading-dot" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full loading-dot" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            ) : item.isAvailable ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-normal">Available</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-500">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-normal">Taken</span>
              </div>
            )}
              </div>
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

      {/* Try More button - show when we have unavailable domains, pattern has patterns, and all domains are visible */}
      {unavailableCount > 0 && extractPatterns(searchTerm).length > 0 && !isLoadingMore && !isChecking && !hasMore && (
        <div className="flex justify-center pt-6">
          <Button 
            onClick={loadMoreDomains}
            className="font-light"
            variant="default"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 opacity-70" />
            Try More Suggestions
          </Button>
        </div>
      )}

      {isLoadingMore && (
        <div className="text-center text-sm text-gray-500 pt-4 font-light">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Generating more suggestions based on unavailable domains...
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
    { label: "{{get/set}}something.com", value: "{{get/set}}something.com" },
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

      <div className="flex gap-2 flex-wrap">
        {examplePatterns.map((example, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => validateAndSetSearchTerm(example.value)}
            className="text-xs cursor-pointer font-light"
          >
            {example.label}
          </Button>
        ))}
      </div>

      <DomainList searchTerm={searchTerm} isValid={validation.isValid} />
    </div>
  )
}