"use client"

import { useState, useEffect, Suspense } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { generateDomains, type DomainSearchResult } from "./actions/generate-domains"
import { CheckCircle } from "lucide-react"

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
  const [isLoading, setIsLoading] = useState(false)
  const [visibleCount, setVisibleCount] = useState(20)
  const [searchResult, setSearchResult] = useState<DomainSearchResult>({
    domains: [],
    totalChecked: 0,
    availableCount: 0,
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!searchTerm.trim() || !isValid) {
      setSearchResult({ domains: [], totalChecked: 0, availableCount: 0 })
      return
    }

    const generateDomainsAsync = async () => {
      setIsLoading(true)
      setError(null)
      setVisibleCount(20)

      try {
        const result = await generateDomains(searchTerm)
        setSearchResult(result)
      } catch (err) {
        setError("Failed to generate domains. Please try again.")
        setSearchResult({ domains: [], totalChecked: 0, availableCount: 0 })
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(generateDomainsAsync, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, isValid])

  const visibleDomains = searchResult.domains.slice(0, visibleCount)
  const hasMore = visibleCount < searchResult.domains.length

  if (!searchTerm.trim() || !isValid) return null

  if (isLoading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="px-4 py-2 bg-gray-100 rounded-md animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
        <div className="text-center text-sm text-gray-500 mt-4">Generating domains and checking availability...</div>
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-500 text-sm py-4">{error}</div>
  }

  // Show search statistics
  if (searchResult.totalChecked === 0) {
    return <div className="text-center text-gray-500 text-sm py-4">No domains generated. Try a different pattern.</div>
  }

  if (searchResult.availableCount === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-4">
        No available domains found. Checked {searchResult.totalChecked} domain
        {searchResult.totalChecked !== 1 ? "s" : ""}.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {visibleDomains.map((item, index) => (
          <div
            key={index}
            className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md cursor-pointer transition-colors duration-150 border border-transparent hover:border-gray-200 flex items-center justify-between"
            onClick={() => navigator.clipboard.writeText(item.domain)}
            title="Click to copy"
          >
            <span>{item.domain}</span>
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Available</span>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => setVisibleCount((prev) => prev + 20)} className="text-sm">
            Load More ({searchResult.domains.length - visibleCount} remaining)
          </Button>
        </div>
      )}

      <div className="text-center text-sm text-gray-600 pt-2">
        {searchResult.availableCount} available out of {searchResult.totalChecked} searched
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="px-4 py-2 bg-gray-100 rounded-md animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  )
}

export default function DomainGenerator() {
  const [searchTerm, setSearchTerm] = useState("")
  const [validation, setValidation] = useState<{ isValid: boolean; error: string | null }>({
    isValid: true,
    error: null,
  })

  useEffect(() => {
    const result = validateDomainPattern(searchTerm)
    setValidation(result)
  }, [searchTerm])

  const examplePatterns = [
    { label: "{{get/set}}something.com", value: "{{get/set}}something.com" },
    { label: "{{use/try}}myapp.{{com/io}}", value: "{{use/try}}myapp.{{com/io}}" },
    { label: "{{one dictionary word}}.io", value: "{{one dictionary word}}.io" },
  ]

  return (
    <div className="min-h-screen bg-white flex items-start justify-center pt-32">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-light text-gray-900">AI Domain Generator</h1>
          <p className="text-sm text-gray-500">
            Use patterns like {"{get/use}"}myapp.{"{com/io}"}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="e.g. {'{one dictionary word}'}.io"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                validation.isValid ? "border-gray-200 focus:ring-gray-900" : "border-red-500 focus:ring-red-500"
              }`}
            />
            {validation.error && <div className="text-red-500 text-sm px-1">{validation.error}</div>}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-gray-500 px-1">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {examplePatterns.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setSearchTerm(example.value)}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors duration-150 border border-gray-200 cursor-pointer"
                  title={`Click to use: ${example.value}`}
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>

          <Suspense fallback={<LoadingFallback />}>
            <DomainList searchTerm={searchTerm} isValid={validation.isValid} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
