"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Clock } from "lucide-react"
import { useRealtimeSubscriptions } from "@/hooks/use-realtime-subscriptions"

export default function PendingApprovalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Listen for real-time approval notifications
  useRealtimeSubscriptions({
    onFacultyApproved: (data) => {
      // The hook already handles the redirect, but we can add additional logic here if needed
      console.log("Faculty approved:", data)
    },
  })

  useEffect(() => {
    // If user is authenticated and verified/approved, redirect to home page
    if (status === "authenticated") {
      if (session?.user.role === "FACULTY" && session?.user.status === "APPROVED") {
        router.push("/")
      } else if (session?.user.role === "ALUMNI" && session?.user.userStatus === "VERIFIED") {
        router.push("/")
      } else if (session?.user.role === "ADMIN") {
        router.push("/admin")
      }
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [session, status, router])

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-4">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Don't render if user is verified/approved (will redirect)
  if (
    (session?.user.role === "FACULTY" && session?.user.status === "APPROVED") ||
    (session?.user.role === "ALUMNI" && session?.user.userStatus === "VERIFIED") ||
    session?.user.role === "ADMIN"
  ) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Clock className="w-8 h-8 text-yellow-300" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Waiting for Faculty/Admin Verification
          </CardTitle>
          <CardDescription className="text-white/80 text-base">
            {session?.user.role === "ALUMNI"
              ? "Your alumni account is pending Registrar verification."
              : "Your faculty account is currently under review."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-white/90 text-sm leading-relaxed">
              {session?.user.role === "ALUMNI"
                ? "Please wait for Registrar verification before accessing restricted areas. You will be notified once your account has been verified."
                : "Please wait for the admin's approval before accessing the dashboard. You will be notified once your account has been reviewed."}
            </p>
          </div>
          
          <div className="pt-4">
            <Button
              asChild
              className="w-full py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-medium hover:opacity-90 transition focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              <Link href="/login">
                Back to Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

