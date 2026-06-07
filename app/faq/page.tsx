"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { GITHUB_URL, OPENROUTER_KEYS_URL, VERCEL_DEPLOY_URL } from "@/lib/links"
import { GitHubIcon } from "@/components/github-icon"

interface FAQItem {
  question: string
  answer: React.ReactNode
}

const faqItems: FAQItem[] = [
  {
    question: "How do I use the domain search?",
    answer: (
      <div className="space-y-4">
        <p>Our domain search uses AI to generate creative domain combinations based on patterns you provide. Here are some examples:</p>
        
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded">
            <code className="text-sm font-mono">{"(get/set)something.com"}</code>
            <p className="text-sm text-gray-600 mt-1">Generates: getsomething.com, setsomething.com</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <code className="text-sm font-mono">{"(one dictionary word).io"}</code>
            <p className="text-sm text-gray-600 mt-1">Generates domains with common dictionary words like: bridge.io, nature.io, ocean.io</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <code className="text-sm font-mono">{"(words similar to spark).com"}</code>
            <p className="text-sm text-gray-600 mt-1">Generates domains with related words like: flame.com, ignite.com, flash.com</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-600">You can also search for specific domains directly without patterns, like: example.com</p>
      </div>
    )
  },
  {
    question: "How accurate is the availability checking?",
    answer: (
      <div className="space-y-3">
        <p>Each domain is checked live through a chain of sources, stopping at the first conclusive answer:</p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li><span className="font-medium">RDAP</span> — the registries&apos; official registration-data protocol. A <code className="text-xs">404</code> means the domain isn&apos;t registered. Covers most modern TLDs.</li>
          <li><span className="font-medium">DNS</span> — if the domain resolves to an IP, it&apos;s definitely taken (even when RDAP is unavailable).</li>
          <li><span className="font-medium">WHOIS</span> — a text lookup parsed for &quot;not found&quot; vs. active registration records.</li>
          <li><span className="font-medium">Domainr API</span> — an optional final fallback for TLDs the above don&apos;t cover (only if a key is configured).</li>
        </ol>
        <p>If every source errors or is inconclusive, the domain is shown as <span className="font-medium">taken</span> — we&apos;d rather hide a long shot than show you a &quot;free&quot; domain that isn&apos;t. So a green &quot;available&quot; is high-confidence, but registry caches and pending registrations mean it&apos;s not a guarantee.</p>
        <p>Always confirm at your registrar&apos;s checkout before buying.</p>
      </div>
    )
  },
  {
    question: "Can I run my own copy?",
    answer: (
      <div className="space-y-3">
        <p>Yes — Swooper is open source. You can deploy your own instance and bring your own OpenRouter key, so you only pay for your own usage.</p>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>
            Grab a free key at{" "}
            <a href={OPENROUTER_KEYS_URL} target="_blank" rel="noopener noreferrer" className="text-purple-600 underline underline-offset-2 hover:text-purple-800">
              openrouter.ai/keys
            </a>
            .
          </li>
          <li>Deploy to Vercel and paste your key when prompted.</li>
          <li>That&apos;s it — your instance, your credits.</li>
        </ol>
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <a href={VERCEL_DEPLOY_URL} target="_blank" rel="noopener noreferrer" aria-label="Deploy with Vercel">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://vercel.com/button" alt="Deploy with Vercel" height={32} className="h-8" />
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
            <GitHubIcon className="w-4 h-4" />
            Source on GitHub
          </a>
        </div>
      </div>
    )
  }
]

function FAQItemComponent({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">{item.question}</span>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-gray-600">
          {item.answer}
        </div>
      )}
    </div>
  )
}

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set()) // All collapsed by default

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Link href="/" className="text-2xl font-extralight text-gray-900 hover:text-gray-700 transition-colors">
              Swooper
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-600 mb-8">Everything you need to know about using Swooper</p>
          
          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <FAQItemComponent
                key={index}
                item={item}
                isOpen={openItems.has(index)}
                onToggle={() => toggleItem(index)}
              />
            ))}
          </div>
        </div>
      </div>
      
      <footer className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Home
            </Link>
            <span className="text-sm text-gray-400">•</span>
            <Link
              href="/deploy"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
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
        </div>
      </footer>
    </div>
  )
}