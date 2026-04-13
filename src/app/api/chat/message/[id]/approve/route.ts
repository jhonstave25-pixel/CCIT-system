import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

// Approve a message
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
    const { action } = await req.json() // "approve" or "reject"

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Get the message
    const message = await prisma.chatMessage.findUnique({
      where: { id },
      include: {
        conversation: {
          include: {
            participants: {
              select: { userId: true },
            },
          },
        },
      },
    })

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 })
    }

    // Check if user is a participant in the conversation
    const isParticipant = message.conversation.participants.some(
      (p) => p.userId === session.user.id
    )

    if (!isParticipant) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Only the receiver (not the sender) can approve/reject
    if (message.senderId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot approve/reject your own message" },
        { status: 403 }
      )
    }

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED"

    // Update message status
    const updatedMessage = await prisma.chatMessage.update({
      where: { id },
      data: { status: newStatus },
    })

    revalidatePath(`/chat/${message.conversationId}`)
    revalidatePath(`/messages/${message.conversationId}`)

    return NextResponse.json({
      success: true,
      message: updatedMessage,
    })
  } catch (error: any) {
    console.error("Error updating message status:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update message status" },
      { status: 500 }
    )
  }
}
