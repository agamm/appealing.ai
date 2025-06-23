import { CheckCircle, XCircle } from "lucide-react"

interface DomainResultProps {
  domain: string
  isAvailable: boolean | null
  isFirstNewBatch?: boolean
  showNewBatchDivider?: boolean
}

export function DomainResult({ 
  domain, 
  isAvailable, 
  isFirstNewBatch, 
  showNewBatchDivider 
}: DomainResultProps) {
  const handleClick = () => {
    if (isAvailable === false) {
      // Open domain in new tab if taken
      window.open(`https://${domain}`, '_blank')
    } else {
      // Copy to clipboard if available
      navigator.clipboard.writeText(domain)
    }
  }

  return (
    <>
      {showNewBatchDivider && isFirstNewBatch && (
        <div className="flex items-center gap-3 py-3">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-400 font-light">New suggestions</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>
      )}
      <div
        className="px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-md cursor-pointer transition-colors duration-150 border border-transparent hover:border-gray-200 flex items-center justify-between font-light"
        onClick={handleClick}
        title={isAvailable === false ? "Click to visit" : "Click to copy"}
      >
        <span className={isAvailable === false ? 'text-gray-400 underline' : 'text-gray-700'}>
          {domain}
        </span>
        {isAvailable === null ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full loading-dot"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full loading-dot" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full loading-dot" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        ) : isAvailable ? (
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
    </>
  )
}