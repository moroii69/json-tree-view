import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getTypeColor = (type: string): string => {
  switch (type) {
    case "string":
      return "text-emerald-500"
    case "number":
      return "text-sky-500"
    case "boolean":
      return "text-violet-500"
    case "null":
      return "text-stone-500"
    case "array":
      return "text-sky-500"
    case "object":
      return "text-violet-500"
    default:
      return "text-stone-500"
  }
}
