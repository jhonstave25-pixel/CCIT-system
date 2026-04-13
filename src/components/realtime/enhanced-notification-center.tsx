/**
 * Enhanced Notification Center
 * Aggregates all real-time events from Ably channels
 */

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { Bell, Filter, Check, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"
import { useLiveToast } from "./live-toast"
import type {
  JobUpdatePayload,
  EventUpdatePayload,
  RecordUpdatePayload,
  FeedPostPayload,
  NotificationPayload,
} from "@/lib/ably/types"

type NotificationType = "all" | "unread" | "jobs" | "events" | "records" | "feed"

interface UnifiedNotification {
  id: string
  type: "job" | "event" | "record" | "feed" | "notification"
  title: string
  message: string
  link?: string
  timestamp: Date
  isRead: boolean
  source: string
  payload: any
}

export function EnhancedNotificationCenter() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { showJobToast, showEventToast, showRecordToast, showFeedToast } = useLiveToast()
  const [notifications, setNotifications] = useState<UnifiedNotification[]>([])
  const [filter, setFilter] = useState<NotificationType>("all")
  const [open, setOpen] = useState(false)

  // Fetch initial notifications from API
  const fetchNotifications = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) return
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      if (data.notifications) {
        const apiNotifications: UnifiedNotification[] = data.notifications.map((n: any) => ({
          id: n.id,
          type: "notification",
          title: n.title,
          message: n.message,
          link: n.link,
          timestamp: new Date(n.createdAt || n.timestamp),
          isRead: n.isRead || false,
          source: "api",
          payload: n,
        }))
        setNotifications((prev) => {
          // Merge with existing, avoiding duplicates
          const existingIds = new Set(prev.map((n) => n.id))
          const newOnes = apiNotifications.filter((n) => !existingIds.has(n.id))
          return [...prev, ...newOnes].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        })
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }, [session?.user?.id, status])

  // Handle job updates
  const handleJobUpdate = useCallback(
    (payload: JobUpdatePayload) => {
      const notification: UnifiedNotification = {
        id: `job-${payload.id}-${Date.now()}`,
        type: "job",
        title: payload.type === "posted" ? "New Job Posted" : payload.type === "status" ? "Application Update" : "Job Updated",
        message:
          payload.type === "posted"
            ? `${payload.jobTitle} at ${payload.company}`
            : payload.type === "status"
            ? `Your application for ${payload.jobTitle} is now ${payload.status}`
            : `${payload.jobTitle} has been updated`,
        link: payload.jobId ? `/jobs/${payload.jobId}` : undefined,
        timestamp: new Date(payload.timestamp),
        isRead: false,
        source: "ably",
        payload,
      }

      setNotifications((prev) => [notification, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()))
      showJobToast(payload)
    },
    [showJobToast]
  )

  // Handle event updates
  const handleEventUpdate = useCallback(
    (payload: EventUpdatePayload) => {
      const notification: UnifiedNotification = {
        id: `event-${payload.eventId}-${Date.now()}`,
        type: "event",
        title: payload.type === "rsvp" ? "Event RSVP Update" : "Event Updated",
        message:
          payload.type === "rsvp"
            ? `${payload.userName || "Someone"} ${payload.data.status === "CONFIRMED" ? "confirmed" : "declined"} attendance`
            : payload.data.title || "An event has been updated",
        link: `/events/${payload.eventId}`,
        timestamp: new Date(payload.timestamp),
        isRead: false,
        source: "ably",
        payload,
      }

      setNotifications((prev) => [notification, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()))
      showEventToast(payload)
    },
    [showEventToast]
  )

  // Handle record updates
  const handleRecordUpdate = useCallback(
    (payload: RecordUpdatePayload) => {
      const notification: UnifiedNotification = {
        id: `record-${payload.userId}-${Date.now()}`,
        type: "record",
        title: payload.type === "verified" ? "Document Verified" : "Record Update",
        message: payload.message || (payload.type === "verified" ? "Your documents have been verified!" : "Your record has been updated"),
        link: "/profile",
        timestamp: new Date(payload.timestamp),
        isRead: false,
        source: "ably",
        payload,
      }

      setNotifications((prev) => [notification, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()))
      showRecordToast(payload)
    },
    [showRecordToast]
  )

  // Handle feed updates
  const handleFeedUpdate = useCallback(
    (payload: FeedPostPayload) => {
      const notification: UnifiedNotification = {
        id: `feed-${payload.id}-${Date.now()}`,
        type: "feed",
        title: payload.type === "gallery" ? "New Gallery" : payload.type === "announcement" ? "New Announcement" : "New Post",
        message: payload.title || "New content has been published",
        link: payload.type === "gallery" ? "/gallery" : "/news",
        timestamp: new Date(payload.createdAt),
        isRead: false,
        source: "ably",
        payload,
      }

      setNotifications((prev) => [notification, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()))
      showFeedToast(payload)
    },
    [showFeedToast]
  )

  // Subscribe to all relevant channels
  useAblyChannel(
    session?.user?.id ? ABLY_CHANNELS.NOTIFICATIONS(session.user.id) : "",
    ABLY_EVENTS.NOTIFICATION_NEW,
    (payload: NotificationPayload) => {
      const notification: UnifiedNotification = {
        id: payload.id,
        type: "notification",
        title: payload.title,
        message: payload.message,
        link: payload.link,
        timestamp: new Date(payload.timestamp),
        isRead: false,
        source: "ably",
        payload,
      }
      setNotifications((prev) => [notification, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()))
    }
  )

  useAblyChannel(ABLY_CHANNELS.JOBS_ACTIVE, ABLY_EVENTS.JOB_POSTED, handleJobUpdate)
  useAblyChannel(ABLY_CHANNELS.JOBS_ACTIVE, ABLY_EVENTS.JOB_UPDATED, handleJobUpdate)
  useAblyChannel(
    session?.user?.id ? ABLY_CHANNELS.JOBS_APPLICATION(session.user.id) : "",
    ABLY_EVENTS.JOB_STATUS,
    handleJobUpdate
  )

  useAblyChannel(
    session?.user?.id ? ABLY_CHANNELS.RECORDS(session.user.id) : "",
    ABLY_EVENTS.RECORD_VERIFIED,
    handleRecordUpdate
  )
  useAblyChannel(
    session?.user?.id ? ABLY_CHANNELS.RECORDS(session.user.id) : "",
    ABLY_EVENTS.RECORD_UPDATE,
    handleRecordUpdate
  )

  useAblyChannel(ABLY_CHANNELS.FEED_PUBLIC, ABLY_EVENTS.FEED_POST, handleFeedUpdate)
  useAblyChannel(ABLY_CHANNELS.FEED_PUBLIC, ABLY_EVENTS.FEED_GALLERY, handleFeedUpdate)
  useAblyChannel(ABLY_CHANNELS.FEED_PUBLIC, ABLY_EVENTS.FEED_ANNOUNCEMENT, handleFeedUpdate)

  // Load initial notifications
  useEffect(() => {
    if (!session?.user?.id) return
    fetchNotifications()
  }, [session?.user?.id, fetchNotifications])

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let filtered = notifications

    if (filter === "unread") {
      filtered = filtered.filter((n) => !n.isRead)
    } else if (filter !== "all") {
      const typeMap: Record<string, string> = {
        jobs: "job",
        events: "event",
        records: "record",
        feed: "feed",
      }
      filtered = filtered.filter((n) => n.type === typeMap[filter])
    }

    return filtered
  }, [notifications, filter])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }, [])

  const handleNotificationClick = (notification: UnifiedNotification) => {
    markAsRead(notification.id)
    if (notification.link) {
      router.push(notification.link)
    }
    setOpen(false)
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  if (!session?.user) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-semibold",
                unreadCount > 99 ? "px-1" : ""
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 !bg-slate-900 !border-slate-700 !text-white" align="end">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
          <h3 className="font-semibold text-sm text-white">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs text-slate-300 hover:text-white hover:bg-slate-700">
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as NotificationType)} className="w-full">
          <TabsList className="w-full rounded-none border-b border-slate-700 !bg-slate-800/30 !text-slate-300">
            <TabsTrigger value="all" className="flex-1 text-xs !text-slate-300 data-[state=active]:!text-white data-[state=active]:!bg-slate-700">All</TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 text-xs !text-slate-300 data-[state=active]:!text-white data-[state=active]:!bg-slate-700">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex-1 text-xs !text-slate-300 data-[state=active]:!text-white data-[state=active]:!bg-slate-700">Jobs</TabsTrigger>
            <TabsTrigger value="events" className="flex-1 text-xs !text-slate-300 data-[state=active]:!text-white data-[state=active]:!bg-slate-700">Events</TabsTrigger>
          </TabsList>
        </Tabs>
        <ScrollArea className="h-[400px]">
          {filteredNotifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-400">No notifications</div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-slate-800/70 cursor-pointer transition-colors border-b border-slate-800",
                    !notification.isRead && "bg-blue-500/10"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {!notification.isRead && <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium leading-none text-white">{notification.title}</p>
                        <Badge variant="outline" className="text-xs h-4 !border-slate-600 !text-slate-300 !bg-slate-800">
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300 mt-1 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-2">{formatTime(notification.timestamp)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

