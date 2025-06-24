import { CheckCircle, XCircle, ExternalLink } from "lucide-react"
import Image from "next/image"

interface DomainResultProps {
  domain: string
  isAvailable: boolean | null
  isFirstNewBatch?: boolean
  showNewBatchDivider?: boolean
  isHighlighted?: boolean
  isFadingOut?: boolean
}

export function DomainResult({ 
  domain, 
  isAvailable, 
  isFirstNewBatch, 
  showNewBatchDivider,
  isHighlighted = false,
  isFadingOut = false
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
          <span className="text-xs text-gray-400 font-light">New suggestions</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>
      )}
      <div
        className={`px-4 py-2.5 text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-150 border border-transparent hover:border-gray-200 font-light ${
          isHighlighted && !isFadingOut ? 'highlight-unseen' : ''
        } ${isFadingOut ? 'highlight-fade-out' : ''}`}
      >
        <div className="flex items-center justify-between">
          <span 
            className={`cursor-pointer ${isAvailable === false ? 'text-gray-400 underline' : 'text-gray-700'}`}
            onClick={handleClick}
            title={isAvailable === false ? "Click to visit" : "Click to copy"}
          >
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
                <span className="text-xs font-normal">Available</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-500">
              <XCircle className="w-4 h-4" />
              <span className="text-xs font-normal">Taken</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}