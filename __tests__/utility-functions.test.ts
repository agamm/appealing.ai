import { describe, it, expect } from "vitest"
import { extractPatterns, cartesianProduct, generatePermutations } from "../lib/patterns"

describe("Utility Functions", () => {
  describe("extractPatterns", () => {
    it("should extract single pattern", () => {
      const result = extractPatterns("{{get/use}}app.com")
      expect(result).toEqual([
        {
          pattern: "get/use",
          startIndex: 0,
          endIndex: 11,
        },
      ])
    })

    it("should extract multiple patterns", () => {
      const result = extractPatterns("{{get/use}}thing.{{com/io}}")
      expect(result).toEqual([
        {
          pattern: "get/use",
          startIndex: 0,
          endIndex: 11,
        },
        {
          pattern: "com/io",
          startIndex: 17,
          endIndex: 27,
        },
      ])
    })

    it("should handle no patterns", () => {
      const result = extractPatterns("example.com")
      expect(result).toEqual([])
    })

    it("should handle empty patterns", () => {
      const result = extractPatterns("{{}}app.com")
      expect(result).toEqual([])  // Empty patterns are now filtered out
    })

    it("should handle patterns with spaces", () => {
      const result = extractPatterns("{{ get / use }}app.com")
      expect(result).toEqual([
        {
          pattern: " get / use ",
          startIndex: 0,
          endIndex: 15,
        },
      ])
    })

    it("should handle complex patterns", () => {
      const result = extractPatterns("{{prefix/}}{{word}}{{.com/.io}}")
      expect(result).toEqual([
        {
          pattern: "prefix/",
          startIndex: 0,
          endIndex: 11,
        },
        {
          pattern: "word",
          startIndex: 11,
          endIndex: 19,
        },
        {
          pattern: ".com/.io",
          startIndex: 19,
          endIndex: 31,
        },
      ])
    })
  })

  describe("cartesianProduct", () => {
    it("should generate cartesian product of two arrays", () => {
      const result = cartesianProduct(["a", "b"], ["x", "y"])
      expect(result).toEqual([
        ["a", "x"],
        ["a", "y"],
        ["b", "x"],
        ["b", "y"],
      ])
    })

    it("should handle three arrays", () => {
      const result = cartesianProduct(["a", "b"], ["x", "y"], ["1", "2"])
      expect(result).toEqual([
        ["a", "x", "1"],
        ["a", "x", "2"],
        ["a", "y", "1"],
        ["a", "y", "2"],
        ["b", "x", "1"],
        ["b", "x", "2"],
        ["b", "y", "1"],
        ["b", "y", "2"],
      ])
    })

    it("should handle single array", () => {
      const result = cartesianProduct(["a", "b", "c"])
      expect(result).toEqual([["a"], ["b"], ["c"]])
    })

    it("should handle empty array", () => {
      const result = cartesianProduct([])
      expect(result).toEqual([])
    })

    it("should handle arrays with different lengths", () => {
      const result = cartesianProduct(["a"], ["x", "y", "z"])
      expect(result).toEqual([
        ["a", "x"],
        ["a", "y"],
        ["a", "z"],
      ])
    })

    it("should handle one empty array", () => {
      const result = cartesianProduct(["a", "b"], [])
      expect(result).toEqual([])
    })
  })

  describe("generatePermutations", () => {
    it("should generate permutations with single pattern", () => {
      const query = "{{pattern}}app.com"
      const options = {
        "0": ["get", "use"]
      }
      const result = generatePermutations(query, options)
      expect(result).toEqual(["getapp.com", "useapp.com"])
    })

    it("should generate permutations with multiple patterns", () => {
      const query = "{{prefix}}thing.{{tld}}"
      const options = {
        "0": ["get", "use"],
        "1": ["com", "io"]
      }
      const result = generatePermutations(query, options)
      expect(result).toEqual(["getthing.com", "getthing.io", "usething.com", "usething.io"])
    })

    it("should handle no patterns", () => {
      const query = "example.com"
      const options = {}
      const result = generatePermutations(query, options)
      expect(result).toEqual(["example.com"])
    })

    it("should handle patterns with different option counts", () => {
      const query = "{{a}}{{b}}.com"
      const options = {
        "0": ["x", "y", "z"],
        "1": ["1", "2"]
      }
      const result = generatePermutations(query, options)
      expect(result).toEqual(["x1.com", "x2.com", "y1.com", "y2.com", "z1.com", "z2.com"])
    })

    it("should handle patterns with single options", () => {
      const query = "{{single}}app.com"
      const options = {
        "0": ["only"]
      }
      const result = generatePermutations(query, options)
      expect(result).toEqual(["onlyapp.com"])
    })

    it("should handle complex template with multiple patterns", () => {
      const query = "{{pre}}{{mid}}{{post}}.{{ext}}"
      const options = {
        "0": ["a", "b"],
        "1": ["x"],
        "2": ["1", "2"],
        "3": ["com"]
      }
      const result = generatePermutations(query, options)
      expect(result).toEqual(["ax1.com", "ax2.com", "bx1.com", "bx2.com"])
    })
  })
})
