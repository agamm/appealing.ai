interface ExamplePattern {
  label: string
  value: string
}

interface ExamplePatternsProps {
  patterns: ExamplePattern[]
  onSelect: (value: string) => void
}

export function ExamplePatterns({ patterns, onSelect }: ExamplePatternsProps) {
  return (
    <div className="flex gap-4 flex-wrap">
      {patterns.map((example, index) => (
        <button
          key={index}
          onClick={() => onSelect(example.value)}
          className="text-xs font-thin text-gray-500 hover:text-gray-800 transition-colors cursor-pointer underline-offset-2 decoration-from-font decoration-thin"
          style={{ textDecorationLine: 'underline', textDecorationThickness: '0.5px' }}
        >
          {example.label}
        </button>
      ))}
    </div>
  )
}