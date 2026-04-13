/**
 * Central definition of event categories
 * This is the single source of truth for event categories used across:
 * - Create Event form
 * - Edit Event form
 * - Event filters
 * - Validation schemas
 */
export const EVENT_CATEGORIES = [
  "Reunion",
  "Seminar / Webinar",
  "Career Talk",
  "Workshop",
  "Community Outreach",
  "Alumni Gathering",
  "Orientation",
  "Other",
] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]

/**
 * Check if a category is valid
 */
export function isValidEventCategory(category: string): category is EventCategory {
  return EVENT_CATEGORIES.includes(category as EventCategory)
}

