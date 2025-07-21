import DomainGenerator from "../domain-generator"
import Link from "next/link"
import { Suspense } from "react"

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-geist-sans)]">
      <main className="flex-grow flex flex-col p-8 sm:p-20">
        <div className="flex flex-col gap-8 items-center pt-20">
          <Link href="/" className="text-5xl font-extralight tracking-tight text-gray-900 hover:text-gray-700 transition-colors cursor-pointer">
            <h1>Appealing.ai</h1>
          </Link>
          <p className="text-gray-500 text-center max-w-md font-light text-lg">
            Ready to find a really good domain name?
          </p>
          <Suspense fallback={<div className="animate-pulse h-12 w-96 bg-gray-100 rounded-md"></div>}>
            <DomainGenerator />
          </Suspense>
        </div>
      </main>
      
      <footer className="px-4 py-8">
        <div className="flex gap-4 justify-center">
          <Link 
            href="/faq" 
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            FAQ
          </Link>
          <span className="text-sm text-gray-400">•</span>
          <Link 
            href="/legal" 
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Legal
          </Link>
          <span className="text-sm text-gray-400">•</span>
          <Link 
            href="/privacy" 
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Privacy
          </Link>
        </div>
      </footer>
    </div>
  )
}
