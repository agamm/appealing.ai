import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const [entries, setEntries] = useState<Map<Element, IntersectionObserverEntry>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const entriesRef = useRef<Map<Element, IntersectionObserverEntry>>(new Map())

  // Memoize options to prevent infinite loops
  const memoizedOptions = useMemo(
    () => ({
      threshold: options.threshold,
      root: options.root,
      rootMargin: options.rootMargin,
    }),
    [options.threshold, options.root, options.rootMargin]
  )

  useEffect(() => {
    const observer = new IntersectionObserver((newEntries) => {
      // Update ref immediately
      newEntries.forEach((entry) => {
        entriesRef.current.set(entry.target, entry)
      })
      
      // Batch state updates
      setEntries(new Map(entriesRef.current))
    }, memoizedOptions)

    observerRef.current = observer
    
    // Store current entries ref for cleanup
    const currentEntriesRef = entriesRef.current

    return () => {
      observer.disconnect()
      observerRef.current = null
      currentEntriesRef.clear()
    }
  }, [memoizedOptions])

  const observe = useCallback((element: Element) => {
    if (observerRef.current && element) {
      observerRef.current.observe(element)
    }
  }, [])

  const unobserve = useCallback((element: Element) => {
    if (observerRef.current && element) {
      observerRef.current.unobserve(element)
      entriesRef.current.delete(element)
    }
  }, [])

  return { entries, observe, unobserve }
}