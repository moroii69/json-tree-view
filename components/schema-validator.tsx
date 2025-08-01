"use client"
import { useState } from "react"
import { ChevronRight, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { validateJsonSchema, type ValidationError } from "@/lib/schema-validator"

interface SchemaValidatorProps {
  jsonSchema: string
  setJsonSchema: (schema: string) => void
  validationErrors: ValidationError[]
  setValidationErrors: (errors: ValidationError[]) => void
  jsonData: any
}

export function SchemaValidator({
  jsonSchema,
  setJsonSchema,
  validationErrors,
  setValidationErrors,
  jsonData,
}: SchemaValidatorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSchemaChange = (value: string) => {
    setJsonSchema(value)
    if (value.trim() && jsonData) {
      try {
        const errors = validateJsonSchema(jsonData, value)
        setValidationErrors(errors)
      } catch (error) {
        setValidationErrors([
          {
            path: "schema",
            message: "Invalid schema format",
            value: value,
          },
        ])
      }
    } else {
      setValidationErrors([])
    }
  }

  return (
    <div className="border-b border-stone-200 dark:border-stone-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <ChevronRight className={cn("h-3 w-3 transition-transform", isExpanded ? "rotate-90" : "")} />
          <span>Schema Validation</span>
          {validationErrors.length > 0 && (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3 w-3" />
              <span>{validationErrors.length} errors</span>
            </div>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-2">
          <textarea
            placeholder="Paste JSON Schema here..."
            value={jsonSchema}
            onChange={(e) => handleSchemaChange(e.target.value)}
            className="w-full h-20 p-2 border border-stone-200 dark:border-stone-700 rounded bg-white dark:bg-stone-800 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-300 dark:focus:ring-emerald-600 resize-none transition-colors font-mono"
          />

          {validationErrors.length > 0 && (
            <div className="mt-2 space-y-1">
              {validationErrors.slice(0, 5).map((error, index) => (
                <div
                  key={index}
                  className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded"
                >
                  <div className="font-medium">{error.path || "root"}</div>
                  <div>{error.message}</div>
                </div>
              ))}
              {validationErrors.length > 5 && (
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  ... and {validationErrors.length - 5} more errors
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
