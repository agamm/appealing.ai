import { useEffect, useState } from "react"

interface UnseenDomainsIndicatorProps {
  unseenAvailableCount: number
  onClick: () => void
}

export function UnseenDomainsIndicator({ unseenAvailableCount, onClick }: UnseenDomainsIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    if (unseenAvailableCount > 0) {
      setIsVisible(true)
      setIsFading(false)
      
      // Start fade out after 3 seconds
      const fadeTimer = setTimeout(() => {
        setIsFading(true)
      }, 3000)
      
      // Hide completely after fade animation
      const hideTimer = setTimeout(() => {
        setIsVisible(false)
      }, 4000)
      
      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(hideTimer)
      }
    }
  }, [unseenAvailableCount])

  if (!isVisible) return null

  return (
    <div 
      className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 ${isFading ? 'opacity-0 transition-opacity duration-1000' : ''}`}
      onClick={onClick}
    >
      <div className="bg-green-600 text-white rounded-full px-4 py-2 shadow-lg cursor-pointer hover:bg-green-700 transition-colors">
        <span className="font-medium">
          {unseenAvailableCount} available {unseenAvailableCount === 1 ? 'domain' : 'domains'} above
        </span>
      </div>
    </div>
  )
}