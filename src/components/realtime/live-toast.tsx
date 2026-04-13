/**
 * LiveToast Component
 * Displays real-time notifications using shadcn/ui Toast
 */

"use client"

import { useToast } from "@/hooks/use-toast"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import type {
  JobUpdatePayload,
  EventUpdatePayload,
  RecordUpdatePayload,
  FeedPostPayload,
  NotificationPayload,
} from "@/lib/ably/types"

interface LiveToastProps {
  // Job updates
  jobUpdate?: JobUpdatePayload
  // Event updates
  eventUpdate?: EventUpdatePayload
  // Record updates
  recordUpdate?: RecordUpdatePayload
  // Feed updates
  feedUpdate?: FeedPostPayload
  // Generic notifications
  notification?: NotificationPayload
}

export function useLiveToast() {
  const { toast } = useToast()
  const router = useRouter()

  const showJobToast = (payload: JobUpdatePayload) => {
    const messages: Record<string, { title: string; description: string }> = {
      posted: {
        title: "New Job Posted",
        description: `${payload.jobTitle} at ${payload.company}`,
      },
      updated: {
        title: "Job Updated",
        description: `${payload.jobTitle} has been updated`,
      },
      application: {
        title: "New Application",
        description: `You received a new application for ${payload.jobTitle}`,
      },
      status: {
        title: "Application Status Update",
        description: `Your application for ${payload.jobTitle} is now ${payload.status}`,
      },
    }

    const message = messages[payload.type] || messages.updated

    toast({
      title: message.title,
      description: message.description,
      onClick: () => {
        if (payload.jobId) {
          router.push(`/jobs/${payload.jobId}`)
        }
      },
    })
  }

  const showEventToast = (payload: EventUpdatePayload) => {
    if (payload.type === "rsvp") {
      const status = payload.data.status === "CONFIRMED" ? "confirmed" : "declined"
      toast({
        title: "Event RSVP Update",
        description: `${payload.userName || "Someone"} ${status} attendance`,
      })
    } else if (payload.type === "update") {
      toast({
        title: "Event Updated",
        description: payload.data.title || "An event has been updated",
        onClick: () => {
          if (payload.eventId) {
            router.push(`/events/${payload.eventId}`)
          }
        },
      })
    }
  }

  const showRecordToast = (payload: RecordUpdatePayload) => {
    if (payload.type === "verified") {
      toast({
        title: "Document Verified",
        description: "Your documents have been verified successfully!",
        variant: "default",
      })
    } else if (payload.type === "released") {
      toast({
        title: "Document Released",
        description: "Your documents are ready for pickup",
        variant: "default",
      })
    } else {
      toast({
        title: "Record Update",
        description: payload.message || "Your record has been updated",
      })
    }
  }

  const showFeedToast = (payload: FeedPostPayload) => {
    const messages: Record<string, { title: string; description: string }> = {
      post: {
        title: "New Post",
        description: payload.title || "A new post has been published",
      },
      announcement: {
        title: "New Announcement",
        description: payload.title || "A new announcement has been posted",
      },
      gallery: {
        title: "New Gallery",
        description: payload.title || "A new gallery has been added",
      },
    }

    const message = messages[payload.type] || messages.post

    toast({
      title: message.title,
      description: message.description,
      onClick: () => {
        if (payload.type === "gallery") {
          router.push("/gallery")
        } else {
          router.push("/news")
        }
      },
    })
  }

  const showNotificationToast = (payload: NotificationPayload) => {
    toast({
      title: payload.title,
      description: payload.message,
      onClick: () => {
        if (payload.link) {
          router.push(payload.link)
        }
      },
    })
  }

  return {
    showJobToast,
    showEventToast,
    showRecordToast,
    showFeedToast,
    showNotificationToast,
  }
}

/**
 * LiveToast Hook Component
 * Automatically displays toasts when real-time updates are received
 */
export function LiveToast({ jobUpdate, eventUpdate, recordUpdate, feedUpdate, notification }: LiveToastProps) {
  const { showJobToast, showEventToast, showRecordToast, showFeedToast, showNotificationToast } = useLiveToast()

  useEffect(() => {
    if (jobUpdate) {
      showJobToast(jobUpdate)
    }
  }, [jobUpdate, showJobToast])

  useEffect(() => {
    if (eventUpdate) {
      showEventToast(eventUpdate)
    }
  }, [eventUpdate, showEventToast])

  useEffect(() => {
    if (recordUpdate) {
      showRecordToast(recordUpdate)
    }
  }, [recordUpdate, showRecordToast])

  useEffect(() => {
    if (feedUpdate) {
      showFeedToast(feedUpdate)
    }
  }, [feedUpdate, showFeedToast])

  useEffect(() => {
    if (notification) {
      showNotificationToast(notification)
    }
  }, [notification, showNotificationToast])

  return null // This component doesn't render anything
}





