"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Upload, Download, Copy, Sun, Moon, ChevronRight, BarChart3, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { JsonTreeNode } from "./json-tree-node"
import { SearchBar } from "./search-bar"
import { LoadingSpinner } from "./loading-spinner"
import { SchemaValidator } from "./schema-validator"
import { parseJsonWithMetrics, type ParseMetrics } from "@/lib/json-parser"
import { validateJsonSchema, type ValidationError } from "@/lib/schema-validator"
import Link from "next/link"

export function JsonViewer() {
  const [jsonData, setJsonData] = useState<any>(null)
  const [originalData, setOriginalData] = useState<any>(null)
  const [jsonString, setJsonString] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [expandAll, setExpandAll] = useState(false)
  const [isEdited, setIsEdited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parseMetrics, setParseMetrics] = useState<ParseMetrics | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [jsonSchema, setJsonSchema] = useState<string>("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Toggle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [isDarkMode])

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && systemDark)
    setIsDarkMode(shouldBeDark)
  }, [])

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        setJsonString(content)
        setError(null)
        toast({
          title: "File loaded",
          description: `${file.name} ready to parse`,
        })
      } catch (error) {
        setError("Failed to read file")
      }
    }
    reader.onerror = () => {
      setError("Failed to read file")
    }
    reader.readAsText(file)
  }

  // Handle JSON input
  const handleJsonInput = (value: string) => {
    setJsonString(value)
    setError(null)
    if (!value.trim()) {
      setJsonData(null)
      setOriginalData(null)
      setParseMetrics(null)
    }
  }

  // Parse JSON with loading animation
  const parseJson = async () => {
    if (!jsonString.trim()) {
      setError("Please enter JSON content")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await parseJsonWithMetrics(jsonString)

      setJsonData(result.data)
      setOriginalData(JSON.parse(JSON.stringify(result.data)))
      setParseMetrics(result.metrics)
      setIsEdited(false)
      setIsLoading(false)

      // Validate against schema if provided
      if (jsonSchema.trim()) {
        const errors = validateJsonSchema(result.data, jsonSchema)
        setValidationErrors(errors)
      }

      toast({
        title: "JSON parsed successfully",
        description: `${result.metrics.nodeCount} nodes processed`,
      })
    } catch (error) {
      setIsLoading(false)
      setError(error instanceof Error ? error.message : "Invalid JSON syntax")
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(text)
      toast({
        title: "Copied",
        description: "Content copied to clipboard",
      })
    } catch (error) {
      setError("Failed to copy to clipboard")
    }
  }

  // Export JSON
  const exportJson = () => {
    if (!jsonData) return

    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData, null, 2))
      const downloadAnchorNode = document.createElement("a")
      downloadAnchorNode.setAttribute("href", dataStr)
      downloadAnchorNode.setAttribute("download", "data.json")
      document.body.appendChild(downloadAnchorNode)
      downloadAnchorNode.click()
      downloadAnchorNode.remove()

      toast({
        title: "Exported",
        description: "JSON file downloaded",
      })
    } catch (error) {
      setError("Failed to export JSON")
    }
  }

  // Update JSON data at a specific path
  const updateJsonAtPath = (path: string[], value: any) => {
    try {
      const newData = JSON.parse(JSON.stringify(jsonData))
      let current = newData

      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]]
      }

      current[path[path.length - 1]] = value
      setJsonData(newData)
      setIsEdited(true)
    } catch (error) {
      setError("Failed to update value")
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault()
        const searchInput = document.getElementById("search-input") as HTMLInputElement
        searchInput?.focus()
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault()
        setExpandAll(!expandAll)
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault()
        fileInputRef.current?.click()
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "s" && jsonData) {
        e.preventDefault()
        exportJson()
      }

      if (e.key === "Escape" && searchTerm) {
        setSearchTerm("")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [expandAll, jsonData, searchTerm])

  // Count lines in the JSON string
  const countLines = (data: any): number => {
    if (!data) return 0
    return JSON.stringify(data, null, 2).split("\n").length
  }

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  return (
    <div className="flex flex-col h-screen bg-stone-50 dark:bg-stone-900 font-mono text-sm">
      {/* Error banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-2 text-red-700 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 h-10 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
            title="Home"
          >
            <Home className="h-4 w-4" />
          </Link>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
            title="Open file (Ctrl+O)"
          >
            <Upload className="h-4 w-4" />
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />

          {jsonData && (
            <>
              <button
                onClick={exportJson}
                className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
                title="Save file (Ctrl+S)"
              >
                <Download className="h-4 w-4" />
              </button>

              <button
                onClick={() => copyToClipboard(JSON.stringify(jsonData, null, 2))}
                className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="h-4 w-4" />
              </button>

              <div className="relative group">
                <button
                  onClick={() => setExpandAll(!expandAll)}
                  className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
                  title=""
                >
                  <ChevronRight className={cn("h-4 w-4 transition-transform", expandAll ? "rotate-90" : "")} />
                </button>
                <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-stone-800 dark:bg-stone-200 text-stone-200 dark:text-stone-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {expandAll ? "Collapse all" : "Expand all"}
                </div>
              </div>

              <Link
                href="/stats"
                className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
                title="View statistics"
              >
                <BarChart3 className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {jsonData && (
            <SearchBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              searchResults={searchResults}
              setSearchResults={setSearchResults}
              currentSearchIndex={currentSearchIndex}
              setCurrentSearchIndex={setCurrentSearchIndex}
              caseSensitive={caseSensitive}
              setCaseSensitive={setCaseSensitive}
              jsonData={jsonData}
              scrollContainerRef={scrollContainerRef}
            />
          )}

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Schema Validator */}
      {jsonData && (
        <SchemaValidator
          jsonSchema={jsonSchema}
          setJsonSchema={setJsonSchema}
          validationErrors={validationErrors}
          setValidationErrors={setValidationErrors}
          jsonData={jsonData}
        />
      )}

      {/* Main content */}
      <main className="flex flex-1 overflow-hidden">
        {!jsonData ? (
          <div className="flex flex-col items-center justify-center w-full h-full gap-4 p-4">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className="max-w-md w-full">
                  <textarea
                    placeholder="Paste JSON here..."
                    value={jsonString}
                    onChange={(e) => handleJsonInput(e.target.value)}
                    className="w-full h-64 p-3 border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-300 dark:focus:ring-emerald-600 resize-none transition-colors"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <button
                      onClick={() => {
                        const exampleJson = {
                          name: "John Doe",
                          age: 30,
                          email: "john@example.com",
                          address: {
                            street: "123 Main St",
                            city: "New York",
                            zipcode: "10001",
                          },
                          hobbies: ["reading", "swimming", "coding"],
                          isActive: true,
                          balance: 1250.5,
                          "nested-array": [
                            { id: 1, value: "alpha" },
                            { id: 2, value: "beta" },
                            { id: 3, value: "gamma" },
                          ],
                          "complex-object": {
                            status: "active",
                            details: {
                              lastLogin: "2024-07-30T10:00:00Z",
                              preferences: {
                                theme: "dark",
                                notifications: true,
                              },
                            },
                            tags: ["user", "premium", "verified"],
                          },
                          nullValue: null,
                          emptyArray: [],
                          emptyObject: {},
                        }
                        setJsonString(JSON.stringify(exampleJson, null, 2))
                      }}
                      className="px-3 py-1 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                    >
                      Try Example
                    </button>
                    <button
                      onClick={parseJson}
                      disabled={!jsonString.trim()}
                      className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Parse JSON
                    </button>
                  </div>
                </div>
                <div className="text-center text-stone-500 dark:text-stone-400 text-xs">
                  <p>Drag & drop a JSON file or paste JSON content</p>
                  <p className="mt-1">Press Ctrl+O to open a file</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Main JSON view */}
            <div className="flex flex-1 overflow-hidden">
              <div ref={scrollContainerRef} className="flex flex-1 overflow-auto">
                {/* Line numbers */}
                <div className="flex-none py-1 px-3 text-right bg-stone-100 dark:bg-stone-800/50 text-stone-400 dark:text-stone-500 select-none border-r border-stone-200 dark:border-stone-700 min-w-[3rem]">
                  {Array.from({ length: countLines(jsonData) }).map((_, i) => (
                    <div key={i} className="h-5 text-xs leading-5">
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* JSON tree */}
                <div className="flex-1 p-2 min-w-0">
                  <JsonTreeNode
                    data={jsonData}
                    label="root"
                    isRoot={true}
                    searchTerm={searchTerm}
                    searchResults={searchResults}
                    currentSearchIndex={currentSearchIndex}
                    caseSensitive={caseSensitive}
                    expandAll={expandAll}
                    onCopy={copyToClipboard}
                    path={[]}
                    updateValue={updateJsonAtPath}
                    validationErrors={validationErrors}
                    scrollContainerRef={scrollContainerRef}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 px-4 py-2 text-xs text-stone-400 dark:text-stone-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Questions? </span>
            <a
              href="mailto:hey@ufraan.com"
              className="hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              hey@ufraan.com
            </a>
            <a
              href="https://twitter.com/ufraaaan"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @ufraaaan
            </a>
          </div>
          <div className="text-stone-300 dark:text-stone-600">·</div>
        </div>
      </footer>
    </div>
  )
}
