/**
 * LiveToast Component
 * Reusable toast notification for real-time event updates
 * Uses shadcn/ui toast component
 */

"use client"

import React, { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { 
  CheckCircle2, 
  Info, 
  AlertCircle, 
  Briefcase, 
  Calendar, 
  MessageSquare,
  FileText,
  Bell
} from "lucide-react"
import { useAblyChannel } from "@/lib/ably/useAblyChannel"
import { ABLY_CHANNELS, ABLY_EVENTS, NotificationPayload } from "@/lib/ably/types"
import { useSession } from "next-auth/react"

interface LiveToastProps {
  userId?: string | null
  enabled?: boolean
}

export function LiveToast({ userId, enabled = true }: LiveToastProps) {
  const { toast } = useToast()
  const { data: session } = useSession()
  const currentUserId = userId || session?.user?.id

  // Subscribe to notifications channel
  useAblyChannel(
    currentUserId ? ABLY_CHANNELS.NOTIFICATIONS(currentUserId) : "",
    ABLY_EVENTS.NOTIFICATION_NEW,
    (payload: NotificationPayload) => {
      if (!enabled || !currentUserId) return

      // Determine icon based on notification type
      const getIcon = () => {
        switch (payload.type) {
          case "chat":
            return <MessageSquare className="h-4 w-4" />
          case "job":
            return <Briefcase className="h-4 w-4" />
          case "event":
            return <Calendar className="h-4 w-4" />
          case "record":
            return <FileText className="h-4 w-4" />
          default:
            return <Bell className="h-4 w-4" />
        }
      }

      // Determine variant based on type
      const getVariant = (): "default" | "destructive" => {
        if (payload.type === "error" || payload.type === "warning") {
          return "destructive"
        }
        return "default"
      }

      toast({
        title: payload.title,
        description: payload.message,
        variant: getVariant(),
        // Add action button if link is provided
        action: payload.link ? (
          <a
            href={payload.link}
            className="text-sm font-medium underline"
            onClick={(e) => {
              e.preventDefault()
              window.location.href = payload.link!
            }}
          >
            View
          </a>
        ) : undefined,
      })
    },
    (error) => {
      console.error("Error in notification channel:", error)
    }
  )

  return null // This component doesn't render anything visible
}

/**
 * Hook to show toast for specific channel events
 */
export function useLiveToastForChannel(
  channelName: string,
  eventName: string,
  enabled: boolean = true
) {
  const { toast } = useToast()

  useAblyChannel(
    enabled ? channelName : "",
    eventName,
    (data: any) => {
      // Customize toast based on event type
      if (eventName.includes("job")) {
        toast({
          title: "New Job Update",
          description: data.jobTitle 
            ? `${data.jobTitle} at ${data.company}`
            : "A job has been updated",
          action: data.jobId ? (
            <a
              href={`/jobs/${data.jobId}`}
              className="text-sm font-medium underline"
            >
              View
            </a>
          ) : undefined,
        })
      } else if (eventName.includes("event")) {
        toast({
          title: "Event Update",
          description: data.eventName || "An event has been updated",
          action: data.eventId ? (
            <a
              href={`/events/${data.eventId}`}
              className="text-sm font-medium underline"
            >
              View
            </a>
          ) : undefined,
        })
      } else {
        toast({
          title: "Update",
          description: JSON.stringify(data),
        })
      }
    },
    (error) => {
      console.error(`Error in channel ${channelName}:`, error)
    }
  )
}

/**
 * Component to show typing indicator
 */
export function TypingIndicator({ conversationId }: { conversationId: string }) {
  const { data: session } = useSession()
  const [typingUsers, setTypingUsers] = React.useState<string[]>([])

  useAblyChannel(
    `ccit:chat:${conversationId}`,
    "typing",
    (data: { userId: string; userName: string | null; isTyping: boolean }) => {
      if (data.userId === session?.user?.id) return // Don't show own typing

      setTypingUsers((prev) => {
        if (data.isTyping) {
          return prev.includes(data.userId) ? prev : [...prev, data.userId]
        } else {
          return prev.filter((id) => id !== data.userId)
        }
      })
    }
  )

  if (typingUsers.length === 0) return null

  return (
    <div className="text-xs text-muted-foreground italic px-4 py-2">
      {typingUsers.length === 1
        ? "Someone is typing..."
        : `${typingUsers.length} people are typing...`}
    </div>
  )
}


