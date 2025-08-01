"use client"

import type React from "react"
import { useEffect, useCallback, useRef } from "react"
import { ChevronUp, ChevronDown, CaseSensitiveIcon as MatchCase, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchResult {
  path: string
  type: "key" | "value"
  text: string
  position: number
}

interface SearchBarProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  searchResults: SearchResult[]
  setSearchResults: (results: SearchResult[]) => void
  currentSearchIndex: number
  setCurrentSearchIndex: (index: number) => void
  caseSensitive: boolean
  setCaseSensitive: (sensitive: boolean) => void
  jsonData: any
  scrollContainerRef: React.RefObject<HTMLDivElement>
}

export function SearchBar({
  searchTerm,
  setSearchTerm,
  searchResults,
  setSearchResults,
  currentSearchIndex,
  setCurrentSearchIndex,
  caseSensitive,
  setCaseSensitive,
  jsonData,
  scrollContainerRef,
}: SearchBarProps) {
  // Optimized search using DFS algorithm
  const performSearch = useCallback(
    (term: string, data: any, path: string[] = []): SearchResult[] => {
      const results: SearchResult[] = []
      if (!term) return results

      const searchTerm = caseSensitive ? term : term.toLowerCase()
      const visited = new WeakSet()
      const stack = [{ value: data, path: [] }]

      while (stack.length > 0) {
        const { value, path: currentPath } = stack.pop()!

        if (typeof value === "object" && value !== null) {
          if (visited.has(value)) continue
          visited.add(value)

          if (Array.isArray(value)) {
            value.forEach((item, index) => {
              stack.push({ value: item, path: [...currentPath, index.toString()] })
            })
          } else {
            Object.entries(value).forEach(([key, val]) => {
              // Search in key
              const keyToSearch = caseSensitive ? key : key.toLowerCase()
              if (keyToSearch.includes(searchTerm)) {
                results.push({
                  path: [...currentPath, key].join("."),
                  type: "key",
                  text: key,
                  position: results.length,
                })
              }

              stack.push({ value: val, path: [...currentPath, key] })
            })
          }
        } else {
          // Search in primitive values
          const valueStr = caseSensitive ? String(value) : String(value).toLowerCase()
          if (valueStr.includes(searchTerm)) {
            results.push({
              path: currentPath.join("."),
              type: "value",
              text: String(value),
              position: results.length,
            })
          }
        }
      }

      return results
    },
    [caseSensitive],
  )

  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  const debouncedSearch = useCallback(
    (term: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      searchTimeoutRef.current = setTimeout(() => {
        if (jsonData && term) {
          const results = performSearch(term, jsonData)
          setSearchResults(results)
          setCurrentSearchIndex(results.length > 0 ? 0 : -1)
        } else {
          setSearchResults([])
          setCurrentSearchIndex(-1)
        }
      }, 150)
    },
    [jsonData, performSearch, setSearchResults, setCurrentSearchIndex],
  )

  // Update search results when search term changes
  useEffect(() => {
    debouncedSearch(searchTerm)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, debouncedSearch])

  // Navigate search results
  const navigateSearch = (direction: "next" | "prev") => {
    if (searchResults.length === 0) return

    if (direction === "next") {
      setCurrentSearchIndex((prev) => (prev + 1) % searchResults.length)
    } else {
      setCurrentSearchIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length)
    }
  }

  // Keyboard shortcuts for search navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "F3" || (e.key === "Enter" && e.target === document.getElementById("search-input"))) &&
        searchResults.length > 0
      ) {
        e.preventDefault()
        navigateSearch("next")
      }

      if (e.key === "F3" && e.shiftKey && searchResults.length > 0) {
        e.preventDefault()
        navigateSearch("prev")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [searchResults.length])

  return (
    <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 rounded px-2 py-1">
      <input
        id="search-input"
        type="text"
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-32 bg-transparent text-xs focus:outline-none placeholder-stone-400 dark:placeholder-stone-500"
      />

      {searchTerm && (
        <>
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={cn(
              "p-0.5 rounded text-xs transition-colors",
              caseSensitive ? "bg-stone-200 dark:bg-stone-700" : "hover:bg-stone-200 dark:hover:bg-stone-700",
            )}
            title="Case sensitive"
          >
            <MatchCase className="h-3 w-3" />
          </button>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => navigateSearch("prev")}
              className="p-0.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
              title="Previous (Shift+F3)"
              disabled={searchResults.length === 0}
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => navigateSearch("next")}
              className="p-0.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
              title="Next (F3)"
              disabled={searchResults.length === 0}
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {searchResults.length > 0 && (
            <span className="text-xs text-stone-500 dark:text-stone-400 ml-1">
              {currentSearchIndex + 1}/{searchResults.length}
            </span>
          )}

          <button
            onClick={() => setSearchTerm("")}
            className="p-0.5 hover:bg-stone-200 dark:hover:bg-stone-700 rounded transition-colors"
            title="Clear search"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  )
}
