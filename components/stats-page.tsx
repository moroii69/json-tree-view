"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Clock, FileText, Layers, Hash, Home } from "lucide-react"
import Link from "next/link"
import type { ParseMetrics } from "@/lib/json-parser"

export function StatsPage() {
  const [metrics, setMetrics] = useState<ParseMetrics | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    // Get theme from localStorage or system preference
    const savedTheme = localStorage.getItem("theme")
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && systemDark)

    setIsDarkMode(shouldBeDark)
    if (shouldBeDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    // Get metrics from localStorage
    const savedMetrics = localStorage.getItem("jsonParseMetrics")
    if (savedMetrics) {
      setMetrics(JSON.parse(savedMetrics))
    }
  }, [])

  if (!metrics) {
    return (
      <div className="flex flex-col h-screen bg-stone-50 dark:bg-stone-900 font-mono text-sm">
        <header className="flex items-center px-4 h-10 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
              title="Home"
            >
              <Home className="h-4 w-4" />
            </Link>
            <Link
              href="/viewer"
              className="flex items-center gap-2 text-stone-600 dark:text-stone-300 hover:text-stone-800 dark:hover:text-stone-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Viewer</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-stone-500 dark:text-stone-400 text-xs">
            <p>No data parsed yet</p>
          </div>
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

  return (
    <div className="flex flex-col h-screen bg-stone-50 dark:bg-stone-900 font-mono text-sm">
      <header className="flex items-center px-4 h-10 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
            title="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
          <Link
            href="/viewer"
            className="flex items-center gap-2 text-stone-600 dark:text-stone-300 hover:text-stone-800 dark:hover:text-stone-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Viewer</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-base font-medium text-stone-800 dark:text-stone-200 mb-2">Statistics</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {metrics.nodeCount.toLocaleString()} nodes • {metrics.maxDepth} levels deep
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center space-y-1">
              <Clock className="h-4 w-4 text-emerald-500 mx-auto" />
              <div className="text-lg font-medium text-stone-800 dark:text-stone-200">{metrics.parseTime}ms</div>
              <div className="text-xs text-stone-500 dark:text-stone-400">Parse Time</div>
            </div>

            <div className="text-center space-y-1">
              <FileText className="h-4 w-4 text-sky-500 mx-auto" />
              <div className="text-lg font-medium text-stone-800 dark:text-stone-200">{metrics.fileSize}KB</div>
              <div className="text-xs text-stone-500 dark:text-stone-400">File Size</div>
            </div>

            <div className="text-center space-y-1">
              <Layers className="h-4 w-4 text-violet-500 mx-auto" />
              <div className="text-lg font-medium text-stone-800 dark:text-stone-200">{metrics.maxDepth}</div>
              <div className="text-xs text-stone-500 dark:text-stone-400">Max Depth</div>
            </div>

            <div className="text-center space-y-1">
              <Hash className="h-4 w-4 text-rose-500 mx-auto" />
              <div className="text-lg font-medium text-stone-800 dark:text-stone-200">{metrics.memoryUsage}MB</div>
              <div className="text-xs text-stone-500 dark:text-stone-400">Memory</div>
            </div>
          </div>

          <div className="border-t border-stone-200 dark:border-stone-700 pt-6">
            <h2 className="text-xs font-medium text-stone-600 dark:text-stone-400 mb-3 text-center">Data Types</h2>
            <div className="space-y-2">
              {Object.entries(metrics.typeDistribution)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 4)
                .map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center text-xs">
                    <span className="text-stone-500 dark:text-stone-400 capitalize">{type}</span>
                    <span className="text-stone-700 dark:text-stone-300">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
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
