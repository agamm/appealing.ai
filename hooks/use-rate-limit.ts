import { useState, useEffect, useCallback } from 'react'

interface RateLimitData {
  dailySearches: number
  searchLimits: Record<string, number> // searchId -> tryMoreCount
  lastReset: number
  userId: string
}

const STORAGE_KEY = 'appealing-rate-limits'
const DAILY_SEARCH_LIMIT = 5
const TRY_MORE_PER_SEARCH_LIMIT = 2
const DAY_IN_MS = 24 * 60 * 60 * 1000

function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function loadRateLimitData(): RateLimitData {
  if (typeof window === 'undefined') {
    return {
      dailySearches: 0,
      searchLimits: {},
      lastReset: Date.now(),
      userId: generateUserId()
    }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored) as RateLimitData
      const now = Date.now()
      
      // Reset daily limits if a day has passed
      if (now - data.lastReset > DAY_IN_MS) {
        data.dailySearches = 0
        data.searchLimits = {}
        data.lastReset = now
      }
      
      return data
    }
  } catch (error) {
    console.error('Failed to load rate limit data:', error)
  }

  // Return default data
  return {
    dailySearches: 0,
    searchLimits: {},
    lastReset: Date.now(),
    userId: generateUserId()
  }
}

function saveRateLimitData(data: RateLimitData): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Failed to save rate limit data:', error)
  }
}

export function useRateLimit() {
  const [data, setData] = useState<RateLimitData>(loadRateLimitData)

  // Load data on mount
  useEffect(() => {
    setData(loadRateLimitData())
  }, [])

  // Save data whenever it changes
  useEffect(() => {
    saveRateLimitData(data)
  }, [data])

  const checkDailySearchLimit = useCallback((): { allowed: boolean; remaining: number } => {
    const allowed = data.dailySearches < DAILY_SEARCH_LIMIT
    const remaining = Math.max(0, DAILY_SEARCH_LIMIT - data.dailySearches)
    return { allowed, remaining }
  }, [data.dailySearches])

  const incrementDailySearches = useCallback(() => {
    setData(prev => ({
      ...prev,
      dailySearches: prev.dailySearches + 1
    }))
  }, [])

  const checkTryMoreLimit = useCallback((searchId: string): { allowed: boolean; remaining: number } => {
    const tryMoreCount = data.searchLimits[searchId] || 0
    const allowed = tryMoreCount < TRY_MORE_PER_SEARCH_LIMIT
    const remaining = Math.max(0, TRY_MORE_PER_SEARCH_LIMIT - tryMoreCount)
    return { allowed, remaining }
  }, [data.searchLimits])

  const incrementTryMore = useCallback((searchId: string) => {
    setData(prev => ({
      ...prev,
      searchLimits: {
        ...prev.searchLimits,
        [searchId]: (prev.searchLimits[searchId] || 0) + 1
      }
    }))
  }, [])

  const resetLimits = useCallback(() => {
    setData(prev => ({
      ...prev,
      dailySearches: 0,
      searchLimits: {},
      lastReset: Date.now()
    }))
  }, [])

  return {
    userId: data.userId,
    checkDailySearchLimit,
    incrementDailySearches,
    checkTryMoreLimit,
    incrementTryMore,
    resetLimits,
    dailySearchesUsed: data.dailySearches,
    dailySearchesRemaining: Math.max(0, DAILY_SEARCH_LIMIT - data.dailySearches)
  }
}