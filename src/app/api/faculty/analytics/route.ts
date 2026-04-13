import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const session = await auth()
    const allowedRoles = ["FACULTY", "ADMIN"]
    
    if (!session || !session.user.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id!

    // Get KPIs
    let pendingVerifications = 0
    try {
      pendingVerifications = await prisma.verificationRequest.count({
        where: { status: "PENDING" },
      })
    } catch (error: any) {
      console.warn("Error fetching verification requests:", error?.message || error)
      pendingVerifications = 0
    }

    // Get KPIs with error handling for each query
    let totalAlumni = 0
    let verifiedAlumni = 0
    let upcomingEvents = 0
    let connectionsCount = 0
    let unreadMessages = 0

    try {
      [totalAlumni, verifiedAlumni, upcomingEvents, connectionsCount, unreadMessages] = await Promise.all([
        prisma.user.count({ where: { role: "ALUMNI" } }),
        prisma.alumniProfile.count({ where: { verified: true } }),
        prisma.event.count({
          where: {
            eventDate: { gte: new Date() },
            status: { in: ["UPCOMING", "ONGOING"] },
          },
        }),
        prisma.connection.count({
          where: {
            OR: [{ requesterId: userId }, { receiverId: userId }],
            status: "ACCEPTED",
          },
        }),
        prisma.chatMessage.count({
          where: {
            conversation: {
              participants: {
                some: { userId },
              },
            },
            NOT: { seenBy: { has: userId } },
            NOT: { senderId: userId },
          },
        }),
      ])
    } catch (error: any) {
      console.warn("Error fetching KPIs:", error?.message || error)
      // Continue with default values
    }

    // Get active users by month (last 6 months) - based on user registrations
    let monthlyData: { month: string; active: number }[] = []
    try {
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const usersByMonth = await prisma.user.findMany({
        where: {
          role: "ALUMNI",
          createdAt: { gte: sixMonthsAgo },
        },
        select: {
          createdAt: true,
        },
      })

      // Group by month
      const monthlyMap = new Map<string, number>()
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      
      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = monthNames[date.getMonth()]
        monthlyMap.set(monthKey, 0)
      }

      // Count users per month
      usersByMonth.forEach((user) => {
        const month = monthNames[new Date(user.createdAt).getMonth()]
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1)
      })

      // Convert to array format for chart
      monthlyData = Array.from(monthlyMap.entries())
        .map(([month, active]) => ({ month, active }))
        .sort((a, b) => {
          const aIndex = monthNames.indexOf(a.month)
          const bIndex = monthNames.indexOf(b.month)
          return aIndex - bIndex
        })
    } catch (error: any) {
      console.warn("Error fetching monthly data:", error?.message || error)
      monthlyData = []
    }

    // Get employment sectors from real profile data
    let employmentSectors: { name: string; value: number }[] = []
    try {
      const profilesWithIndustry = await prisma.profile.findMany({
        where: {
          user: { role: "ALUMNI" },
          industry: { not: null },
        },
        select: {
          industry: true,
        },
      })

      // Group by industry
      const industryMap = new Map<string, number>()
      profilesWithIndustry.forEach((profile) => {
        const industry = profile.industry || "Other"
        industryMap.set(industry, (industryMap.get(industry) || 0) + 1)
      })

      // Convert to array and sort by count
      employmentSectors = Array.from(industryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10) // Top 10 industries

      // If no industries found, show empty state
      if (employmentSectors.length === 0) {
        employmentSectors.push({ name: "No data available", value: 0 })
      }
    } catch (error: any) {
      console.warn("Error fetching employment sectors:", error?.message || error)
      employmentSectors = [{ name: "No data available", value: 0 }]
    }

    // Get batch distribution from real profile data
    let batchDistribution: { batch: string; count: number }[] = []
    try {
      const profiles = await prisma.profile.findMany({
        where: {
          user: { role: "ALUMNI" },
          batch: { not: null },
        },
        select: {
          batch: true,
        },
        orderBy: {
          batch: "asc",
        },
      })

      // Group by batch
      const batchMap = new Map<string, number>()
      profiles.forEach((profile) => {
        const batch = profile.batch || "Unknown"
        batchMap.set(batch, (batchMap.get(batch) || 0) + 1)
      })

      // Convert to array and sort by batch year
      batchDistribution = Array.from(batchMap.entries())
        .map(([batch, count]) => ({ batch, count }))
        .sort((a, b) => {
          // Sort by batch year (numeric)
          const aYear = parseInt(a.batch) || 0
          const bYear = parseInt(b.batch) || 0
          return aYear - bYear
        })
    } catch (error: any) {
      console.warn("Error fetching batch distribution:", error?.message || error)
      batchDistribution = []
    }

    // Get job-related statistics
    let totalJobs = 0
    let activeJobs = 0
    let totalJobApplications = 0
    try {
      [totalJobs, activeJobs, totalJobApplications] = await Promise.all([
        prisma.job.count(),
        prisma.job.count({
          where: {
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        }),
        prisma.jobApplication.count(),
      ])
    } catch (error: any) {
      console.warn("Error fetching job statistics:", error?.message || error)
    }

    // Get event-related statistics
    let totalEvents = 0
    let upcomingEventsCount = 0
    let totalEventRegistrations = 0
    try {
      [totalEvents, upcomingEventsCount, totalEventRegistrations] = await Promise.all([
        prisma.event.count(),
        prisma.event.count({
          where: {
            eventDate: { gte: new Date() },
            status: { in: ["UPCOMING", "ONGOING"] },
          },
        }),
        prisma.eventRegistration.count(),
      ])
    } catch (error: any) {
      console.warn("Error fetching event statistics:", error?.message || error)
    }

    return NextResponse.json({
      totalAlumni,
      verifiedAlumni,
      upcomingEvents,
      connectionsCount,
      pendingVerifications,
      unreadMessages,
      activeUsersByMonth: monthlyData.length > 0 ? monthlyData : [],
      employmentSectors: employmentSectors.length > 0 ? employmentSectors : [],
      batchDistribution: batchDistribution.length > 0 ? batchDistribution : [],
      // Additional statistics
      totalJobs,
      activeJobs,
      totalJobApplications,
      totalEvents,
      upcomingEventsCount,
      totalEventRegistrations,
    })
  } catch (error: any) {
    console.error("Error in analytics route:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

