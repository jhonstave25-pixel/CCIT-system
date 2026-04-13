"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Bell, Briefcase, Calendar, MessageSquare, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { useAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"
import { useToast } from "@/hooks/use-toast"
import type { NotificationPayload } from "@/lib/ably/types"

interface Notification {
  id: string
  title: string
  message: string
  type?: string
  link?: string
  timestamp: Date
  isRead?: boolean
}

export function NotificationCenter() {
  const { data: session } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  // Fetch notifications function
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return
    try {
      const res = await fetch("/api/notifications")
      const data = await res.json()
      if (data.notifications) {
        setNotifications(
          data.notifications.map((n: any) => ({
            ...n,
            timestamp: new Date(n.createdAt || n.timestamp),
          }))
        )
        setUnreadCount(data.notifications.filter((n: any) => !n.isRead).length)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }, [session?.user?.id])

  // Load initial notifications and set up polling
  useEffect(() => {
    if (!session?.user?.id) return

    // Initial fetch
    fetchNotifications()

    // Poll for new notifications periodically (fallback when Ably is not available)
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [session?.user?.id, fetchNotifications])

  const { toast } = useToast()

  // Subscribe to Ably channel for real-time notifications
  const handleNotificationUpdate = useCallback((payload: NotificationPayload) => {
    // Fetch latest notifications to update the list
    fetchNotifications()
    
    // Show toast for new job, event, and recommendation notifications
    if (payload.type === "job" || payload.type === "event" || payload.type === "recommendation") {
      const icons = {
        job: <Briefcase className="h-4 w-4" />,
        event: <Calendar className="h-4 w-4" />,
        recommendation: <UserCheck className="h-4 w-4" />,
        chat: <MessageSquare className="h-4 w-4" />,
      }
      
      toast({
        title: payload.title,
        description: payload.message,
        icon: icons[payload.type as keyof typeof icons],
      })
    }
  }, [fetchNotifications, toast])

  useAblyChannel(
    session?.user?.id ? ABLY_CHANNELS.NOTIFICATIONS(session.user.id) : "",
    ABLY_EVENTS.NOTIFICATION_NEW,
    handleNotificationUpdate
  )

  const handleNotificationClick = (notification: Notification) => {
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
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white hover:bg-white/10"
        >
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
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                    !notification.isRead && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {!notification.isRead && (
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTime(notification.timestamp)}
                      </p>
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

