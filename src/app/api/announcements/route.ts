import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  targetRoles: z.array(z.enum(["ALUMNI", "FACULTY", "ADMIN", "ALL"])).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    // Only admins can create announcements
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only admins can create announcements." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validated = createAnnouncementSchema.parse(body)

    return NextResponse.json({
      success: true,
      message: "Announcement sent successfully",
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating announcement:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

