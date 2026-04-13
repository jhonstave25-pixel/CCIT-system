"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Briefcase, Calendar, MessageSquare, Bell, UserCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"
import type { NotificationPayload } from "@/lib/ably/types"

interface Notification {
  id: string
  title: string
  message: string
  type: "chat" | "job" | "event" | "recommendation"
  link?: string
  timestamp: string
  isRead: boolean
}

interface UnreadCounts {
  all: number
  chat: number
  job: number
  event: number
  recommendation: number
}

export function NotificationsPanel() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState("all")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    all: 0,
    chat: 0,
    job: 0,
    event: 0,
    recommendation: 0,
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchNotifications = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) return

    try {
      const params = new URLSearchParams()
      if (activeTab !== "all") {
        params.set("type", activeTab)
      }
      params.set("unread", "false")

      const res = await fetch(`/api/notifications?${params}`)
      if (!res.ok) throw new Error("Failed to fetch notifications")

      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCounts(data.unreadCounts || { all: 0, chat: 0, job: 0, event: 0, recommendation: 0 })
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, activeTab, status])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Subscribe to Ably for real-time notifications
  const handleRealtimeNotification = useCallback((payload: NotificationPayload) => {
    // Add the new notification to the list immediately
    const newNotification: Notification = {
      id: payload.id,
      title: payload.title,
      message: payload.message,
      type: payload.type as "chat" | "job" | "event" | "recommendation",
      link: payload.link,
      timestamp: payload.timestamp,
      isRead: false,
    }

    setNotifications((prev) => [newNotification, ...prev])
    setUnreadCounts((prev) => ({
      ...prev,
      all: prev.all + 1,
      [payload.type]: prev[payload.type as keyof UnreadCounts] + 1,
    }))

    // Show toast for job, event, and recommendation notifications
    if (payload.type === "job" || payload.type === "event" || payload.type === "recommendation") {
      const icons = {
        job: <Briefcase className="h-4 w-4" />,
        event: <Calendar className="h-4 w-4" />,
        recommendation: <UserCheck className="h-4 w-4" />,
      }

      toast({
        title: payload.title,
        description: payload.message,
      })
    }
  }, [toast])

  useAblyChannel(
    session?.user?.id ? ABLY_CHANNELS.NOTIFICATIONS(session.user.id) : "",
    ABLY_EVENTS.NOTIFICATION_NEW,
    handleRealtimeNotification
  )

  const markAsRead = async (notificationId: string) => {
    if (!session?.user?.id) return

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })

      if (!res.ok) throw new Error("Failed to mark as read")

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      )
      setUnreadCounts((prev) => ({
        ...prev,
        all: Math.max(0, prev.all - 1),
      }))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!session?.user?.id) return

    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      })

      if (!res.ok) throw new Error("Failed to mark all as read")

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCounts({
        all: 0,
        chat: 0,
        job: 0,
        event: 0,
        recommendation: 0,
      })

      toast({
        title: "All caught up",
        description: "All notifications marked as read",
      })
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "chat":
        return <MessageSquare className="w-4 h-4" />
      case "job":
        return <Briefcase className="w-4 h-4" />
      case "event":
        return <Calendar className="w-4 h-4" />
      case "recommendation":
        return <UserCheck className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case "chat":
        return "bg-blue-500/20 text-blue-300"
      case "job":
        return "bg-green-500/20 text-green-300"
      case "event":
        return "bg-purple-500/20 text-purple-300"
      case "recommendation":
        return "bg-yellow-500/20 text-yellow-300"
      default:
        return "bg-white/20 text-white"
    }
  }

  if (loading) {
    return (
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-white">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-white/60">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-white">Notifications</CardTitle>
        {unreadCounts.all > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs text-white/60 hover:text-white transition-colors"
          >
            Mark all read
          </button>
        )}
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white/5 border border-white/10">
          <TabsTrigger
            value="all"
            className="text-xs data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white"
          >
            All{unreadCounts.all > 0 && ` (${unreadCounts.all})`}
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="text-xs data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white"
          >
            Chat{unreadCounts.chat > 0 && ` (${unreadCounts.chat})`}
          </TabsTrigger>
          <TabsTrigger
            value="job"
            className="text-xs data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white"
          >
            Jobs{unreadCounts.job > 0 && ` (${unreadCounts.job})`}
          </TabsTrigger>
          <TabsTrigger
            value="event"
            className="text-xs data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white"
          >
            Events{unreadCounts.event > 0 && ` (${unreadCounts.event})`}
          </TabsTrigger>
          <TabsTrigger
            value="recommendation"
            className="text-xs data-[state=active]:bg-white/10 text-white/70 data-[state=active]:text-white"
          >
            Recs{unreadCounts.recommendation > 0 && ` (${unreadCounts.recommendation})`}
          </TabsTrigger>
        </TabsList>

        <CardContent className="pt-4 max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-white/60 text-center py-4">
              No notifications
            </p>
          ) : (
            <div className="grid gap-2">
              {notifications.map((notification) => {
                const isUnread = !notification.isRead
                const content = (
                  <div
                    className={cn(
                      "flex items-start gap-3 w-full px-3 py-3 rounded-lg border border-white/10 transition-colors",
                      isUnread
                        ? "bg-white/10 hover:bg-white/15"
                        : "bg-white/5 hover:bg-white/10"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0",
                        getIconColor(notification.type)
                      )}
                    >
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        {notification.title}
                      </p>
                      <p className="text-xs text-white/70 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-white/50 mt-1">
                        {new Date(notification.timestamp).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {isUnread && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                  </div>
                )

                if (notification.link) {
                  return (
                    <Link
                      key={notification.id}
                      href={notification.link}
                      onClick={() => isUnread && markAsRead(notification.id)}
                      className="block"
                    >
                      {content}
                    </Link>
                  )
                }

                return (
                  <div
                    key={notification.id}
                    onClick={() => isUnread && markAsRead(notification.id)}
                    className="cursor-pointer"
                  >
                    {content}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Tabs>
    </Card>
  )
}


