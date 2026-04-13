/**
 * Animation Configuration
 * Centralized animation settings with reduced motion support
 */

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Get animation duration based on user preference
 */
export function getAnimationDuration(baseDuration: number = 150): number {
  return prefersReducedMotion() ? 0 : baseDuration
}

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  fast: 100,
  normal: 150,
  slow: 200,
  // Disable for reduced motion
  get fast() { return getAnimationDuration(100) },
  get normal() { return getAnimationDuration(150) },
  get slow() { return getAnimationDuration(200) },
} as const

/**
 * CSS transition classes (targeted, not transition-all)
 */
export const TRANSITIONS = {
  opacity: "transition-opacity",
  transform: "transition-transform",
  colors: "transition-colors",
  opacityAndTransform: "transition-opacity transition-transform",
} as const

/**
 * Duration classes
 */
export const DURATION = {
  fast: "duration-100",
  normal: "duration-150",
  slow: "duration-200",
} as const

/**
 * Framer Motion config with reduced motion support
 */
export const motionConfig = {
  default: {
    duration: prefersReducedMotion() ? 0 : 0.15,
    ease: "easeOut" as const,
  },
  fast: {
    duration: prefersReducedMotion() ? 0 : 0.1,
    ease: "easeOut" as const,
  },
  // Disable layout animations for performance
  layout: false,
} as const

