import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const session = await auth()
    const allowedRoles = ["FACULTY", "REGISTRAR", "DEAN", "ADMIN"]
    
    if (!session || !session.user.role || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id!

    // Get all conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
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
          select: {
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    })

    // Format threads
    const threads = conversations.map((conv) => {
      const otherParticipant = conv.participants.find((p) => p.user.id !== userId)
      const unreadCount = 0 // Calculate unread count if needed

      return {
        id: conv.id,
        otherUser: otherParticipant?.user || {
          id: "",
          name: "Unknown",
          image: null,
        },
        lastMessage: conv.messages[0] || null,
        unreadCount,
      }
    })

    return NextResponse.json({ threads })
  } catch (error: any) {
    console.error("Error in messages route:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}



