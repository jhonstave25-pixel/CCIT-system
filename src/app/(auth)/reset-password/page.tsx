"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      toast({
        title: "Error",
        description: "Invalid reset token",
        variant: "destructive",
      })
      return
    }

    if (!otp || otp.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter the 6-digit OTP code from your email",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (password.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, otp, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setIsSuccess(true)
      toast({
        title: "Success",
        description: "Password reset successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 p-4">
        <Card className="w-full max-w-md bg-white/10 dark:bg-indigo-950/30 backdrop-blur-lg border-white/20 dark:border-indigo-800/30 text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Invalid Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-indigo-200 mb-4">
              The password reset link is invalid or has expired.
            </p>
            <Link href="/forgot-password" className="text-indigo-300 hover:text-white underline">
              Request a new link
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 p-4">
        <Card className="w-full max-w-md bg-white/10 dark:bg-indigo-950/30 backdrop-blur-lg border-white/20 dark:border-indigo-800/30 text-white">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Password Reset</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-indigo-200 mb-4">
              Your password has been reset successfully.
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 p-4">
      <Card className="w-full max-w-md bg-white/10 dark:bg-indigo-950/30 backdrop-blur-lg border-white/20 dark:border-indigo-800/30 text-white">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center text-indigo-200">
            Enter the OTP code from your email and your new password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-white">OTP Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength={6}
                className="bg-white/20 border-white/20 text-white placeholder:text-white/50 text-center tracking-widest text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="bg-white/20 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-white/20 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
            <p className="text-center text-sm text-indigo-200">
              Remember your password?{" "}
              <Link href="/login" className="text-indigo-300 hover:text-white underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}