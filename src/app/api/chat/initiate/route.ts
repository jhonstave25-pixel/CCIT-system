import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipientId } = await req.json()

    if (!recipientId) {
      return NextResponse.json({ error: "Recipient ID is required" }, { status: 400 })
    }

    if (session.user.id === recipientId) {
      return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 })
    }

    // Check for existing 1:1 conversation between these users
    const userConversations = await prisma.conversation.findMany({
      where: {
        isGroup: false,
        participants: {
          some: { userId: session.user.id },
        },
      },
      include: {
        participants: {
          select: { userId: true },
        },
      },
    })

    // Find conversation that also has the recipient
    const existing = userConversations.find(
      (conv) =>
        conv.participants.some((p) => p.userId === recipientId) &&
        conv.participants.length === 2
    )

    if (existing) {
      return NextResponse.json({ id: existing.id })
    }

    // Create a new conversation if none exists
    const chat = await prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [
            { userId: session.user.id },
            { userId: recipientId },
          ],
        },
      },
      select: {
        id: true,
      },
    })

    return NextResponse.json({ id: chat.id })
  } catch (error: any) {
    console.error("Error initiating chat:", error)
    return NextResponse.json(
      { error: error.message || "Failed to initiate chat" },
      { status: 500 }
    )
  }
}



