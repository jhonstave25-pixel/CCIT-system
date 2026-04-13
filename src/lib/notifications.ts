import { prisma } from "./prisma"
import { ABLY_EVENTS } from "./ably"

export type NotificationType = "CHAT" | "JOB" | "EVENT" | "RECOMMENDATION"

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
  chatId?: string
  jobId?: string
  eventId?: string
}

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  chatId,
  jobId,
  eventId,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        chatId,
        jobId,
        eventId,
        isRead: false,
      },
    })

    // Also publish via Ably for real-time updates
    try {
      const { publishToAblyChannel } = await import("./ably/server")
      await publishToAblyChannel({
        channelName: `ccit:notifications:${userId}`,
        eventName: ABLY_EVENTS.NOTIFICATION_NEW,
        data: {
          id: notification.id,
          userId,
          type: type.toLowerCase(),
          title,
          message,
          link,
          timestamp: notification.createdAt.toISOString(),
        },
      })
    } catch (ablyError) {
      // Non-critical: Log but don't fail if Ably fails
      console.warn("Failed to publish notification to Ably:", ablyError)
    }

    return notification
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

// Helper to notify all users about a new job
export async function notifyAllUsersAboutJob(jobId: string, jobTitle: string, company: string) {
  try {
    // Get all alumni users
    const users = await prisma.user.findMany({
      where: {
        role: "ALUMNI",
      },
      select: {
        id: true,
      },
    })

    // Create notifications for all users
    const notifications = users.map((user) =>
      createNotification({
        userId: user.id,
        type: "JOB",
        title: "New Job Opportunity",
        message: `${jobTitle} at ${company} - Check it out!`,
        link: `/jobs/${jobId}`,
        jobId,
      })
    )

    await Promise.all(notifications)

    return { success: true, notifiedCount: users.length }
  } catch (error) {
    console.error("Error notifying users about job:", error)
    throw error
  }
}

// Helper to notify all users about a new event
export async function notifyAllUsersAboutEvent(eventId: string, eventTitle: string, eventDate: Date) {
  try {
    // Get all users (alumni and faculty)
    const users = await prisma.user.findMany({
      select: {
        id: true,
      },
    })

    const dateStr = eventDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })

    // Create notifications for all users
    const notifications = users.map((user) =>
      createNotification({
        userId: user.id,
        type: "EVENT",
        title: "New Event",
        message: `${eventTitle} - ${dateStr}`,
        link: `/events/${eventId}`,
        eventId,
      })
    )

    await Promise.all(notifications)

    return { success: true, notifiedCount: users.length }
  } catch (error) {
    console.error("Error notifying users about event:", error)
    throw error
  }
}

// Helper to notify alumni when faculty recommends them
export async function notifyAlumniOfRecommendation(alumniId: string, jobTitle: string, facultyName: string, jobId: string) {
  return createNotification({
    userId: alumniId,
    type: "RECOMMENDATION",
    title: "Job Recommendation",
    message: `${facultyName} recommended you for ${jobTitle}`,
    link: `/jobs/${jobId}`,
    jobId,
  })
}

// Helper to notify user about new chat message
export async function notifyUserOfChatMessage(userId: string, senderName: string, chatId: string, messagePreview?: string) {
  return createNotification({
    userId,
    type: "CHAT",
    title: "New Message",
    message: messagePreview || `${senderName} sent you a message`,
    link: `/chat/${chatId}`,
    chatId,
  })
}
