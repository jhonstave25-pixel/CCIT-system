import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query params for filtering
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    const unreadOnly = searchParams.get("unread") === "true"

    // Build where clause
    const where: any = {
      userId: session.user.id,
    }

    if (type && type !== "all") {
      where.type = type.toUpperCase()
    }

    if (unreadOnly) {
      where.isRead = false
    }

    // Get notifications from database
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    })

    // Format notifications based on type
    const formattedNotifications = notifications.map((notif) => {
      let title = notif.title || "Notification"
      let message = notif.message || "You have a new notification"
      let link = notif.link

      switch (notif.type) {
        case "CHAT":
          title = notif.title || "New Message"
          message = notif.message || "You have a new message"
          link = notif.chatId ? `/chat/${notif.chatId}` : notif.link
          break
        case "JOB":
          title = notif.title || "New Job Opportunity"
          message = notif.message || "A new job has been posted"
          link = notif.jobId ? `/jobs/${notif.jobId}` : notif.link || "/jobs"
          break
        case "EVENT":
          title = notif.title || "New Event"
          message = notif.message || "A new event has been scheduled"
          link = notif.eventId ? `/events/${notif.eventId}` : notif.link || "/events"
          break
        case "RECOMMENDATION":
          title = notif.title || "Job Recommendation"
          message = notif.message || "A faculty member recommended you for a job"
          link = notif.link || "/jobs"
          break
      }

      return {
        id: notif.id,
        title,
        message,
        type: notif.type.toLowerCase(),
        link,
        timestamp: notif.createdAt,
        isRead: notif.isRead,
      }
    })

    // Get unread counts by type
    const unreadCounts = await prisma.notification.groupBy({
      by: ["type"],
      where: {
        userId: session.user.id,
        isRead: false,
      },
      _count: {
        type: true,
      },
    })

    const counts = {
      all: unreadCounts.reduce((acc, curr) => acc + curr._count.type, 0),
      chat: unreadCounts.find((c) => c.type === "CHAT")?._count.type || 0,
      job: unreadCounts.find((c) => c.type === "JOB")?._count.type || 0,
      event: unreadCounts.find((c) => c.type === "EVENT")?._count.type || 0,
      recommendation: unreadCounts.find((c) => c.type === "RECOMMENDATION")?._count.type || 0,
    }

    return NextResponse.json({ 
      notifications: formattedNotifications,
      unreadCounts: counts,
    })
  } catch (error: any) {
    console.error("Error fetching notifications:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// Mark notification as read
export async function PATCH(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { notificationId, markAllRead } = body

    if (markAllRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      })
    } else if (notificationId) {
      // Mark single notification as read
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: session.user.id,
        },
        data: {
          isRead: true,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

