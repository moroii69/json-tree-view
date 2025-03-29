"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronRight, Upload, Download, Copy, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export default function JsonTreeViewer() {
  const [jsonData, setJsonData] = useState<any>(null)
  const [originalData, setOriginalData] = useState<any>(null)
  const [jsonString, setJsonString] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [expandAll, setExpandAll] = useState(false)
  const [isEdited, setIsEdited] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Toggle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsed = JSON.parse(content)
        setJsonData(parsed)
        setOriginalData(JSON.parse(JSON.stringify(parsed))) // Deep copy
        setJsonString(JSON.stringify(parsed, null, 2))
        toast({
          title: "JSON loaded",
          description: `${file.name}`,
        })
      } catch (error) {
        toast({
          title: "Invalid JSON",
          description: "The file does not contain valid JSON data.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  // Handle JSON input
  const handleJsonInput = (value: string) => {
    setJsonString(value)
    try {
      if (value.trim()) {
        const parsed = JSON.parse(value)
        setJsonData(parsed)
        setOriginalData(JSON.parse(JSON.stringify(parsed))) // Deep copy
        setIsEdited(false)
      } else {
        setJsonData(null)
        setOriginalData(null)
      }
    } catch (error) {
      // Don't update jsonData if the JSON is invalid
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
    })
  }

  // Export JSON
  const exportJson = () => {
    if (!jsonData) return

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData, null, 2))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "data.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  // Update JSON data at a specific path
  const updateJsonAtPath = (path: string[], value: any) => {
    const newData = JSON.parse(JSON.stringify(jsonData))
    let current = newData

    // Navigate to the parent of the target
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]]
    }

    // Update the value
    current[path[path.length - 1]] = value
    setJsonData(newData)
    setIsEdited(true)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + F for search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault()
        const searchInput = document.getElementById("search-input") as HTMLInputElement
        searchInput?.focus()
      }

      // Ctrl/Cmd + E for expand/collapse all
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault()
        setExpandAll(!expandAll)
      }

      // Ctrl/Cmd + O for open file
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault()
        fileInputRef.current?.click()
      }

      // Ctrl/Cmd + S for save file
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && jsonData) {
        e.preventDefault()
        exportJson()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [expandAll, jsonData])

  // Count lines in the JSON string
  const countLines = (str: string): number => {
    return str.split("\n").length
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-900 font-mono text-sm">
      {/* Minimal header */}
      <header className="flex items-center justify-between px-4 h-10 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
            title="Open file (Ctrl+O)"
          >
            <Upload className="h-4 w-4" />
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />

          {jsonData && (
            <button
              onClick={exportJson}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
              title="Save file (Ctrl+S)"
            >
              <Download className="h-4 w-4" />
            </button>
          )}

          {jsonData && (
            <button
              onClick={() => copyToClipboard(JSON.stringify(jsonData, null, 2))}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
              title="Copy to clipboard"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}

          {jsonData && (
            <button
              onClick={() => setExpandAll(!expandAll)}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
              title={expandAll ? "Collapse all" : "Expand all"}
            >
              <ChevronRight className={cn("h-4 w-4 transition-transform", expandAll ? "rotate-90" : "")} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-2">
  {jsonData && (
    <button
      onClick={() => window.location.reload()}
      className="px-3 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded flex items-center gap-1"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-plus">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
      Start  New  Session
    </button>
  )}
</div>

        <div className="flex items-center gap-2">
          {jsonData && (
            <input
              id="search-input"
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-2 py-1 w-40 bg-transparent border border-zinc-200 dark:border-zinc-700 rounded text-xs focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600"
            />
          )}

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
            title="Toggle theme"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>


<header className="border-b border-zinc-200 dark:border-zinc-800 p-2">
  <h1 className="text-sm font-medium text-center text-zinc-500 dark:text-zinc-400">JSON Tree Viewer - Interactive editor for JSON data</h1>
</header>

<main className="flex flex-1 overflow-hidden">
  {!jsonData ? (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4 p-4">
      <div className="max-w-md w-full">
        <textarea
          placeholder="Paste JSON here..."
          value={jsonString}
          onChange={(e) => handleJsonInput(e.target.value)}
          className="w-full h-64 p-2 border border-zinc-200 dark:border-zinc-700 rounded font-mono text-xs bg-transparent focus:outline-none focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600 resize-none"
        />
        {/* Try Example button */}
        <div className="flex justify-end mt-2">
          <button
            onClick={() => {
              // Example JSON data - you can customize this
              const exampleJson = JSON.stringify(
                {
                  "name": "JSON Tree Viewer",
                  "version": "1.0.0",
                  "description": "Interactive viewer for JSON data",
                  "features": {
                    "treeView": true,
                    "editing": true,
                    "search": true,
                    "themes": ["light", "dark"]
                  },
                  "stats": {
                    "downloads": 1250,
                    "stars": 48,
                    "contributors": 5
                  },
                  "examples": [
                    {
                      "id": 1,
                      "name": "Simple Object"
                    },
                    {
                      "id": 2,
                      "name": "Complex Structure"
                    }
                  ]
                },
                null,
                2
              );

              // Set the example JSON to the textarea
              handleJsonInput(exampleJson);

              // Optional: Auto-parse the example
              try {
                const parsed = JSON.parse(exampleJson);
                setJsonData(parsed);
                setOriginalData(JSON.parse(JSON.stringify(parsed)));
              } catch (error) {
                // Handle error if needed
              }
            }}
            className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded text-xs"
          >
            Try Example
          </button>
        </div>
      </div>
      <div className="text-center text-zinc-500 dark:text-zinc-400 text-xs">
        <p>Drag & drop a JSON file or paste JSON content</p>
        <p className="mt-1">Press Ctrl+O to open a file</p>
      </div>
    </div>
  ) : (
    <div className="flex flex-1 overflow-auto">
      {/* Line numbers */}
      <div className="flex-none py-1 px-2 text-right bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 dark:text-zinc-500 select-none">
        {Array.from({ length: countLines(JSON.stringify(jsonData, null, 2)) }).map((_, i) => (
          <div key={i} className="h-5 text-xs">
            {i + 1}
          </div>
        ))}
      </div>
      {/* JSON tree */}
      <div className="flex-1 p-1 overflow-auto">
        <JsonTreeNode
          data={jsonData}
          label="root"
          isRoot={true}
          searchTerm={searchTerm}
          expandAll={expandAll}
          onCopy={copyToClipboard}
          path={[]}
          updateValue={updateJsonAtPath}
        />
      </div>
    </div>
  )}
</main>
    </div>
  )
}

interface JsonTreeNodeProps {
  data: any
  label: string
  isRoot?: boolean
  searchTerm: string
  expandAll: boolean
  onCopy: (text: string) => void
  path: (string | number)[]
  updateValue: (path: (string | number)[], value: any) => void
}

function JsonTreeNode({
  data,
  label,
  isRoot = false,
  searchTerm,
  expandAll,
  onCopy,
  path,
  updateValue,
}: JsonTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")

  // Effect to handle expandAll state changes
  useEffect(() => {
    setIsExpanded(expandAll)
  }, [expandAll])

  // Determine if this node or any of its children match the search term
  const matchesSearch = useCallback(
    (data: any, term: string): boolean => {
      if (!term) return false

      const termLower = term.toLowerCase()

      // Check if the current key matches
      if (label.toLowerCase().includes(termLower)) return true

      // Check if the value matches (for primitive types)
      if (typeof data !== "object" || data === null) {
        return String(data).toLowerCase().includes(termLower)
      }

      // For objects and arrays, check all children
      return Object.entries(data).some(([key, value]) => {
        if (key.toLowerCase().includes(termLower)) return true
        if (typeof value !== "object" || value === null) {
          return String(value).toLowerCase().includes(termLower)
        }
        return matchesSearch(value, term)
      })
    },
    [label],
  )

  const hasMatch = searchTerm ? matchesSearch(data, searchTerm) : false

  // Automatically expand nodes that match the search term
  useEffect(() => {
    if (hasMatch && searchTerm) {
      setIsExpanded(true)
    }
  }, [searchTerm, hasMatch])

  // Determine the type of data
  const getType = (value: any): string => {
    if (value === null) return "null"
    if (Array.isArray(value)) return "array"
    return typeof value
  }

  const type = getType(data)
  const isExpandable = type === "object" || type === "array"

  // Format the value for display
  const getFormattedValue = (value: any): string => {
    if (value === null) return "null"
    if (value === undefined) return "undefined"
    if (typeof value === "string") return `"${value}"`
    return String(value)
  }

  // Handle node click for expand/collapse
  const handleNodeClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on edit input or buttons
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement || isEditing) {
      return
    }

    if (isExpandable) {
      setIsExpanded(!isExpanded)
    } else {
      // For primitive values, start editing
      startEditing()
    }
  }

  // Start editing a value
  const startEditing = () => {
    if (type !== "object" && type !== "array") {
      setIsEditing(true)
      setEditValue(type === "string" ? data : getFormattedValue(data))
    }
  }

  // Save edited value
  const saveEditedValue = () => {
    try {
      let parsedValue

      if (type === "string") {
        // Remove quotes if they were added
        parsedValue = editValue.replace(/^"(.*)"$/, "$1")
      } else if (type === "number") {
        parsedValue = Number(editValue)
        if (isNaN(parsedValue)) throw new Error("Invalid number")
      } else if (type === "boolean") {
        if (editValue.toLowerCase() === "true") parsedValue = true
        else if (editValue.toLowerCase() === "false") parsedValue = false
        else throw new Error("Invalid boolean")
      } else if (type === "null") {
        if (editValue.toLowerCase() === "null") parsedValue = null
        else throw new Error("Invalid null")
      }

      updateValue(path, parsedValue)
      setIsEditing(false)
    } catch (error) {
      // Revert to original value on error
      setIsEditing(false)
    }
  }

  // Highlight text that matches the search term
  const highlightText = (text: string, term: string) => {
    if (!term) return text

    const parts = text.split(new RegExp(`(${term})`, "gi"))
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <span key={i} className="bg-yellow-100 dark:bg-yellow-900">
          {part}
        </span>
      ) : (
        part
      ),
    )
  }

  // Get the appropriate label for display
  const displayLabel = isRoot ? "" : label

  // Get the length of arrays or objects
  const getLength = (value: any): number => {
    if (Array.isArray(value)) return value.length
    if (typeof value === "object" && value !== null) return Object.keys(value).length
    return 0
  }

  // Get color for different types
  const getTypeColor = () => {
    switch (type) {
      case "string":
        return "text-green-600 dark:text-green-400"
      case "number":
        return "text-blue-600 dark:text-blue-400"
      case "boolean":
        return "text-purple-600 dark:text-purple-400"
      case "null":
        return "text-zinc-500 dark:text-zinc-400"
      default:
        return "text-zinc-800 dark:text-zinc-200"
    }
  }

  return (
    <div className={cn("min-h-[20px]", hasMatch && searchTerm ? "bg-yellow-50 dark:bg-yellow-900/20" : "")}>
      <div
        className={cn(
          "flex items-start gap-1 cursor-pointer h-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
          isEditing ? "pointer-events-none" : "",
        )}
        onClick={handleNodeClick}
      >
        {isExpandable && (
          <button
            className="flex-none w-4 h-5 flex items-center justify-center focus:outline-none"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            <ChevronRight
              className={cn("h-3 w-3 text-zinc-400 transition-transform duration-150", isExpanded ? "rotate-90" : "")}
            />
          </button>
        )}

        <div className="flex-1 flex items-center min-w-0 h-5">
          {displayLabel && (
            <>
              <span className="text-zinc-600 dark:text-zinc-300">{highlightText(displayLabel, searchTerm)}</span>
              <span className="text-zinc-400 dark:text-zinc-500 mx-1">:</span>
            </>
          )}

          {isExpandable ? (
            <div className="flex items-center">
              <span className="text-zinc-500 dark:text-zinc-400">{type === "array" ? "[" : "{"}</span>
              {!isExpanded && (
                <span className="text-zinc-400 dark:text-zinc-500 text-xs ml-1">
                  {getLength(data)} {type === "array" ? "items" : "keys"}
                </span>
              )}
              {!isExpanded && (
                <span className="text-zinc-500 dark:text-zinc-400 ml-1">{type === "array" ? "]" : "}"}</span>
              )}
            </div>
          ) : isEditing ? (
            <div className="flex items-center flex-1">
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-5 py-0 px-1 text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded w-full focus:outline-none"
                autoFocus
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === "Enter") saveEditedValue()
                  if (e.key === "Escape") setIsEditing(false)
                }}
                onBlur={() => saveEditedValue()}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <span
              className={cn("truncate", getTypeColor())}
              onDoubleClick={(e) => {
                e.stopPropagation()
                startEditing()
              }}
            >
              {highlightText(getFormattedValue(data), searchTerm)}
            </span>
          )}
        </div>
      </div>

      {isExpanded && isExpandable && (
        <div className="pl-4 border-l border-zinc-200 dark:border-zinc-700 ml-2 overflow-hidden transition-all duration-150">
          {type === "array" ? (
            <>
              {data.map((item: any, index: number) => (
                <JsonTreeNode
                  key={index}
                  data={item}
                  label={String(index)}
                  searchTerm={searchTerm}
                  expandAll={expandAll}
                  onCopy={onCopy}
                  path={[...path, index]}
                  updateValue={updateValue}
                />
              ))}
              <div className="h-5 flex items-center text-zinc-500 dark:text-zinc-400">]</div>
            </>
          ) : (
            <>
              {Object.entries(data).map(([key, value]) => (
                <JsonTreeNode
                  key={key}
                  data={value}
                  label={key}
                  searchTerm={searchTerm}
                  expandAll={expandAll}
                  onCopy={onCopy}
                  path={[...path, key]}
                  updateValue={updateValue}
                />
              ))}
              <div className="h-5 flex items-center text-zinc-500 dark:text-zinc-400">{"}"}</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

