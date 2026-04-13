import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const jobId = params.id

    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        applicant: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const applicants = applications.map((app) => ({
      id: app.id,
      name: app.applicant.name,
      email: app.applicant.email,
      status: app.status,
      resumeUrl: app.resumeUrl,
      coverLetter: app.coverLetter,
      createdAt: app.createdAt,
    }))

    return NextResponse.json({ applicants })
  } catch (error: any) {
    console.error("Error fetching applicants:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch applicants" },
      { status: 500 }
    )
  }
}


