/**
 * Ably Publish Endpoint
 * Simple endpoint for testing or admin actions to publish messages
 * In production, prefer publishing directly from server actions/API routes
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { publishToAblyChannel } from "@/lib/ably"
import { PublishOptions } from "@/lib/ably/types"

export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated (optional - can be removed for public endpoints)
    const session = await auth()
    
    // For admin-only publishing, uncomment:
    // if (!session?.user || session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const body = await req.json()
    const { channelName, eventName, data } = body as PublishOptions

    if (!channelName || !eventName || !data) {
      return NextResponse.json(
        { error: "Missing required fields: channelName, eventName, data" },
        { status: 400 }
      )
    }

    // Validate channel name starts with ccit: prefix
    if (!channelName.startsWith("ccit:")) {
      return NextResponse.json(
        { error: "Channel name must start with 'ccit:' prefix" },
        { status: 400 }
      )
    }

    await publishToAblyChannel({
      channelName,
      eventName,
      data,
    })

    return NextResponse.json({
      success: true,
      message: "Message published successfully",
      channel: channelName,
      event: eventName,
    })
  } catch (error: any) {
    console.error("Error publishing message:", error)
    return NextResponse.json(
      { error: error.message || "Failed to publish message" },
      { status: 500 }
    )
  }
}





