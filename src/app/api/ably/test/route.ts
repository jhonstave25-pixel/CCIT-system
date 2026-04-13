/**
 * Test API route for Ably integration
 * Publishes a test message to the 'test' channel
 */

import { NextResponse } from "next/server"
import { publishToAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"

export async function POST() {
  try {
    // First verify the API key is set
    const apiKey = process.env.ABLY_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "ABLY_API_KEY is not set in environment variables",
          help: "Add ABLY_API_KEY to your .env.local file",
        },
        { status: 500 }
      )
    }

    const testMessage = {
      message: "Hello from CCIT-Connect via Ably!",
      timestamp: new Date().toISOString(),
      source: "server",
    }

    await publishToAblyChannel({
      channelName: "ccit:test",
      eventName: "test:message",
      data: testMessage,
    })

    return NextResponse.json({
      success: true,
      message: "Test message published to Ably",
      data: testMessage,
    })
  } catch (error: any) {
    console.error("Error publishing test message:", error)
    
    // Provide more helpful error messages
    let errorMessage = error.message || "Failed to publish test message"
    let helpText = ""
    
    if (error.code === 40101 || errorMessage.includes("key secret")) {
      errorMessage = "Invalid API key: The key secret does not match"
      helpText = "Please verify your ABLY_API_KEY in .env.local. Make sure you're using the Root key from Ably dashboard (not Subscribe only key). Visit /api/ably/verify to check your key."
    } else if (errorMessage.includes("ABLY_API_KEY")) {
      helpText = "Please check your .env.local file and restart the dev server."
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        errorCode: error.code,
        help: helpText || undefined,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Ably test endpoint. Use POST to publish a test message.",
    usage: "POST /api/ably/test",
  })
}


