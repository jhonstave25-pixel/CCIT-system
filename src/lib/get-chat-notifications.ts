import { prisma } from "@/lib/prisma"
import { formatDistanceToNow } from "date-fns"

export async function getChatNotifications(userId: string) {
  try {
    // Get all chat notifications (both read and unread) for the user
    const allNotifications = await prisma.notification.findMany({
      where: {
        userId,
        chatId: { not: null },
      },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10, // Limit to 10 most recent
  })

  // Get unread messages count per conversation
  const unreadMessages = await prisma.chatMessage.findMany({
    where: {
      conversation: {
        participants: {
          some: { userId },
        },
      },
      NOT: { seenBy: { has: userId } },
      NOT: { senderId: userId },
    },
    include: {
      sender: {
        select: {
          name: true,
        },
      },
      conversation: {
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Group messages by conversation and get the latest one
  const conversationMap = new Map<string, typeof unreadMessages[0]>()
  for (const message of unreadMessages) {
    const convId = message.conversationId
    if (!conversationMap.has(convId)) {
      conversationMap.set(convId, message)
    }
  }

  // Format notifications
  const notifications: Array<{
    id: string
    text: string
    time: string
    chatId?: string
    type: "chat"
    date: Date
    isRead: boolean
  }> = []

  // Add notifications from Notification model
  for (const notif of allNotifications) {
    if (notif.chatId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: notif.chatId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      if (conversation) {
        const others = conversation.participants
          .map((p) => p.user)
          .filter((u) => u.id !== userId)

        const senderName = others.length > 0 ? others[0].name || "Someone" : "Someone"
        // Truncate long names to prevent overflow
        const truncatedName = senderName.length > 25 ? senderName.substring(0, 25) + "..." : senderName

        notifications.push({
          id: notif.id,
          text: `New message from ${truncatedName}`,
          time: formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }),
          chatId: notif.chatId,
          type: "chat",
          date: new Date(notif.createdAt),
          isRead: notif.isRead,
        })
      }
    }
  }

  // Add notifications from unread messages (avoid duplicates)
  const existingChatIds = new Set(notifications.map((n) => n.chatId).filter(Boolean))
  
  // Only add unread messages that don't have a notification entry yet
  for (const message of conversationMap.values()) {
    if (!existingChatIds.has(message.conversationId)) {
      // Check if there are any unread messages for this conversation
      const hasUnread = unreadMessages.some((m) => m.conversationId === message.conversationId)
      const others = message.conversation.participants
        .map((p) => p.user)
        .filter((u) => u.id !== userId)

      const senderName = message.sender.name || others[0]?.name || "Someone"
      // Truncate long names to prevent overflow
      const truncatedName = senderName.length > 20 ? senderName.substring(0, 20) + "..." : senderName
      const unreadCount = unreadMessages.filter((m) => m.conversationId === message.conversationId).length

      notifications.push({
        id: `msg-${message.id}`,
        text: unreadCount > 1 
          ? `${unreadCount} new messages from ${truncatedName}`
          : `New message from ${truncatedName}`,
        time: formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }),
        chatId: message.conversationId,
        type: "chat",
        date: new Date(message.createdAt),
        isRead: !hasUnread, // Mark as unread if there are unread messages
      })
    }
  }

  // Sort by creation time (most recent first), unread first, then remove date from return
  return notifications
    .sort((a, b) => {
      // Unread notifications first
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1
      }
      // Then by date (most recent first)
      return b.date.getTime() - a.date.getTime()
    })
    .map(({ date, ...notif }) => notif)
  } catch (error) {
    console.error("Error in getChatNotifications:", error)
    // Return empty array on error to prevent breaking the dashboard
    return []
  }
}

