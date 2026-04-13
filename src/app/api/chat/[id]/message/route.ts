import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { publishToAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { content } = await req.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 })
    }

    // Get conversation participants to find the receiver
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          select: { userId: true },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    // Find the other participant (receiver)
    const receiver = conversation.participants.find(p => p.userId !== session.user.id)
    
    if (!receiver) {
      return NextResponse.json({ error: "No receiver found" }, { status: 400 })
    }

    // Create message in database - new messages start as PENDING for receiver approval
    const message = await prisma.chatMessage.create({
      data: {
        conversationId: id,
        senderId: session.user.id,
        content: content.trim(),
        seenBy: [session.user.id], // Sender has seen their own message
        status: "PENDING", // Messages start as pending for approval
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

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    // Create notification entries and publish real-time updates
    if (conversation) {
      try {
        await Promise.all(
          conversation.participants.map(async (participant) => {
            if (participant.userId !== session.user.id) {
              // Create notification entry
              await prisma.notification.create({
                data: {
                  userId: participant.userId,
                  chatId: id,
                  messageId: message.id,
                  isRead: false,
                },
              })
            }
          })
        )

        // Publish to Ably channels for real-time updates
        try {
          const messagePayload = {
            id: message.id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            content: message.content,
            createdAt: message.createdAt.toISOString(),
            seenBy: message.seenBy,
            status: message.status,
            sender: message.sender,
          }

          // Publish to conversation channel (for all participants)
          await publishToAblyChannel({
            channelName: ABLY_CHANNELS.CHAT(id),
            eventName: ABLY_EVENTS.CHAT_MESSAGE,
            data: messagePayload,
          })

          // Publish to private channels for each participant (for notifications)
          await Promise.all(
            conversation.participants.map(async (participant) => {
              if (participant.userId !== session.user.id) {
                // Publish notification update
                await publishToAblyChannel({
                  channelName: ABLY_CHANNELS.NOTIFICATIONS(participant.userId),
                  eventName: ABLY_EVENTS.NOTIFICATION_NEW,
                  data: {
                    id: message.id,
                    userId: participant.userId,
                    type: "chat",
                    title: "New Message",
                    message: `New message from ${message.sender?.name || "Someone"}`,
                    link: `/chat/${id}`,
                    timestamp: new Date().toISOString(),
                  },
                })
              }
            })
          )
        } catch (ablyError) {
          // Log but don't fail - Ably is optional
          console.warn("Ably notification error (non-critical):", ablyError)
        }
      } catch (notificationError) {
        // Log error but don't fail the request
        console.error("Notification creation error:", notificationError)
      }
    }

    return NextResponse.json({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      seenBy: message.seenBy,
      status: message.status,
      sender: message.sender,
    })
  } catch (error: any) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    )
  }
}

