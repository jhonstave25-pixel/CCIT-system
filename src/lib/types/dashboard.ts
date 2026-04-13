export type DashboardUser = {
  fullName: string
  initials: string
  lastActiveISO: string // ISO string
  profileCompletion: number // 0-100
  department?: string
}

export type JobCategory = "IT" | "Design" | "Business" | "Education" | "Other"

export type EngagementSeries = {
  month: string // e.g., "Jan"
  eventsJoined: number
}

export type JobsByCategory = { category: JobCategory; count: number }[]
export type ConnectionSplit = { label: string; value: number }[] // Peers/Faculty/Employer


