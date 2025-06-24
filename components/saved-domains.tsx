"use client"

import { Button } from "@/components/ui/button"
import { Sparkles, X, Loader2 } from "lucide-react"

interface SavedDomainsProps {
  savedDomains: string[]
  onRemove: (domain: string) => void
  onExpandMore: (domains: string[]) => void
  isExpanding?: boolean
}

export function SavedDomains({ savedDomains, onRemove, onExpandMore, isExpanding = false }: SavedDomainsProps) {
  const handleExpandAll = () => {
    onExpandMore(savedDomains)
  }

  if (savedDomains.length === 0) {
    return null
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-light text-gray-700">Saved Domains ({savedDomains.length})</h3>
        {savedDomains.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleExpandAll}
            disabled={isExpanding}
            className="text-xs font-light"
          >
            {isExpanding ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Finding similar...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 mr-1" />
                Show Similar
              </>
            )}
          </Button>
        )}
      </div>
      
      <div className="space-y-1.5">
        {savedDomains.map((domain) => (
          <div 
            key={domain} 
            className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <span className="text-sm text-gray-600 font-light">{domain}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(domain)}
              className="h-7 w-7 p-0 hover:bg-gray-50"
              title="Remove from saved"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}