import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateRecommendationSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    // Only admins can update recommendation status
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can update recommendations." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = updateRecommendationSchema.parse(body)

    // Find the recommendation
    const recommendation = await prisma.recommendation.findUnique({
      where: { id },
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
          },
        },
      },
    })

    if (!recommendation) {
      return NextResponse.json({ error: "Recommendation not found" }, { status: 404 })
    }

    // Update recommendation status
    const updated = await prisma.recommendation.update({
      where: { id },
      data: { status: validated.status },
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
          },
        },
      },
    })

    // If accepted, optionally create a job application for the alumni
    if (validated.status === "ACCEPTED") {
      // Check if application already exists
      const existingApplication = await prisma.jobApplication.findUnique({
        where: {
          jobId_applicantId: {
            jobId: recommendation.jobId,
            applicantId: recommendation.alumniId,
          },
        },
      })

      // Don't create duplicate application, but we could mark as shortlisted if needed
      // For now, we'll just leave it as a recommendation
    }

    return NextResponse.json({ success: true, recommendation: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating recommendation:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

