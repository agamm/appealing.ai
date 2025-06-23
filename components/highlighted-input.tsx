"use client"

import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface HighlightedInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  error?: boolean
}

export function HighlightedInput({ 
  value, 
  onChange, 
  placeholder, 
  className,
  error 
}: HighlightedInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const renderRef = useRef<HTMLDivElement>(null)

  // Sync scroll position between input and render div
  const syncScroll = () => {
    if (inputRef.current && renderRef.current) {
      renderRef.current.scrollLeft = inputRef.current.scrollLeft
    }
  }

  // Split text by {{ }} patterns using regex
  const renderHighlightedText = () => {
    if (!value) return null

    // Split by {{...}} pattern while keeping the delimiters
    const parts = value.split(/({{.*?}})/g)
    
    return parts.map((part, index) => {
      const isPattern = part.startsWith('{{') && part.endsWith('}}')
      
      if (isPattern) {
        return (
          <span
            key={index}
            className="bg-purple-100 text-purple-700 rounded"
            style={{ 
              // Use box-decoration-break to handle multi-line scenarios
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone'
            }}
          >
            {part}
          </span>
        )
      }
      
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className="relative w-full">
      {/* Render layer - positioned absolutely behind input */}
      <div
        ref={renderRef}
        className={cn(
          "absolute inset-0 overflow-hidden whitespace-pre pointer-events-none",
          "px-3 py-2 text-sm font-light rounded-md border border-transparent",
          "select-none",
          // Match input's font properties exactly
          "font-[family-name:var(--font-geist-sans)]"
        )}
        style={{
          // Ensure exact same font rendering as input
          letterSpacing: 'inherit',
          wordSpacing: 'inherit',
          lineHeight: 'inherit'
        }}
        aria-hidden="true"
      >
        {renderHighlightedText()}
      </div>

      {/* Input layer - transparent text */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        placeholder={placeholder}
        className={cn(
          "relative w-full rounded-md border px-3 py-2 text-sm font-light",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-red-500" : "border-input",
          // Make text transparent while keeping caret visible
          "[color:transparent] [-webkit-text-fill-color:transparent]",
          // Ensure caret is visible
          "[caret-color:black]",
          // Ensure proper text selection
          "[&::selection]:bg-blue-200/50",
          className
        )}
        style={{
          // Ensure caret color for all browsers
          caretColor: 'black'
        }}
      />
    </div>
  )
}