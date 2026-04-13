import { prisma } from "./prisma"
import { sendOTPEmail } from "./email"

// OTP expires in 10 minutes
const OTP_EXPIRY_MINUTES = 10

/**
 * Generate a 6-digit OTP code
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Send OTP to user's email
 */
export async function sendOTP(
  email: string,
  type: "LOGIN" | "REGISTER" | "RESET_PASSWORD"
): Promise<{ success: boolean; error?: string }> {
  try {
    // Invalidate any existing unused OTPs for this email and type
    // Wrap in try-catch in case OTP table doesn't exist yet
    try {
      await prisma.otp.updateMany({
        where: {
          email,
          type,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          used: true,
        },
      })
    } catch (updateError: any) {
      // If table doesn't exist, that's okay - we'll create it in migration
      if (updateError?.code !== "P2021" && !updateError?.message?.includes("does not exist")) {
        throw updateError
      }
    }

    // Generate new OTP
    const code = generateOTP()
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    // Save OTP to database
    try {
      await prisma.otp.create({
        data: {
          email,
          code,
          type,
          expiresAt,
        },
      })
    } catch (createError: any) {
      // If OTP table doesn't exist, guide user to run migrations
      if (createError?.code === "P2021" || createError?.message?.includes("does not exist")) {
        return {
          success: false,
          error: "Database table not found. Please run: npx prisma migrate dev --name add_otp_and_faculty"
        }
      }
      throw createError
    }

    // Send OTP via email
    try {
      console.log(`[sendOTP] Attempting to send OTP email to ${email}, code: ${code}, type: ${type}`)
      await sendOTPEmail(email, code, type)
      console.log(`[sendOTP] OTP email sent successfully to ${email}`)
    } catch (emailError: any) {
      console.error("[sendOTP] Error sending OTP email:", emailError)
      console.error("[sendOTP] Error details:", {
        message: emailError?.message,
        code: emailError?.code,
        stack: emailError?.stack
      })
      // Delete the OTP from database if email failed
      try {
        await prisma.otp.deleteMany({
          where: { email, code, type },
        })
      } catch (deleteError) {
        console.error("[sendOTP] Error deleting OTP after email failure:", deleteError)
      }
      return { 
        success: false, 
        error: emailError?.message || "Failed to send OTP email. Please check your email configuration." 
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error sending OTP:", error)
    return { 
      success: false, 
      error: error?.message || "Failed to send OTP. Please check your email configuration in .env file." 
    }
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(
  email: string,
  code: string,
  type: "LOGIN" | "REGISTER" | "RESET_PASSWORD"
): Promise<{ success: boolean; error?: string }> {
  try {
    const otp = await prisma.otp.findFirst({
      where: {
        email,
        code,
        type,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (!otp) {
      return { success: false, error: "Invalid or expired OTP" }
    }

    // Mark OTP as used
    await prisma.otp.update({
      where: { id: otp.id },
      data: { used: true },
    })

    return { success: true }
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return { success: false, error: "Failed to verify OTP" }
  }
}

/**
 * Clean up expired OTPs (run as a cron job or cleanup task)
 */
export async function cleanupExpiredOTPs() {
  try {
    await prisma.otp.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    })
  } catch (error) {
    console.error("Error cleaning up expired OTPs:", error)
  }
}

