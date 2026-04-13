"use client"

import { useState, useTransition, useRef, useCallback } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { loginWithPassword } from "@/actions/auth.actions"
import { getDashboardUrl } from "@/lib/redirects"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  // Login form state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseDown = useCallback(() => {
    longPressTimerRef.current = setTimeout(() => {
      setShowPassword(true)
    }, 200)
  }, [])

  const handleMouseUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    setShowPassword(false)
  }, [])

  const handleTouchStart = useCallback(() => {
    longPressTimerRef.current = setTimeout(() => {
      setShowPassword(true)
    }, 200)
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    setShowPassword(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await loginWithPassword(email, password)

      if (result.success) {
        // Check if faculty account is pending approval
        if (result.role === "FACULTY" && result.status === "PENDING") {
          toast({
            variant: "default",
            title: "Account Pending Approval",
            description: "Your account is still awaiting admin approval. You will be redirected to the waiting page.",
          })
          // Still sign them in so they can see the pending page
          await signIn("credentials", {
            email: result.email,
            password: password,
            redirect: false,
          })
          router.push("/pending-approval")
          router.refresh()
          return
        }

        const signInResult = await signIn("credentials", {
          email: result.email,
          password: password,
          redirect: false,
        })

        // Only redirect if signIn was successful and we have a valid role
        if (signInResult?.ok && result.role) {
          toast({
            title: "Welcome back!",
            description: "You have been successfully signed in.",
          })
          const redirectUrl = getDashboardUrl(result.role)
          router.push(redirectUrl)
          router.refresh()
        } else {
          toast({
            variant: "destructive",
            title: "Sign in failed",
            description: signInResult?.error || "Failed to create session. Please try again.",
          })
        }
      } else {
        // Check if account requires approval/verification
        if (result.error === "UNVERIFIED_ACCOUNT" || result.error === "PENDING_APPROVAL" || result.requiresApproval) {
          toast({
            variant: "default",
            title: "Waiting for Faculty/Admin Verification",
            description: "Your account has been created and is awaiting verification. Please wait for verification before logging in.",
          })
          // Do NOT create session - user must wait for approval
          return
        }
        
        // Check if email needs verification
        if (result.error === "EMAIL_NOT_VERIFIED" || result.requiresVerification) {
          toast({
            title: "Email Verification Required",
            description: "Please verify your email first. A verification code has been sent.",
          })
          router.push(`/verify?email=${encodeURIComponent(email)}&type=register`)
        } else {
          toast({
            variant: "destructive",
            title: "Sign in failed",
            description: result.error || "Invalid credentials",
          })
        }
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-4">
      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-[400px] animate-in slide-in-from-bottom-5 duration-500">
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Welcome Back
        </h1>
        <p className="text-sm text-white/80 text-center mb-6">
          Sign in to your account
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
              className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70 border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
            />
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isPending}
              className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70 border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 pr-12 h-12"
            />
            <button
              type="button"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="absolute right-3 top-0 bottom-0 flex items-center text-white/70 hover:text-white transition-colors select-none"
              aria-label="Long press to show password"
            >
              <Eye className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-white/30 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
            />
            <Label
              htmlFor="remember"
              className="text-sm font-normal cursor-pointer text-white/90"
            >
              Remember me
            </Label>
          </div>
          <Button
            type="submit"
            className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium hover:opacity-90 transition focus-visible:ring-2 focus-visible:ring-indigo-300"
            disabled={isPending}
          >
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-white/80 hover:text-white hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </form>

        <Separator className="my-6 bg-white/20" />

        <p className="text-center text-sm text-white/80">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-indigo-300 hover:text-indigo-200 font-medium hover:underline transition-colors"
          >
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
