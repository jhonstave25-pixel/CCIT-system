"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { publishToAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"

export async function getOrCreateConversation(currentUserId: string, otherUserId: string) {
  if (currentUserId === otherUserId) {
    return { error: "Cannot message yourself", conversationId: null }
  }

  try {
    // Find an existing 1:1 conversation with both participants
    // Get all conversations where current user is a participant
    const userConversations = await prisma.conversation.findMany({
      where: {
        isGroup: false,
        participants: {
          some: { userId: currentUserId },
        },
      },
      include: {
        participants: {
          select: { userId: true },
        },
      },
    })

    // Find conversation that also has the other user
    const existing = userConversations.find(
      (conv) =>
        conv.participants.some((p) => p.userId === otherUserId) &&
        conv.participants.length === 2
    )

    if (existing) return { error: null, conversationId: existing.id }

    const created = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId: currentUserId }, { userId: otherUserId }],
        },
      },
      select: { id: true },
    })

    return { error: null, conversationId: created.id }
  } catch (error: any) {
    console.error("Error in getOrCreateConversation:", error)
    return { error: error.message || "Failed to create conversation", conversationId: null }
  }
}

export async function listConversations(userId: string) {
  return prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      updatedAt: true,
      isGroup: true,
      name: true,
      participants: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { id: true, content: true, createdAt: true, senderId: true },
      },
    },
  })
}

export async function getMessages(conversationId: string, userId: string) {
  // Get all messages first
  const messages = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      senderId: true,
      seenBy: true,
      status: true,
    },
  })

  // Mark all unseen messages as seen by this user (update individually)
  const unseenMessages = messages.filter(
    (m) => !m.seenBy.includes(userId) && m.senderId !== userId
  )

  if (unseenMessages.length > 0) {
    await Promise.all([
      // Update message seenBy arrays
      ...unseenMessages.map((msg) =>
        prisma.chatMessage.update({
          where: { id: msg.id },
          data: {
            seenBy: {
              push: userId,
            },
          },
        })
      ),
      // Mark notifications as read
      prisma.notification.updateMany({
        where: {
          userId,
          chatId: conversationId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      }),
    ])
  }

  // Return updated messages
  return prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      senderId: true,
      seenBy: true,
      status: true,
    },
  })
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const text = content.trim()
  if (!text) return { ok: false, error: "Message cannot be empty" }

  // Get conversation participants to find the receiver
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      participants: {
        select: { userId: true },
      },
    },
  })

  if (!conversation) {
    return { ok: false, error: "Conversation not found" }
  }

  // Find the other participant (receiver)
  const receiver = conversation.participants.find(p => p.userId !== senderId)
  
  if (!receiver) {
    return { ok: false, error: "No receiver found" }
  }

  // Check if either user has blocked the other
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: senderId, blockedId: receiver.userId },
        { blockerId: receiver.userId, blockedId: senderId },
      ],
    },
  })

  if (block) {
    return { ok: false, error: "Unable to send message. You have been blocked or have blocked this user." }
  }

  const message = await prisma.chatMessage.create({
    data: {
      conversationId,
      senderId,
      content: text,
      seenBy: [senderId], // Sender has seen their own message
      status: "PENDING", // New messages start as pending for approval
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  })

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  // 🔔 Notify participants via Ably
  if (conversation) {
    try {
      // Create notification entries and publish real-time updates
      await Promise.all(
        conversation.participants.map(async (participant) => {
          if (participant.userId !== senderId) {
            // Create notification entry
            await prisma.notification.create({
              data: {
                userId: participant.userId,
                chatId: conversationId,
                messageId: message.id,
                isRead: false,
              },
            })

            // Publish notification update via Ably
            try {
              await publishToAblyChannel({
                channelName: ABLY_CHANNELS.NOTIFICATIONS(participant.userId),
                eventName: ABLY_EVENTS.NOTIFICATION_NEW,
                data: {
                  id: message.id,
                  userId: participant.userId,
                  type: "chat",
                  title: "New Message",
                  message: `New message from ${message.sender?.name || "Someone"}`,
                  link: `/chat/${conversationId}`,
                  timestamp: new Date().toISOString(),
                },
              })
            } catch (ablyError) {
              console.warn("Ably notification error (non-critical):", ablyError)
            }
          }
        })
      )

      // Publish to conversation channel (for all participants)
      const messageData = {
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
        seenBy: message.seenBy,
        status: message.status,
        sender: message.sender,
      }

      // Publish via Ably
      try {
        await publishToAblyChannel({
          channelName: ABLY_CHANNELS.CHAT(conversationId),
          eventName: ABLY_EVENTS.CHAT_MESSAGE,
          data: messageData,
        })
      } catch (ablyError) {
        console.warn("Ably conversation channel error (non-critical):", ablyError)
      }
    } catch (error) {
      // Log but don't fail - real-time is optional
      console.warn("Real-time notification error (non-critical):", error)
    }
  }

  revalidatePath(`/messages/${conversationId}`)
  revalidatePath(`/chat/${conversationId}`)
  revalidatePath("/messages")
  revalidatePath("/chat")
  return { ok: true }
}

export async function unreadCount(userId: string) {
  return prisma.chatMessage.count({
    where: {
      conversation: {
        participants: {
          some: { userId },
        },
      },
      NOT: { seenBy: { has: userId } },
      NOT: { senderId: userId },
    },
  })
}

