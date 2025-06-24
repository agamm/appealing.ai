import { CheckCircle, XCircle, Plus, ExternalLink } from "lucide-react"
import Image from "next/image"

interface DomainResultProps {
  domain: string
  isAvailable: boolean | null
  isFirstNewBatch?: boolean
  showNewBatchDivider?: boolean
  isHighlighted?: boolean
  isFadingOut?: boolean
  onSave?: (domain: string) => void
  isSaved?: boolean
  isFromSaved?: boolean
}

export function DomainResult({ 
  domain, 
  isAvailable, 
  isFirstNewBatch, 
  showNewBatchDivider,
  isHighlighted = false,
  isFadingOut = false,
  onSave,
  isSaved = false,
  isFromSaved = false
}: DomainResultProps) {

  const registrars = [
    {
      name: 'Porkbun',
      logo: '/porkbun-logo.svg',
      url: `https://porkbun.com/checkout/search?q=${domain}`,
      width: 24,
      height: 24
    },
    {
      name: 'Namecheap',
      logo: '/namecheap-logo.svg',
      url: `https://www.namecheap.com/domains/registration/results/?domain=${domain}`,
      width: 80,
      height: 16
    },
    {
      name: 'GoDaddy',
      logo: '/godaddy-logo.svg',
      url: `https://www.godaddy.com/domainsearch/find?domainToCheck=${domain}`,
      width: 70,
      height: 16
    }
  ]

  return (
    <>
      {showNewBatchDivider && isFirstNewBatch && (
        <div className="flex items-center gap-3 py-3">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-xs text-gray-400 font-light">
            {isFromSaved ? 'New suggestions from saved' : 'New suggestions'}
          </span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>
      )}
      <div
        className={`group px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-150 border border-transparent hover:border-gray-200 font-light relative ${
          isHighlighted && !isFadingOut ? 'highlight-unseen' : ''
        } ${isFadingOut ? 'highlight-fade-out' : ''} ${isSaved ? 'bg-blue-50 border-blue-200' : ''}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onSave && !isSaved && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSave(domain)
                }}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-all duration-150 hover:bg-gray-100 rounded flex items-center justify-center"
                title="Save domain"
              >
                <Plus className="w-3.5 h-3.5 text-gray-500" />
              </button>
            )}
            <span 
              className={`${isAvailable === false ? 'text-gray-400' : 'text-gray-700'} ${isSaved ? 'text-blue-700' : ''}`}
            >
              {domain}
            </span>
          </div>
          {isAvailable === null ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full loading-dot"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full loading-dot" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full loading-dot" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          ) : isAvailable ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {registrars.map((registrar) => (
                  <a
                    key={registrar.name}
                    href={registrar.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center opacity-60 hover:opacity-100 transition-opacity"
                    title={`Buy on ${registrar.name}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Image
                      src={registrar.logo}
                      alt={registrar.name}
                      width={registrar.width}
                      height={registrar.height}
                      className="h-4 w-auto object-contain"
                    />
                  </a>
                ))}
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-xs font-normal">{isSaved ? 'Saved' : 'Available'}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <a
                href={`https://${domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center opacity-60 hover:opacity-100 transition-opacity"
                title="Visit domain"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <div className="flex items-center gap-1 text-red-500">
                <XCircle className="w-4 h-4" />
                <span className="text-xs font-normal">{isSaved ? 'Saved (Taken)' : 'Taken'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}