import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createVerificationSchema = z.object({
  reason: z.string().optional(),
  documents: z.array(z.string()).optional(),
})

// GET - Check current user's verification status
export async function GET(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get current verification request status
    const request = await prisma.verificationRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    // Get alumni profile verification status
    const profile = await prisma.alumniProfile.findUnique({
      where: { userId },
      select: { verified: true },
    })

    return NextResponse.json({
      isVerified: profile?.verified || false,
      request: request || null,
      canRequest: !request || request.status !== "PENDING",
    })
  } catch (error: any) {
    console.error("Error checking verification status:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Submit verification request
export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only alumni can request verification
    if (session.user.role !== "ALUMNI") {
      return NextResponse.json(
        { error: "Only alumni can request verification" },
        { status: 403 }
      )
    }

    const userId = session.user.id
    const body = await req.json()
    const validated = createVerificationSchema.parse(body)

    // Check if user already has a pending request
    const existingRequest = await prisma.verificationRequest.findFirst({
      where: {
        userId,
        status: "PENDING",
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: "You already have a pending verification request" },
        { status: 400 }
      )
    }

    // Check if user is already verified
    const profile = await prisma.alumniProfile.findUnique({
      where: { userId },
      select: { verified: true },
    })

    if (profile?.verified) {
      return NextResponse.json(
        { error: "You are already verified" },
        { status: 400 }
      )
    }

    // Create verification request
    const request = await prisma.verificationRequest.create({
      data: {
        userId,
        status: "PENDING",
        reason: validated.reason || null,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Verification request submitted successfully",
      request,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating verification request:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
