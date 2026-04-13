import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    const { id } = await params
    
    // Only admins can hire from recommendations
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can hire applicants." },
        { status: 401 }
      )
    }

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

    if (recommendation.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: "Can only hire from accepted recommendations" },
        { status: 400 }
      )
    }

    // Check if application already exists
    const existingApplication = await prisma.jobApplication.findUnique({
      where: {
        jobId_applicantId: {
          jobId: recommendation.jobId,
          applicantId: recommendation.alumniId,
        },
      },
    })

    if (existingApplication) {
      // Update existing application to HIRED status
      const updatedApplication = await prisma.jobApplication.update({
        where: { id: existingApplication.id },
        data: { status: "HIRED" },
        include: {
          applicant: {
            select: {
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

      // Update job applicants count
      const count = await prisma.jobApplication.count({
        where: { jobId: recommendation.jobId },
      })

      await prisma.job.update({
        where: { id: recommendation.jobId },
        data: { applicantsCount: count },
      })

      return NextResponse.json({
        success: true,
        application: updatedApplication,
        message: "Applicant status updated to HIRED",
      })
    }

    // Create new job application with HIRED status
    const application = await prisma.jobApplication.create({
      data: {
        jobId: recommendation.jobId,
        applicantId: recommendation.alumniId,
        status: "HIRED",
        coverLetter: recommendation.message || null,
      },
      include: {
        applicant: {
          select: {
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

    // Update job applicants count
    const count = await prisma.jobApplication.count({
      where: { jobId: recommendation.jobId },
    })

    await prisma.job.update({
      where: { id: recommendation.jobId },
      data: { applicantsCount: count },
    })

    return NextResponse.json({
      success: true,
      application,
      message: "Applicant hired and added to pipeline successfully",
    })
  } catch (error: any) {
    console.error("Error hiring applicant:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

