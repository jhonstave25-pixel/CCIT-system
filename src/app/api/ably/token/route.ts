/**
 * Ably Token Generation Endpoint
 * Generates short-lived tokens for client authentication
 * This is more secure than exposing API keys to the client
 */

import { auth } from "@/lib/auth"
import Ably from "ably"

export const runtime = "nodejs"

export async function GET() {
  try {
    // Verify user is authenticated
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const apiKey = process.env.ABLY_API_KEY

    if (!apiKey) {
      console.error("ABLY_API_KEY is not set in environment variables")
      return Response.json(
        { error: "Ably not configured - ABLY_API_KEY missing" },
        { status: 503 }
      )
    }

    // Validate key format (should be "appId.key" format)
    if (!apiKey.includes(':') || apiKey.length < 10) {
      console.error("ABLY_API_KEY format appears invalid. Expected format: APP_ID:API_KEY")
      return Response.json(
        { error: "Invalid Ably API key format" },
        { status: 500 }
      )
    }

    // Create Ably REST client to generate tokens
    const rest = new Ably.Rest({ key: apiKey })

    // Determine user role and set capabilities accordingly
    const userRole = session.user.role
    const isStaff = userRole === "ADMIN" || userRole === "FACULTY"
    const isAlumni = userRole === "ALUMNI"

    // Grant all authenticated users full access to all ccit channels
    // Using explicit patterns to ensure proper capability matching
    const capability = {
      "ccit:*": ["subscribe", "publish", "presence"],
      "ccit:chat:*": ["subscribe", "publish", "presence"],
      "ccit:notifications:*": ["subscribe", "publish", "presence"],
      "[request:*]*": ["subscribe", "publish", "presence"],
      "*": ["subscribe", "publish", "presence"],
    }

    const tokenRequest = await rest.auth.createTokenRequest({
      clientId: session.user.id,
      capability: capability as any,
      ttl: 3600000,
    })

    return Response.json(tokenRequest)
  } catch (error: any) {
    console.error("Error generating Ably token:", error)
    return Response.json(
      { error: error.message || "Failed to generate token" },
      { status: 500 }
    )
  }
}

// Also support POST for compatibility
export async function POST() {
  return GET()
}

