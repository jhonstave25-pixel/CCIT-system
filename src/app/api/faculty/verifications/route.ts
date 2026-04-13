import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { publishToAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"
import type { RecordUpdatePayload } from "@/lib/ably/types"
import { z } from "zod"

const updateVerificationSchema = z.object({
  requestId: z.string().optional(),
  userId: z.string(),
  status: z.enum(["APPROVED", "REJECTED"]),
  reason: z.string().optional(),
})

export async function GET(req: Request) {
  try {
    const session = await auth()
    const allowedRoles = ["FACULTY", "ADMIN"]
    
    if (!session || !session.user.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requests = await prisma.verificationRequest.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return NextResponse.json({ requests })
  } catch (error: any) {
    console.error("Error in verifications GET route:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    const allowedRoles = ["FACULTY", "ADMIN"]
    
    if (!session || !session.user.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validated = updateVerificationSchema.parse(body)

    // Find existing request or create new one
    let verificationRequest = await prisma.verificationRequest.findFirst({
      where: {
        userId: validated.userId,
        status: "PENDING",
      },
    })

    if (verificationRequest && validated.requestId) {
      // Update existing request
      verificationRequest = await prisma.verificationRequest.update({
        where: { id: validated.requestId },
        data: {
          status: validated.status,
          reason: validated.reason || null,
          decidedBy: session.user.id!,
          decidedAt: new Date(),
        },
      })
    } else {
      // Create new request
      verificationRequest = await prisma.verificationRequest.create({
        data: {
          userId: validated.userId,
          status: validated.status,
          reason: validated.reason || null,
          decidedBy: session.user.id!,
          decidedAt: new Date(),
        },
      })
    }

    // Update alumni profile verification status (create if doesn't exist)
    await prisma.alumniProfile.upsert({
      where: { userId: validated.userId },
      update: {
        verified: validated.status === "APPROVED",
      },
      create: {
        userId: validated.userId,
        verified: validated.status === "APPROVED",
      },
    })

    // Publish real-time verification update via Ably
    try {
      const payload: RecordUpdatePayload = {
        userId: validated.userId,
        type: validated.status === "APPROVED" ? "verified" : "update",
        recordType: "verification",
        status: validated.status,
        message: validated.reason || undefined,
        timestamp: new Date().toISOString(),
      }
      await publishToAblyChannel({
        channelName: ABLY_CHANNELS.RECORDS(validated.userId),
        eventName: validated.status === "APPROVED" ? ABLY_EVENTS.RECORD_VERIFIED : ABLY_EVENTS.RECORD_UPDATE,
        data: payload,
      })
    } catch (ablyError) {
      console.warn("Failed to publish verification update to Ably:", ablyError)
    }

    return NextResponse.json({ success: true, verificationRequest })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error in verifications POST route:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

