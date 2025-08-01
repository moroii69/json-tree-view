export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="w-8 h-8 border-2 border-stone-200 dark:border-stone-700 rounded-full"></div>
        <div className="absolute top-0 left-0 w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="text-stone-500 dark:text-stone-400 text-xs">Parsing JSON...</div>
    </div>
  )
}
