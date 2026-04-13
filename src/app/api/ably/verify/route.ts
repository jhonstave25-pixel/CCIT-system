/**
 * Ably API Key Verification Endpoint
 * Use this to verify your ABLY_API_KEY is correct
 */

import Ably from "ably"

export const runtime = "nodejs"

export async function GET() {
  try {
    const apiKey = process.env.ABLY_API_KEY

    if (!apiKey) {
      return Response.json(
        { 
          error: "ABLY_API_KEY is not set",
          help: "Add ABLY_API_KEY to your .env.local file"
        },
        { status: 400 }
      )
    }

    // Check key format
    const keyParts = apiKey.split(":")
    if (keyParts.length !== 2) {
      return Response.json(
        { 
          error: "Invalid API key format",
          format: "Expected format: keyName.keyId:keySecret",
          received: `Key has ${keyParts.length} parts (should be 2)`,
          keyLength: apiKey.length,
          keyPreview: `${apiKey.substring(0, 20)}...`
        },
        { status: 400 }
      )
    }

    const [keyNameAndId, keySecret] = keyParts
    const nameParts = keyNameAndId.split(".")
    
    if (nameParts.length !== 2) {
      return Response.json(
        { 
          error: "Invalid API key format",
          format: "Expected format: keyName.keyId:keySecret",
          received: `Key name has ${nameParts.length} parts (should be 2)`
        },
        { status: 400 }
      )
    }

    // Try to create REST client
    try {
      const rest = new Ably.Rest({ key: apiKey })
      
      // Try a simple operation to verify the key
      // This will fail if the key is invalid
      await rest.time()
      
      return Response.json({
        success: true,
        message: "API key is valid!",
        keyInfo: {
          keyName: nameParts[0],
          keyId: nameParts[1],
          keySecretLength: keySecret.length,
          totalLength: apiKey.length
        }
      })
    } catch (ablyError: any) {
      return Response.json(
        { 
          error: "API key validation failed",
          ablyError: ablyError.message || "Unknown error",
          errorCode: ablyError.code,
          help: "Please verify your API key in the Ably dashboard: https://ably.com/dashboard",
          commonIssues: [
            "Key may have been revoked",
            "Key may have extra spaces or characters",
            "Key may be from a different app",
            "Key format may be incorrect"
          ]
        },
        { status: 401 }
      )
    }
  } catch (error: any) {
    return Response.json(
      { 
        error: "Verification failed",
        message: error.message || "Unknown error"
      },
      { status: 500 }
    )
  }
}





