import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q") || ""
    const status = searchParams.get("status") || undefined
    const type = searchParams.get("type") || undefined
    const featured = searchParams.get("featured") === "true" ? true : undefined
    const remote = searchParams.get("remote") === "true" ? true : undefined
    const sort = searchParams.get("sort") || "date"
    const page = Number(searchParams.get("page")) || 1
    const limit = Number(searchParams.get("limit")) || 10
    const archived = searchParams.get("archived") === "true" ? true : false

    const where: any = {
      archived,
      ...(query && {
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { company: { contains: query, mode: "insensitive" as const } },
          { location: { contains: query, mode: "insensitive" as const } },
        ],
      }),
      ...(status && { status }),
      ...(type && { jobType: type }),
      ...(featured !== undefined && { featured }),
      ...(remote !== undefined && { isRemote: remote }),
    }

    const orderBy: any =
      sort === "applicants"
        ? { applicantsCount: "desc" }
        : sort === "views"
        ? { views: "desc" }
        : { createdAt: "desc" }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          postedBy: {
            select: {
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              applications: true,
              recommendations: true,
            },
          },
          applications: {
            select: {
              status: true,
            },
          },
          recommendations: {
            select: {
              id: true,
              status: true,
              faculty: {
                select: {
                  name: true,
                  email: true,
                },
              },
              createdAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      }),
      prisma.job.count({ where }),
    ])

    // Update applicantsCount if it's out of sync and calculate hired/rejected counts
    const jobsWithStats = await Promise.all(
      jobs.map(async (job) => {
        // Update applicantsCount if out of sync
        if (job.applicantsCount !== job._count.applications) {
          await prisma.job.update({
            where: { id: job.id },
            data: { applicantsCount: job._count.applications },
          })
        }

        // Calculate hired and rejected counts
        const hiredCount = job.applications.filter((app) => app.status === "HIRED").length
        const rejectedCount = job.applications.filter((app) => app.status === "REJECTED").length

        const { _count, applications, recommendations, ...jobData } = job
        const pendingRecommendations = recommendations.filter((r) => r.status === "PENDING").length
        return {
          ...jobData,
          hiredCount,
          rejectedCount,
          recommendationsCount: _count.recommendations,
          pendingRecommendationsCount: pendingRecommendations,
          recommendations: recommendations.map((r) => ({
            id: r.id,
            status: r.status,
            facultyName: r.faculty.name,
            facultyEmail: r.faculty.email,
            createdAt: r.createdAt,
          })),
        }
      })
    )

    return NextResponse.json({
      jobs: jobsWithStats,
      total,
      page,
      pages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch jobs" }, { status: 500 })
  }
}


