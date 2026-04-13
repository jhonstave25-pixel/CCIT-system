"use client"

import { useState, useTransition, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { verifyLoginOTP, verifyRegisterOTP, resendOTP } from "@/actions/auth.actions"
import { getDashboardUrl } from "@/lib/redirects"

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [resendCooldown, setResendCooldown] = useState(0)

  const email = searchParams.get("email") || ""
  const verifyType = searchParams.get("type") || "login" // "login" or "register"
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [focusedIndex, setFocusedIndex] = useState(0)

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return // Only allow single digit
    if (!/^\d*$/.test(value)) return // Only numbers

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      setFocusedIndex(index + 1)
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      setFocusedIndex(index - 1)
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6)
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split("")
      setOtp(newOtp)
      setFocusedIndex(5)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join("")

    if (otpCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please enter a complete 6-digit code",
      })
      return
    }

    startTransition(async () => {
      // Handle registration verification
      if (verifyType === "register") {
        const result = await verifyRegisterOTP(email, otpCode)

        if (result.success) {
          toast({
            title: "Verification Complete!",
            description: "Your email has been verified. You can now log in using your password.",
          })
          // Redirect to login page
          router.push("/login")
        } else {
          toast({
            variant: "destructive",
            title: "Invalid OTP",
            description: result.error || "The code you entered is invalid or expired.",
          })
          // Clear OTP on error
          setOtp(["", "", "", "", "", ""])
          setFocusedIndex(0)
        }
        return
      }

      // Handle login verification (admin only)
      const result = await verifyLoginOTP(email, otpCode)

      if (result.success) {
        // Sign in using NextAuth (no password for OTP-verified admin)
        const signInResult = await signIn("credentials", {
          email: result.email,
          password: "", // Empty for OTP-verified users (admin only)
          redirect: false,
        })

        if (signInResult?.ok && result.role) {
          toast({
            title: "Success!",
            description: "You have been successfully signed in.",
          })
          const redirectUrl = getDashboardUrl(result.role)
          router.push(redirectUrl)
          router.refresh()
        } else {
          toast({
            variant: "destructive",
            title: "Sign in failed",
            description: "Failed to create session. Please try again.",
          })
        }
      } else {
        toast({
          variant: "destructive",
          title: "Invalid OTP",
          description: result.error || "The code you entered is invalid or expired.",
        })
        // Clear OTP on error
        setOtp(["", "", "", "", "", ""])
        setFocusedIndex(0)
      }
    })
  }

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) {
      if (!email) {
        toast({
          variant: "destructive",
          title: "Email missing",
          description: "Please provide an email address.",
        })
      }
      return
    }

    startTransition(async () => {
      try {
        console.log(`[VerifyPage] Resending OTP for ${email}, type: ${verifyType}`)
        const result = await resendOTP(
          email,
          verifyType === "register" ? "REGISTER" : "LOGIN"
        )

        console.log(`[VerifyPage] Resend result:`, result)

        if (result.success) {
          toast({
            title: "OTP resent!",
            description: "A new code has been sent to your email.",
          })
          setResendCooldown(30)
          setOtp(["", "", "", "", "", ""])
          setFocusedIndex(0)
        } else {
          toast({
            variant: "destructive",
            title: "Failed to resend OTP",
            description: result.error || "Please check your email configuration and try again.",
          })
        }
      } catch (error: any) {
        console.error("[VerifyPage] Error in handleResend:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error?.message || "An unexpected error occurred. Please try again.",
        })
      }
    })
  }

  // Focus first input on mount
  useEffect(() => {
    const firstInput = document.getElementById("otp-0")
    firstInput?.focus()
  }, [])

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950 p-4">
        <Card className="w-full max-w-md rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardHeader>
            <CardTitle>Email Required</CardTitle>
            <CardDescription>Please go back and enter your email first.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 text-white hover:opacity-95 shadow-md">Back to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950 p-4">
      <Card className="w-full max-w-md rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-in slide-in-from-bottom-5 duration-500">
        <CardHeader className="space-y-1 pb-4">
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 -m-6 mb-4 p-6 rounded-t-2xl">
            <CardTitle className="text-2xl font-bold text-white text-center">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-white/95 text-center mt-2">
              {verifyType === "register" 
                ? "Enter the 6-digit code sent to verify your account"
                : "Enter the 6-digit code sent to"}
            </CardDescription>
            <CardDescription className="text-white font-semibold text-center">
              {email}
            </CardDescription>
            {verifyType === "register" && (
              <CardDescription className="text-white/90 text-xs text-center mt-2">
                This code is valid for 10 minutes and will only be required once.
              </CardDescription>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-center block">Verification Code</Label>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-semibold tracking-widest"
                    disabled={isPending}
                    autoFocus={index === focusedIndex}
                  />
                ))}
              </div>
              <p className="text-xs text-center text-muted-foreground">
                The code expires in 10 minutes
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 text-white hover:opacity-95 shadow-md hover:shadow-lg transition-all"
              disabled={isPending || otp.join("").length !== 6}
            >
              {isPending 
                ? "Verifying..." 
                : verifyType === "register" 
                  ? "Verify Email" 
                  : "Verify & Sign In"}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn&apos;t receive the code?
            </p>
            <Button
              variant="link"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isPending}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              {resendCooldown > 0
                ? `Resend code in ${resendCooldown}s`
                : "Resend OTP"}
            </Button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              ← Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
