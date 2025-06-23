import { ChevronUp } from "lucide-react"
import { useEffect, useState } from "react"

interface UnseenDomainsIndicatorProps {
  unseenAvailableCount: number
  onClick: () => void
}

export function UnseenDomainsIndicator({ unseenAvailableCount, onClick }: UnseenDomainsIndicatorProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(unseenAvailableCount > 0)
  }, [unseenAvailableCount])

  if (!isVisible) return null

  return (
    <div 
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
      onClick={onClick}
    >
      <div className="bg-green-600 text-white rounded-full px-4 py-2 shadow-lg cursor-pointer hover:bg-green-700 transition-colors flex items-center gap-2">
        <ChevronUp className="w-5 h-5 animate-bounce" />
        <span className="font-medium">
          {unseenAvailableCount} available {unseenAvailableCount === 1 ? 'domain' : 'domains'} above
        </span>
        <ChevronUp className="w-5 h-5 animate-bounce" />
      </div>
    </div>
  )
}