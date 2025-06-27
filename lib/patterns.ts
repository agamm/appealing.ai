export function extractPatterns(input: string): { pattern: string; startIndex: number; endIndex: number }[] {
  const patterns: { pattern: string; startIndex: number; endIndex: number }[] = []
  const regex = /\(([^()]*)\)/g
  let match

  while ((match = regex.exec(input)) !== null) {
    // Only add non-empty patterns
    if (match[1].trim().length > 0) {
      patterns.push({
        pattern: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      })
    }
  }

  return patterns
}

export function cartesianProduct<T>(...arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) => {
      const result: T[][] = []
      for (const accItem of acc) {
        for (const currItem of curr) {
          result.push([...accItem, currItem])
        }
      }
      return result
    },
    [[]],
  )
}

export function generatePermutations(
  query: string,
  options: Record<string, string[]>, // options by index: {"0": ["opt1", "opt2"], "1": ["opt3", "opt4"]}
): string[] {
  // Extract all patterns from query in order
  const patterns = extractPatterns(query)
  
  if (patterns.length === 0) {
    return [query]
  }

  // Build arrays of options in the same order as patterns appear
  const optionArrays: string[][] = []
  for (let i = 0; i < patterns.length; i++) {
    const opts = options[i.toString()]
    if (!opts || opts.length === 0) {
      // If no options for this pattern, skip this pattern entirely
      return []
    }
    optionArrays.push(opts)
  }

  const combinations = cartesianProduct(...optionArrays)

  return combinations.map((combination) => {
    let result = query
    let offset = 0

    patterns.forEach((pattern, index) => {
      const replacement = combination[index]
      const adjustedStart = pattern.startIndex + offset
      const adjustedEnd = pattern.endIndex + offset
      const originalLength = adjustedEnd - adjustedStart

      result = result.slice(0, adjustedStart) + replacement + result.slice(adjustedEnd)
      offset += replacement.length - originalLength
    })

    return result
  })
}