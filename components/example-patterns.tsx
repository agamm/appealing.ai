interface ExamplePattern {
  label: string;
  value: string;
}

interface ExamplePatternsProps {
  patterns: ExamplePattern[];
  onSelect: (value: string) => void;
}

function renderLabelWithParentheses(label: string) {
  // Split by parentheses while keeping the delimiters
  const parts = label.split(/(\([^)]*\))/);
  
  return parts.map((part, index) => {
    // Check if this part is within parentheses
    if (part.startsWith('(') && part.endsWith(')')) {
      return (
        <span key={index} className="text-purple-500 group-hover:text-purple-700 bg-purple-50 group-hover:bg-purple-100 px-1.5 py-0.5 rounded-md text-[12px] mx-0.5 underline underline-offset-2 decoration-from-font decoration-thin transition-colors" style={{ textDecorationThickness: '0.5px' }}>
          {part}
        </span>
      );
    }
    return <span key={index} className="underline underline-offset-2 decoration-from-font decoration-thin" style={{ textDecorationThickness: '0.5px' }}>{part}</span>;
  });
}

export function ExamplePatterns({ patterns, onSelect }: ExamplePatternsProps) {
  return (
    <div className="flex gap-4 flex-wrap">
      {patterns.map((example, index) => (
        <button
          key={index}
          onClick={() => onSelect(example.value)}
          className="group text-xs font-thin text-gray-500 hover:text-gray-800 transition-colors cursor-pointer underline-offset-2 decoration-from-font decoration-thin"
          style={{ textDecorationLine: 'underline', textDecorationThickness: '0.5px' }}
        >
          {renderLabelWithParentheses(example.label)}
        </button>
      ))}
    </div>
  );
}