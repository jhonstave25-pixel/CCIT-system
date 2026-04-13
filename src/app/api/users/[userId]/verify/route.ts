import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { publishToAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"
import type { RecordUpdatePayload } from "@/lib/ably/types"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params

    // Check authorization - ADMIN and FACULTY can verify users
    const allowedRoles = ["ADMIN", "FACULTY"]
    if (!session || !session.user.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = resolvedParams.userId

    // Find the user to verify
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if already verified
    if (user.userStatus === "VERIFIED") {
      return NextResponse.json({ error: "User is already verified" }, { status: 400 })
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        userStatus: "VERIFIED",
        verifiedAt: new Date(),
        verifiedById: session.user.id,
      },
      include: {
        verifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Publish real-time verification update via Ably
    try {
      const payload: RecordUpdatePayload = {
        userId: updatedUser.id,
        type: "verified",
        recordType: "user",
        status: "VERIFIED",
        timestamp: new Date().toISOString(),
      }
      await publishToAblyChannel({
        channelName: ABLY_CHANNELS.RECORDS(updatedUser.id),
        eventName: ABLY_EVENTS.RECORD_VERIFIED,
        data: payload,
      })

      // Also publish to a general user updates channel for admin/faculty dashboards
      await publishToAblyChannel({
        channelName: ABLY_CHANNELS.USERS_UPDATE,
        eventName: ABLY_EVENTS.USER_VERIFIED,
        data: {
          userId: updatedUser.id,
          userStatus: "VERIFIED",
          verifiedAt: updatedUser.verifiedAt?.toISOString(),
          verifiedBy: {
            id: session.user.id,
            name: session.user.name,
          },
          timestamp: new Date().toISOString(),
        },
      })
    } catch (ablyError) {
      console.warn("Failed to publish verification update to Ably:", ablyError)
      // Don't fail the request if Ably fails
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        userStatus: updatedUser.userStatus,
        verifiedAt: updatedUser.verifiedAt,
        verifiedBy: updatedUser.verifiedBy,
      },
    })
  } catch (error: any) {
    console.error("Error in verify user route:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

