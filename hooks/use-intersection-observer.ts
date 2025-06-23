import { useEffect, useRef, useState, useCallback } from 'react'

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

  useEffect(() => {
    observerRef.current = new IntersectionObserver((newEntries) => {
      setEntries((prevEntries) => {
        const updatedEntries = new Map(prevEntries)
        newEntries.forEach((entry) => {
          updatedEntries.set(entry.target, entry)
        })
        return updatedEntries
      })
    }, options)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [options.threshold, options.root, options.rootMargin])

  const observe = useCallback((element: Element) => {
    observerRef.current?.observe(element)
  }, [])

  const unobserve = useCallback((element: Element) => {
    observerRef.current?.unobserve(element)
    // Don't update state here to avoid re-renders during unmount
  }, [])

  return { entries, observe, unobserve }
}