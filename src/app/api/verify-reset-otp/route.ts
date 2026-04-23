import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, otp, password } = await req.json()

    if (!email || !otp || !password) {
      return NextResponse.json(
        { error: "Email, OTP, and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or OTP" },
        { status: 400 }
      )
    }

    // Verify OTP
    const otpRecord = await prisma.otp.findFirst({
      where: {
        email,
        code: otp,
        type: "RESET_PASSWORD",
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP code" },
        { status: 400 }
      )
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    })

    // Mark OTP as used
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    })

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Verify reset OTP error:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}
