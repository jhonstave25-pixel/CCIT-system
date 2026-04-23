import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { token, otp, password } = await req.json()

    if (!token || !otp || !password) {
      return NextResponse.json(
        { error: "Token, OTP, and password are required" },
        { status: 400 }
      )
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    // Verify OTP code
    const otpRecord = await prisma.otp.findFirst({
      where: {
        email: user.email!,
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

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
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
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}
