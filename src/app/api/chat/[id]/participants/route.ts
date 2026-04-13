import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

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

    // Check if user is part of this conversation
    const isParticipant = conversation.participants.some(
      (p) => p.userId === session.user.id
    )

    if (!isParticipant) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    return NextResponse.json({ participants: conversation.participants })
  } catch (error: any) {
    console.error("Error fetching participants:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch participants" },
      { status: 500 }
    )
  }
}
