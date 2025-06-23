"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"

interface FAQItem {
  question: string
  answer: React.ReactNode
}

const faqItems: FAQItem[] = [
  {
    question: "How does Appealing.ai make money?",
    answer: (
      <div className="space-y-2">
        <p>We make money through affiliate links when you purchase domains through our partner registrars.</p>
        <p>We'd love if you used our links to support the site, but we completely understand if you have your own preferred domain providers!</p>
        <p className="font-semibold">We do NOT front-run domains. Your searches are private and we never register domains that users search for.</p>
      </div>
    )
  },
  {
    question: "How do I use the domain search?",
    answer: (
      <div className="space-y-4">
        <p>Our domain search uses AI to generate creative domain combinations based on patterns you provide. Here are some examples:</p>
        
        <div className="space-y-3">
          <div className="bg-gray-50 p-3 rounded">
            <code className="text-sm font-mono">{"{{get/set}}something.com"}</code>
            <p className="text-sm text-gray-600 mt-1">Generates: getsomething.com, setsomething.com</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <code className="text-sm font-mono">{"{{one dictionary word}}.io"}</code>
            <p className="text-sm text-gray-600 mt-1">Generates domains with common dictionary words like: bridge.io, nature.io, ocean.io</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <code className="text-sm font-mono">{"{{words similar to spark}}.com"}</code>
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
      <div className="space-y-2">
        <p>We use multiple domain registrar APIs to check availability in real-time. While we strive for accuracy, there might be slight delays or differences between our check and the actual registration.</p>
        <p>Always verify availability with your chosen registrar before making a purchase decision.</p>
      </div>
    )
  },
  {
    question: "Do you register domains directly?",
    answer: (
      <div className="space-y-2">
        <p>No, we don't register domains directly. We're a search and discovery tool that helps you find available domains.</p>
        <p>Once you find a domain you like, you can register it through any domain registrar of your choice. We provide affiliate links to popular registrars if you'd like to support us.</p>
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
              Appealing.ai
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-600 mb-8">Everything you need to know about using Appealing.ai</p>
          
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
        </div>
      </footer>
    </div>
  )
}