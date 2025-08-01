"use client"

import { useState, useEffect } from "react"
import { ArrowRight, Sun, Moon, Search, Edit3, FileCheck, Zap } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && systemDark)
    setIsDarkMode(shouldBeDark)

    if (shouldBeDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)

    if (newMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  return (
    <div className="flex flex-col h-screen bg-stone-50 dark:bg-stone-900 font-mono text-sm overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-end px-4 h-10 border-b border-stone-200 dark:border-stone-800">
        <button
          onClick={toggleDarkMode}
          className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded transition-colors"
          title="Toggle theme"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-12 max-w-lg">
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-lg font-medium text-stone-800 dark:text-stone-200">JSON Tree Viewer</h1>
              <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed max-w-md mx-auto">
                A minimal tool for visualizing, editing, and validating JSON data with syntax highlighting and advanced
                search capabilities.
              </p>
            </div>

            <Link
              href="/viewer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded text-sm transition-colors"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <Search className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-stone-600 dark:text-stone-400">Advanced Search</div>
              <div className="text-stone-500 dark:text-stone-500 text-xs">Find keys and values instantly</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <Edit3 className="h-4 w-4 text-sky-500" />
              </div>
              <div className="text-stone-600 dark:text-stone-400">Inline Editing</div>
              <div className="text-stone-500 dark:text-stone-500 text-xs">Edit values directly in tree</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <FileCheck className="h-4 w-4 text-violet-500" />
              </div>
              <div className="text-stone-600 dark:text-stone-400">Schema Validation</div>
              <div className="text-stone-500 dark:text-stone-500 text-xs">Validate against JSON schemas</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <Zap className="h-4 w-4 text-rose-500" />
              </div>
              <div className="text-stone-600 dark:text-stone-400">Performance</div>
              <div className="text-stone-500 dark:text-stone-500 text-xs">Fast parsing and rendering</div>
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
