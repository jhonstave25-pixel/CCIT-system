import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateStatusSchema = z.object({
  userId: z.string(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    const allowedRoles = ["ADMIN"]
    
    if (!session || !session.user.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validated = updateStatusSchema.parse(body)

    // Verify the user is a faculty member
    const user = await prisma.user.findUnique({
      where: { id: validated.userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.role !== "FACULTY") {
      return NextResponse.json(
        { error: "Can only update status for faculty members" },
        { status: 400 }
      )
    }

    // Update the user's status
    const updatedUser = await prisma.user.update({
      where: { id: validated.userId },
      data: { status: validated.status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating faculty status:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

