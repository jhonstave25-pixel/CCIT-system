import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notifyAlumniOfRecommendation } from "@/lib/notifications"
import { NextResponse } from "next/server"
import { z } from "zod"

const createRecommendationSchema = z.object({
  alumniId: z.string(),
  jobId: z.string(),
  message: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    // Only faculty can create recommendations
    if (!session || session.user.role !== "FACULTY") {
      return NextResponse.json({ error: "Unauthorized. Only faculty can create recommendations." }, { status: 401 })
    }

    // Check if faculty is approved
    if (session.user.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Your faculty account must be approved to make recommendations." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validated = createRecommendationSchema.parse(body)

    // Verify the alumni exists and is actually an alumni
    const alumni = await prisma.user.findUnique({
      where: { id: validated.alumniId },
      include: {
        profile: true,
        alumniProfile: true,
      },
    })

    if (!alumni) {
      return NextResponse.json({ error: "Alumni not found" }, { status: 404 })
    }

    if (alumni.role !== "ALUMNI") {
      return NextResponse.json(
        { error: "Can only recommend alumni users" },
        { status: 400 }
      )
    }

    // Verify the job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: validated.jobId },
      include: {
        postedBy: {
          select: {
            name: true,
          },
        },
      },
    })

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (!job.isActive) {
      return NextResponse.json(
        { error: "This job is no longer accepting recommendations" },
        { status: 400 }
      )
    }

    // Check if recommendation already exists
    const existing = await prisma.recommendation.findUnique({
      where: {
        facultyId_alumniId_jobId: {
          facultyId: session.user.id,
          alumniId: validated.alumniId,
          jobId: validated.jobId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "You have already recommended this alumni for this job" },
        { status: 400 }
      )
    }

    // Create recommendation
    const recommendation = await prisma.recommendation.create({
      data: {
        facultyId: session.user.id,
        alumniId: validated.alumniId,
        jobId: validated.jobId,
        message: validated.message || null,
      },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        alumni: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        job: {
          select: {
            title: true,
            company: true,
          },
        },
      },
    })

    // Notify alumni about the recommendation
    try {
      await notifyAlumniOfRecommendation(
        validated.alumniId,
        recommendation.job.title,
        recommendation.faculty.name || "A faculty member",
        validated.jobId
      )
      console.log("[API] Recommendation notification sent to alumni")
    } catch (notifError) {
      // Don't fail recommendation creation if notification fails
      console.warn("Failed to send recommendation notification:", notifError)
    }

    return NextResponse.json({ success: true, recommendation })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating recommendation:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const alumniId = searchParams.get("alumniId")
    const jobId = searchParams.get("jobId")
    const facultyId = searchParams.get("facultyId")

    const where: any = {}

    // Filter by alumni if provided (for alumni viewing their recommendations)
    if (alumniId) {
      where.alumniId = alumniId
    }

    // Filter by job if provided
    if (jobId) {
      where.jobId = jobId
    }

    // Filter by faculty if provided
    if (facultyId) {
      where.facultyId = facultyId
    }

    // If user is alumni, only show their own recommendations
    if (session.user.role === "ALUMNI") {
      where.alumniId = session.user.id
    }

    // If user is faculty, only show their own recommendations
    if (session.user.role === "FACULTY") {
      where.facultyId = session.user.id
    }

    const recommendations = await prisma.recommendation.findMany({
      where,
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        alumni: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            jobType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ recommendations })
  } catch (error: any) {
    console.error("Error fetching recommendations:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

