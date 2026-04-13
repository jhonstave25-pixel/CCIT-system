import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all accepted connections for the current user
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: session.user.id, status: "ACCEPTED" },
          { receiverId: session.user.id, status: "ACCEPTED" },
        ],
      },
      include: {
        requester: {
          include: {
            profile: true,
          },
        },
        receiver: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Get the other user in each connection (not the current user)
    const connectedUsers = connections.map((connection) => {
      const otherUser = connection.requesterId === session.user.id 
        ? connection.receiver 
        : connection.requester
      
      return {
        id: otherUser.id,
        name: otherUser.name,
        email: otherUser.email,
        image: otherUser.image,
        profile: otherUser.profile,
        connectionStatus: "ACCEPTED",
        connectionId: connection.id,
        isReceiver: connection.receiverId === session.user.id,
      }
    })

    return NextResponse.json({ connections: connectedUsers })
  } catch (error) {
    console.error("Error fetching connections:", error)
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    )
  }
}
