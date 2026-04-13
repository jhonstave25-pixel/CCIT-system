import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Find connection between current user and the other user
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, receiverId: userId },
          { requesterId: userId, receiverId: session.user.id },
        ],
      },
      select: {
        id: true,
        status: true,
        requesterId: true,
        receiverId: true,
      },
    })

    if (!connection) {
      return NextResponse.json({
        status: "NONE",
        connectionId: null,
        isReceiver: false,
      })
    }

    return NextResponse.json({
      status: connection.status,
      connectionId: connection.id,
      isReceiver: connection.receiverId === session.user.id,
    })
  } catch (error: any) {
    console.error("Error checking connection status:", error)
    return NextResponse.json(
      { error: error.message || "Failed to check connection status" },
      { status: 500 }
    )
  }
}
