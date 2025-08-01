export interface ParseMetrics {
  parseTime: number
  fileSize: number
  characterCount: number
  nodeCount: number
  maxDepth: number
  memoryUsage: number
  typeDistribution: Record<string, number>
}

export async function parseJsonWithMetrics(jsonString: string): Promise<{ data: any; metrics: ParseMetrics }> {
  const startTime = performance.now()
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0

  // Simulate minimum loading time for showcase
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const data = JSON.parse(jsonString)
  const endTime = performance.now()
  const endMemory = (performance as any).memory?.usedJSHeapSize || 0

  const metrics: ParseMetrics = {
    parseTime: Math.round(endTime - startTime),
    fileSize: Math.round(new Blob([jsonString]).size / 1024),
    characterCount: jsonString.length,
    nodeCount: countNodes(data),
    maxDepth: getMaxDepth(data),
    memoryUsage: Math.round((endMemory - startMemory) / 1024 / 1024),
    typeDistribution: getTypeDistribution(data),
  }

  // Save metrics to localStorage for stats page
  localStorage.setItem("jsonParseMetrics", JSON.stringify(metrics))

  return { data, metrics }
}

function countNodes(data: any): number {
  let count = 0
  const stack = [data]

  while (stack.length > 0) {
    const current = stack.pop()
    count++

    if (typeof current === "object" && current !== null) {
      if (Array.isArray(current)) {
        stack.push(...current)
      } else {
        stack.push(...Object.values(current))
      }
    }
  }

  return count
}

function getMaxDepth(data: any): number {
  let maxDepth = 0
  const stack = [{ data, depth: 0 }]

  while (stack.length > 0) {
    const { data: current, depth } = stack.pop()!
    maxDepth = Math.max(maxDepth, depth)

    if (typeof current === "object" && current !== null) {
      if (Array.isArray(current)) {
        current.forEach((item) => stack.push({ data: item, depth: depth + 1 }))
      } else {
        Object.values(current).forEach((value) => stack.push({ data: value, depth: depth + 1 }))
      }
    }
  }

  return maxDepth
}

function getTypeDistribution(data: any): Record<string, number> {
  const distribution: Record<string, number> = {}
  const stack = [data]

  while (stack.length > 0) {
    const current = stack.pop()
    const type = current === null ? "null" : Array.isArray(current) ? "array" : typeof current

    distribution[type] = (distribution[type] || 0) + 1

    if (typeof current === "object" && current !== null) {
      if (Array.isArray(current)) {
        stack.push(...current)
      } else {
        stack.push(...Object.values(current))
      }
    }
  }

  return distribution
}
