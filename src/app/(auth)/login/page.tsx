"use client"

import { useState, useTransition } from "react"
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
import { Eye, EyeOff } from "lucide-react"

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-[400px] animate-in slide-in-from-bottom-5 duration-500 border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
          Welcome Back
        </h1>
        <p className="text-sm text-slate-600 text-center mb-6">
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
              className="w-full p-3 rounded-lg bg-slate-900 text-white placeholder-slate-400 border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
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
              className="w-full p-3 rounded-lg bg-slate-900 text-white placeholder-slate-400 border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 pr-12 h-12"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowPassword(!showPassword)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
            />
            <Label
              htmlFor="remember"
              className="text-sm font-normal cursor-pointer text-slate-700"
            >
              Remember me
            </Label>
          </div>
          <Button
            type="submit"
            className="w-full py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition focus-visible:ring-2 focus-visible:ring-indigo-300"
            disabled={isPending}
          >
            {isPending ? "Signing in..." : "Sign In"}
          </Button>
          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-slate-600 hover:text-slate-900 hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </form>

        <Separator className="my-6 bg-slate-200" />

        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            href="/request-account"
            className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline transition-colors"
          >
            Join now
          </Link>
        </p>
      </div>
    </div>
  )
}
