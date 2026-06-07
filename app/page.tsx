import DomainGenerator from "../domain-generator"
import Link from "next/link"
import { Suspense } from "react"
import { MODEL_DISPLAY_NAME } from "@/lib/generate-options"
import { GITHUB_URL } from "@/lib/links"
import { GitHubIcon } from "@/components/github-icon"
import { RunYourOwn } from "@/components/run-your-own"
import { LANDING_ONLY } from "@/lib/config"

function Footer({ showModel }: { showModel?: boolean }) {
  return (
    <footer className="px-4 py-8 flex flex-col items-center gap-3">
      <div className="flex gap-4 justify-center">
        <Link href="/faq" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          FAQ
        </Link>
        <span className="text-sm text-gray-400">•</span>
        <Link href="/deploy" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          Self-host
        </Link>
        <span className="text-sm text-gray-400">•</span>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <GitHubIcon className="w-3.5 h-3.5" />
          GitHub
        </a>
      </div>
      {showModel && <p className="text-xs text-gray-400 font-light">{MODEL_DISPLAY_NAME}</p>}
    </footer>
  )
}

export default function Page() {
  // Public showcase (no OpenRouter key, or NEXT_PUBLIC_LANDING_ONLY=true):
  // show the "Run your own copy" page instead of the tool.
  if (LANDING_ONLY) {
    return (
      <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)]">
        <div className="flex-grow px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Link href="/" className="text-2xl font-extralight text-gray-900 hover:text-gray-700 transition-colors">
                Swooper
              </Link>
            </div>
            <RunYourOwn />
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)]">
      <main className="flex-grow flex flex-col p-8 sm:p-20">
        <div className="flex flex-col gap-8 items-center pt-20">
          <Link href="/" className="text-5xl font-extralight tracking-tight text-gray-900 hover:text-gray-700 transition-colors cursor-pointer">
            <h1>Swooper</h1>
          </Link>
          <p className="text-gray-500 text-center max-w-md font-light text-lg">
            Ready to find a really good domain name?
          </p>
          <Suspense fallback={<div className="animate-pulse h-12 w-96 bg-gray-100 rounded-md"></div>}>
            <DomainGenerator />
          </Suspense>
        </div>
      </main>
      <Footer showModel />
    </div>
  )
}
