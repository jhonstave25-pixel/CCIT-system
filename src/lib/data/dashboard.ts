// lib/data/dashboard.ts (server-side safe, replace with real DB calls)
import type {
  DashboardUser,
  EngagementSeries,
  JobsByCategory,
  ConnectionSplit,
} from "@/lib/types/dashboard"

export async function getDashboardData() {
  const user = {
    fullName: "Junrio Lomongo",
    initials: "JL",
    lastActiveISO: new Date().toISOString(),
    profileCompletion: 62,
    department: "BSIT",
  } satisfies DashboardUser

  const eventsSeries: EngagementSeries[] = [
    { month: "Jan", eventsJoined: 1 },
    { month: "Feb", eventsJoined: 0 },
    { month: "Mar", eventsJoined: 2 },
    { month: "Apr", eventsJoined: 1 },
    { month: "May", eventsJoined: 3 },
    { month: "Jun", eventsJoined: 0 },
  ]

  const jobsByCategory: JobsByCategory = [
    { category: "IT", count: 4 },
    { category: "Business", count: 1 },
    { category: "Design", count: 2 },
  ]

  const connectionSplit: ConnectionSplit = [
    { label: "Peers", value: 7 },
    { label: "Faculty", value: 2 },
    { label: "Employer", value: 1 },
  ]

  const weeklyDigest = { jobs: 3, connectionRequests: 1, events: 1 }

  const recommended = {
    jobs: [
      { id: "j1", title: "Front-end Intern (React)", org: "Zambo Tech Hub" },
      { id: "j2", title: "IT Support Associate", org: "JRMSU" },
    ],
    events: [
      { id: "e1", title: "Alumni Meetup — CCIT", date: "Fri 6PM" },
    ],
  }

  const announcements = [
    { id: "a1", title: "Career Fair next week", by: "CCIT Dean", time: "2h" },
    { id: "a2", title: "Alumni Spotlight: Top 10 grads in IT", by: "Registrar", time: "1d" },
  ]

  const notifications = [
    { id: "n1", text: "1 new connection request", time: "Just now" },
    { id: "n2", text: "Event reminder: Alumni Meetup — tomorrow", time: "3h" },
  ]

  const stats = {
    jobsAvailable: 3,
    eventsJoined: 0,
    connections: 0,
    jobsApplied: 0,
  }

  return {
    user,
    eventsSeries,
    jobsByCategory,
    connectionSplit,
    weeklyDigest,
    recommended,
    announcements,
    notifications,
    stats,
  }
}


