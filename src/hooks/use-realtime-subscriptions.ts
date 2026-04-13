/**
 * useRealtimeSubscriptions Hook
 * Handles real-time subscriptions for various system events
 */

"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"
import type { NotificationPayload } from "@/lib/ably/types"

interface UseRealtimeSubscriptionsOptions {
  onFacultyApproved?: (data: any) => void
  onNotification?: (notification: NotificationPayload) => void
  enabled?: boolean
}

export function useRealtimeSubscriptions({
  onFacultyApproved,
  onNotification,
  enabled = true,
}: UseRealtimeSubscriptionsOptions = {}) {
  const { data: session } = useSession()
  const router = useRouter()

  // Subscribe to user notifications
  useAblyChannel(
    enabled && session?.user?.id ? ABLY_CHANNELS.NOTIFICATIONS(session.user.id) : "",
    ABLY_EVENTS.NOTIFICATION_NEW,
    (payload: NotificationPayload) => {
      // Handle faculty approval notification
      if (payload.type === "faculty_approved" || payload.title.toLowerCase().includes("approved")) {
        // Check if user is faculty and was pending
        if (session?.user?.role === "FACULTY" && session?.user?.status === "PENDING") {
          // Redirect to faculty dashboard
          router.push("/dashboard/faculty")
          
          // Call custom callback if provided
          if (onFacultyApproved) {
            onFacultyApproved(payload)
          }
        }
      }

      // Call general notification callback
      if (onNotification) {
        onNotification(payload)
      }
    }
  )

  // Also poll for status changes as a fallback
  useEffect(() => {
    if (!enabled || !session?.user?.id) return

    // Poll every 10 seconds to check for status changes
    // This is a fallback in case Ably notifications are delayed
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/session")
        const data = await res.json()
        
        // Check if status changed from PENDING to APPROVED
        if (
          session?.user?.role === "FACULTY" &&
          session?.user?.status === "PENDING" &&
          data?.user?.status === "APPROVED"
        ) {
          router.push("/dashboard/faculty")
          
          if (onFacultyApproved) {
            onFacultyApproved({ status: "APPROVED", userId: session.user.id })
          }
        }
      } catch (error) {
        console.error("Error checking session status:", error)
      }
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(interval)
  }, [enabled, session, router, onFacultyApproved])
}





