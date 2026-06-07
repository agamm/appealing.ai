import Link from "next/link"
import { GITHUB_URL } from "@/lib/links"
import { GitHubIcon } from "@/components/github-icon"
import { RunYourOwn } from "@/components/run-your-own"

export default function DeployPage() {
  return (
    <div className="min-h-screen flex flex-col">
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

      <footer className="px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Home
            </Link>
            <span className="text-sm text-gray-400">•</span>
            <Link
              href="/faq"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              FAQ
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
        </div>
      </footer>
    </div>
  )
}
