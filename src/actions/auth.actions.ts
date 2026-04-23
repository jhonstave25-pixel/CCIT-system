"use server"

import { prisma } from "@/lib/prisma"
import { sendOTP, verifyOTP } from "@/lib/otp"
import { checkRateLimit, trackFailedLogin, clearFailedAttempts, isAccountLocked } from "@/lib/rate-limit"
import bcrypt from "bcryptjs"

export async function loginWithPassword(email: string, password: string) {
  try {
    // Check rate limit by IP (use email as identifier for simplicity)
    const rateLimit = await checkRateLimit(`login:${email.toLowerCase()}`, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
    })

    if (!rateLimit.allowed) {
      const minutesLeft = Math.ceil((rateLimit.resetTime - Date.now()) / 60000)
      return { 
        success: false, 
        error: `Too many login attempts. Please try again in ${minutesLeft} minutes.` 
      }
    }

    // Check if account is locked due to failed attempts
    const lockStatus = await isAccountLocked(email)
    if (lockStatus.locked && lockStatus.lockedUntil) {
      const minutesLeft = Math.ceil((lockStatus.lockedUntil - Date.now()) / 60000)
      return { 
        success: false, 
        error: `Account temporarily locked due to too many failed attempts. Please try again in ${minutesLeft} minutes.` 
      }
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      // Track failed attempt
      await trackFailedLogin(email)
      return { success: false, error: "Invalid email or password" }
    }

    // ADMIN and SUPER_ADMIN - temporarily allow password login for testing
    // TODO: Re-enable OTP-only login for admins after testing
    // if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    //   return { 
    //     success: false, 
    //     error: "Administrators must use OTP login. Please switch to the Admin tab." 
    //   }
    // }

    // Check if user has a password set
    if (!user.password) {
      return { 
        success: false, 
        error: "Password not set. Please reset your password or contact support." 
      }
    }

    // Email verification check temporarily disabled for testing
    // TODO: Re-enable email verification check after testing
    // if (!user.emailVerified) {
    //   // Send OTP for verification
    //   const otpResult = await sendOTP(email.toLowerCase(), "REGISTER")
    //   if (otpResult.success) {
    //     return { 
    //       success: false, 
    //       error: "EMAIL_NOT_VERIFIED",
    //       requiresVerification: true,
    //     }
    //   }
    //   return {
    //     success: false,
    //     error: "Email not verified. Please verify your email first.",
    //   }
    // }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      // Track failed attempt
      const lockStatus = await trackFailedLogin(email)
      if (lockStatus.locked) {
        const minutesLeft = Math.ceil((lockStatus.lockedUntil! - Date.now()) / 60000)
        return { 
          success: false, 
          error: `Account temporarily locked due to too many failed attempts. Please try again in ${minutesLeft} minutes.` 
        }
      }
      return { success: false, error: "Invalid email or password" }
    }

    // Clear failed attempts on successful login
    await clearFailedAttempts(email)

    // Check if ALUMNI is unverified - block login but allow pending-approval access
    if (user.role === "ALUMNI" && user.userStatus === "UNVERIFIED") {
      return { 
        success: false, 
        error: "UNVERIFIED_ACCOUNT",
        role: user.role,
        userStatus: user.userStatus,
        requiresApproval: true
      }
    }

    // Check if FACULTY is pending - block login but allow pending-approval access
    if (user.role === "FACULTY" && user.status === "PENDING") {
      return { 
        success: false, 
        error: "PENDING_APPROVAL",
        role: user.role,
        status: user.status,
        requiresApproval: true
      }
    }

    // Mark email as verified if not already (backward compatibility)
    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      })
    }

    return {
      success: true,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status
    }
  } catch (error) {
    console.error("Error logging in with password:", error)
    return { success: false, error: "Failed to login" }
  }
}

export async function sendLoginOTP(email: string) {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return { success: false, error: "User not found. Please register first." }
    }

    // Only ADMIN can use OTP login
    if (user.role !== "ADMIN") {
      return { 
        success: false, 
        error: "OTP login is only available for administrators. Please use password login." 
      }
    }

    // Send OTP
    const result = await sendOTP(email.toLowerCase(), "LOGIN")
    return result
  } catch (error) {
    console.error("Error sending login OTP:", error)
    return { success: false, error: "Failed to send OTP" }
  }
}

export async function sendRegisterOTP(
  email: string, 
  name: string, 
  role: "ALUMNI" | "FACULTY" = "ALUMNI",
  password?: string
) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return { success: false, error: "User already exists. Please login instead." }
    }

    // Send OTP
    const result = await sendOTP(email.toLowerCase(), "REGISTER")
    
    if (result.success && password) {
      // Store registration data temporarily in a way that can be retrieved later
      // We'll use a simple approach: store in a temporary table or session
      // For now, we'll pass it through the verify step
    }
    
    return result
  } catch (error) {
    console.error("Error sending registration OTP:", error)
    return { success: false, error: "Failed to send OTP" }
  }
}

export async function verifyLoginOTP(email: string, code: string) {
  try {
    // Verify OTP
    const otpResult = await verifyOTP(email.toLowerCase(), code, "LOGIN")
    
    if (!otpResult.success) {
      return { success: false, error: otpResult.error || "Invalid OTP" }
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Only ADMIN can use OTP login
    if (user.role !== "ADMIN") {
      return { 
        success: false, 
        error: "OTP login is only available for administrators." 
      }
    }

    // Mark email as verified if not already
    if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      })
    }

    // Create session using NextAuth
    // Note: This requires client-side signIn call
    return { 
      success: true, 
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  } catch (error) {
    console.error("Error verifying login OTP:", error)
    return { success: false, error: "Failed to verify OTP" }
  }
}

export async function verifyRegisterOTP(email: string, code: string) {
  try {
    // Verify OTP
    const otpResult = await verifyOTP(email.toLowerCase(), code, "REGISTER")
    
    if (!otpResult.success) {
      return { success: false, error: otpResult.error || "Invalid OTP" }
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        emailVerified: new Date(),
      },
    })

    return { 
      success: true, 
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  } catch (error) {
    console.error("Error verifying registration OTP:", error)
    return { success: false, error: "Failed to verify OTP" }
  }
}

/**
 * Resend OTP for registration or login
 * This is a server action that can be called from client components
 */
export async function resendOTP(
  email: string,
  type: "REGISTER" | "LOGIN"
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[resendOTP] Attempting to resend OTP for ${email}, type: ${type}`)
    
    if (!email || !email.trim()) {
      return { 
        success: false, 
        error: "Email is required" 
      }
    }

    if (type === "LOGIN") {
      // For login, use the existing sendLoginOTP function
      console.log(`[resendOTP] Calling sendLoginOTP for ${email}`)
      const result = await sendLoginOTP(email)
      console.log(`[resendOTP] sendLoginOTP result:`, result)
      return result
    } else {
      // For registration, just send OTP (user might already exist but not verified)
      console.log(`[resendOTP] Calling sendOTP for ${email}, type: REGISTER`)
      const result = await sendOTP(email.toLowerCase(), "REGISTER")
      console.log(`[resendOTP] sendOTP result:`, result)
      return result
    }
  } catch (error: any) {
    console.error("[resendOTP] Error resending OTP:", error)
    console.error("[resendOTP] Error stack:", error?.stack)
    return { 
      success: false, 
      error: error?.message || "Failed to resend OTP. Please check your email configuration." 
    }
  }
}
