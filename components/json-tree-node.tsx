"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ValidationError } from "@/lib/schema-validator"
import { getTypeColor } from "@/lib/utils" // Import getTypeColor

interface JsonTreeNodeProps {
  data: any
  label: string
  isRoot?: boolean
  searchTerm: string
  searchResults: any[]
  currentSearchIndex: number
  caseSensitive: boolean
  expandAll: boolean
  onCopy: (text: string) => void
  path: (string | number)[]
  updateValue: (path: (string | number)[], value: any) => void
  validationErrors: ValidationError[]
  scrollContainerRef: React.RefObject<HTMLDivElement>
}

export const JsonTreeNode = memo(function JsonTreeNode({
  data,
  label,
  isRoot = false,
  searchTerm,
  searchResults,
  currentSearchIndex,
  caseSensitive,
  expandAll,
  onCopy,
  path,
  updateValue,
  validationErrors,
  scrollContainerRef,
}: JsonTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState("")
  const nodeRef = useRef<HTMLDivElement>(null)

  // Effect to handle expandAll state changes
  useEffect(() => {
    setIsExpanded(expandAll)
  }, [expandAll])

  // Check if this node has validation errors
  const hasValidationError = useCallback(() => {
    const currentPath = path.join(".")
    return validationErrors.some((error) => error.path === currentPath)
  }, [validationErrors, path])

  // Determine if this node matches the current search result
  const isCurrentSearchResult = useCallback(() => {
    if (currentSearchIndex === -1 || !searchResults[currentSearchIndex]) return false
    const currentResult = searchResults[currentSearchIndex]
    const currentPath = path.join(".")
    return currentResult.path === currentPath
  }, [currentSearchIndex, searchResults, path])

  // Auto-scroll to current search result
  useEffect(() => {
    if (isCurrentSearchResult() && nodeRef.current && scrollContainerRef.current) {
      const nodeRect = nodeRef.current.getBoundingClientRect()
      const containerRect = scrollContainerRef.current.getBoundingClientRect()

      if (nodeRect.top < containerRect.top || nodeRect.bottom > containerRect.bottom) {
        nodeRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }
    }
  }, [currentSearchIndex, isCurrentSearchResult, scrollContainerRef])

  // Determine if this node or any of its children match the search term
  const matchesSearch = useCallback(
    (data: any, term: string): boolean => {
      if (!term) return false

      const termToSearch = caseSensitive ? term : term.toLowerCase()

      // Check if the current key matches
      const labelToSearch = caseSensitive ? label : label.toLowerCase()
      if (labelToSearch.includes(termToSearch)) return true

      // Check if the value matches (for primitive types)
      if (typeof data !== "object" || data === null) {
        const valueToSearch = caseSensitive ? String(data) : String(data).toLowerCase()
        return valueToSearch.includes(termToSearch)
      }

      // For objects and arrays, check all children
      return Object.entries(data).some(([key, value]) => {
        const keyToSearch = caseSensitive ? key : key.toLowerCase()
        if (keyToSearch.includes(termToSearch)) return true
        if (typeof value !== "object" || value === null) {
          const valueToSearch = caseSensitive ? String(value) : String(value).toLowerCase()
          return valueToSearch.includes(termToSearch)
        }
        return matchesSearch(value, term)
      })
    },
    [label, caseSensitive],
  )

  const hasMatch = useMemo(() => {
    return searchTerm ? matchesSearch(data, searchTerm) : false
  }, [searchTerm, data, matchesSearch])

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

  // Format the value for display
  const getFormattedValue = (value: any): string => {
    if (value === null) return "null"
    if (value === undefined) return "undefined"
    if (typeof value === "string") return `"${value}"`
    return String(value)
  }

  // Get the length of arrays or objects
  const getLength = (value: any): number => {
    if (Array.isArray(value)) return value.length
    if (typeof value === "object" && value !== null) return Object.keys(value).length
    return 0
  }

  const displayInfo = useMemo(
    () => ({
      type: getType(data),
      length: getLength(data),
      formattedValue: getFormattedValue(data),
      displayLabel: isRoot ? "" : label,
    }),
    [data, isRoot, label],
  )

  const { type, length, formattedValue, displayLabel } = displayInfo

  // Handle node click for expand/collapse
  const handleNodeClick = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLButtonElement || isEditing) {
      return
    }

    if (isExpandable) {
      setIsExpanded(!isExpanded)
    } else {
      startEditing()
    }
  }

  // Start editing a value
  const startEditing = () => {
    if (type !== "object" && type !== "array") {
      setIsEditing(true)
      setEditValue(type === "string" ? data : formattedValue)
    }
  }

  // Save edited value
  const saveEditedValue = () => {
    try {
      let parsedValue

      if (type === "string") {
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
      setIsEditing(false)
    }
  }

  // Highlight text that matches the search term
  const highlightText = (text: string, term: string) => {
    if (!term) return text

    const searchTerm = caseSensitive ? term : term.toLowerCase()
    const textToSearch = caseSensitive ? text : text.toLowerCase()

    if (!textToSearch.includes(searchTerm)) return text

    const parts = text.split(new RegExp(`(${term})`, caseSensitive ? "g" : "gi"))
    return parts.map((part, i) => {
      const partToCheck = caseSensitive ? part : part.toLowerCase()
      const isMatch = partToCheck === searchTerm
      const isCurrentMatch = isMatch && isCurrentSearchResult()

      return isMatch ? (
        <span
          key={i}
          className={cn(
            "px-0.5 rounded-sm",
            isCurrentMatch
              ? "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100"
              : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200",
          )}
        >
          {part}
        </span>
      ) : (
        part
      )
    })
  }

  // Get hierarchy color based on nesting level
  const getHierarchyColor = (level: number) => {
    const colors = [
      "border-stone-200 dark:border-stone-700",
      "border-emerald-200 dark:border-emerald-800",
      "border-sky-200 dark:border-sky-800",
      "border-violet-200 dark:border-violet-800",
      "border-rose-200 dark:border-rose-800",
    ]
    return colors[level % colors.length]
  }

  const level = path.length

  const isExpandable = type === "object" || type === "array"

  return (
    <div
      ref={nodeRef}
      className={cn(
        "min-h-[20px]",
        hasMatch && searchTerm ? "bg-emerald-50/30 dark:bg-emerald-900/10" : "",
        hasValidationError() ? "bg-red-50/30 dark:bg-red-900/10" : "",
      )}
    >
      <div
        className={cn(
          "flex items-start gap-1 cursor-pointer h-5 hover:bg-stone-100/50 dark:hover:bg-stone-800/30 transition-colors rounded-sm px-1",
          isEditing ? "pointer-events-none" : "",
          isCurrentSearchResult() ? "bg-amber-100/50 dark:bg-amber-900/20" : "",
          hasValidationError() ? "border-l-2 border-red-400 dark:border-red-600" : "",
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
              className={cn(
                "h-3 w-3 text-stone-400 transition-transform duration-200",
                isExpanded ? "rotate-90" : "",
                "hover:text-stone-600 dark:hover:text-stone-300",
              )}
            />
          </button>
        )}

        <div className="flex-1 flex items-center min-w-0 h-5">
          {displayLabel && (
            <>
              <span className="text-stone-600 dark:text-stone-300 font-medium">
                {highlightText(displayLabel, searchTerm)}
              </span>
              <span className="text-stone-400 dark:text-stone-500 mx-1">:</span>
            </>
          )}

          {isExpandable ? (
            <div className="flex items-center">
              <span className={cn("font-medium", type === "array" ? "text-sky-500" : "text-violet-500")}>
                {type === "array" ? "[" : "{"}
              </span>
              {!isExpanded && (
                <span className="text-stone-400 dark:text-stone-500 text-xs ml-1 bg-stone-100 dark:bg-stone-800 px-1 rounded">
                  {length} {type === "array" ? "items" : "keys"}
                </span>
              )}
              {!isExpanded && (
                <span className={cn("font-medium ml-1", type === "array" ? "text-sky-500" : "text-violet-500")}>
                  {type === "array" ? "]" : "}"}
                </span>
              )}
            </div>
          ) : isEditing ? (
            <div className="flex items-center flex-1">
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-5 py-0 px-1 text-xs bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 rounded w-full focus:outline-none focus:ring-1 focus:ring-emerald-300 dark:focus:ring-emerald-600"
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
              className={cn("truncate", getTypeColor(type))}
              onDoubleClick={(e) => {
                e.stopPropagation()
                startEditing()
              }}
            >
              {highlightText(formattedValue, searchTerm)}
            </span>
          )}
        </div>
      </div>

      {isExpanded && isExpandable && (
        <div className={cn("pl-4 border-l ml-2 transition-all duration-200", getHierarchyColor(level))}>
          {type === "array" ? (
            <>
              {data.map((item: any, index: number) => (
                <JsonTreeNode
                  key={index}
                  data={item}
                  label={String(index)}
                  searchTerm={searchTerm}
                  searchResults={searchResults}
                  currentSearchIndex={currentSearchIndex}
                  caseSensitive={caseSensitive}
                  expandAll={expandAll}
                  onCopy={onCopy}
                  path={[...path, index]}
                  updateValue={updateValue}
                  validationErrors={validationErrors}
                  scrollContainerRef={scrollContainerRef}
                />
              ))}
              <div className="h-5 flex items-center text-sky-500 font-medium">]</div>
            </>
          ) : (
            <>
              {Object.entries(data).map(([key, value]) => (
                <JsonTreeNode
                  key={key}
                  data={value}
                  label={key}
                  searchTerm={searchTerm}
                  searchResults={searchResults}
                  currentSearchIndex={currentSearchIndex}
                  caseSensitive={caseSensitive}
                  expandAll={expandAll}
                  onCopy={onCopy}
                  path={[...path, key]}
                  updateValue={updateValue}
                  validationErrors={validationErrors}
                  scrollContainerRef={scrollContainerRef}
                />
              ))}
              <div className="h-5 flex items-center text-violet-500 font-medium">{"}"}</div>
            </>
          )}
        </div>
      )}
    </div>
  )
})
