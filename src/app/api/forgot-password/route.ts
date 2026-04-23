import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Don't reveal if user exists or not for security
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, a reset email has been sent" },
        { status: 200 }
      )
    }

    // Generate OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Save OTP to database
    await prisma.otp.create({
      data: {
        email: user.email!,
        code: otpCode,
        type: "RESET_PASSWORD",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        used: false,
      },
    })

    // Send email with OTP only
    await sendPasswordResetEmail(user.email!, otpCode)

    return NextResponse.json(
      { message: "If an account exists, a reset email has been sent" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
