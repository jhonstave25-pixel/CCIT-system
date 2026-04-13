/**
 * Performance Instrumentation
 * Logs route changes, component render times, and web vitals in development
 */

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // Route change timing
  let routeChangeStartTime: number | null = null

  // Track route changes (Next.js App Router)
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState

  history.pushState = function (...args) {
    routeChangeStartTime = performance.now()
    const result = originalPushState.apply(this, args)
    setTimeout(() => {
      if (routeChangeStartTime) {
        const duration = performance.now() - routeChangeStartTime
        console.log(`[PERF] Route change: ${duration.toFixed(2)}ms`)
        routeChangeStartTime = null
      }
    }, 0)
    return result
  }

  history.replaceState = function (...args) {
    routeChangeStartTime = performance.now()
    const result = originalReplaceState.apply(this, args)
    setTimeout(() => {
      if (routeChangeStartTime) {
        const duration = performance.now() - routeChangeStartTime
        console.log(`[PERF] Route replace: ${duration.toFixed(2)}ms`)
        routeChangeStartTime = null
      }
    }, 0)
    return result
  }

  // Web Vitals (simplified)
  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "largest-contentful-paint") {
            const lcp = entry as PerformancePaintTiming
            console.log(`[PERF] LCP: ${lcp.renderTime?.toFixed(2)}ms`)
          }
          if (entry.entryType === "first-input") {
            const fid = entry as PerformanceEventTiming
            console.log(`[PERF] FID: ${fid.processingStart - fid.startTime}ms`)
          }
        }
      })
      observer.observe({ entryTypes: ["largest-contentful-paint", "first-input"] })
    } catch (e) {
      // PerformanceObserver not fully supported
    }
  }
}

/**
 * Measure component render time (dev only)
 */
export function measureRender(componentName: string) {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      if (duration > 16) {
        // Log if render takes longer than one frame (16ms)
        console.warn(`[PERF] ${componentName} render: ${duration.toFixed(2)}ms`)
      }
    }
  }
  return () => {}
}

