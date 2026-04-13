"use server"

import { prisma } from "@/lib/prisma"
import { sendConnectionRequestEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"

export async function sendConnectionRequest(requesterId: string, receiverId: string, message?: string) {
  try {
    // Check if connection already exists
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId },
        ],
      },
    })

    if (existingConnection) {
      return { success: false, error: "Connection already exists" }
    }

    const [requester, receiver] = await Promise.all([
      prisma.user.findUnique({
        where: { id: requesterId },
        select: { name: true, email: true },
      }),
      prisma.user.findUnique({
        where: { id: receiverId },
        select: { name: true, email: true },
      }),
    ])

    if (!requester || !receiver) {
      return { success: false, error: "User not found" }
    }

    const connection = await prisma.connection.create({
      data: {
        requesterId,
        receiverId,
        message,
        status: "PENDING",
      },
    })

    // Send email notification
    await sendConnectionRequestEmail(
      receiver.email!,
      receiver.name || "Alumni",
      requester.name || "An alumni member",
      `${process.env.NEXTAUTH_URL}/profile/${requesterId}`
    )

    revalidatePath("/connections")
    return { success: true, connection }
  } catch (error) {
    return { success: false, error: "Failed to send connection request" }
  }
}

export async function acceptConnectionRequest(connectionId: string) {
  try {
    const connection = await prisma.connection.update({
      where: { id: connectionId },
      data: { status: "ACCEPTED" },
    })

    revalidatePath("/connections")
    revalidatePath("/connections/pending")
    return { success: true, connection }
  } catch (error) {
    return { success: false, error: "Failed to accept connection" }
  }
}

export async function declineConnectionRequest(connectionId: string) {
  try {
    const connection = await prisma.connection.update({
      where: { id: connectionId },
      data: { status: "REJECTED" },
    })

    revalidatePath("/connections")
    revalidatePath("/connections/pending")
    return { success: true, connection }
  } catch (error) {
    return { success: false, error: "Failed to decline connection" }
  }
}

export async function getConnectionStatus(requesterId: string, receiverId: string) {
  try {
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { requesterId, receiverId },
          { requesterId: receiverId, receiverId: requesterId },
        ],
      },
    })

    return { success: true, connection }
  } catch (error) {
    return { success: false, error: "Failed to get connection status" }
  }
}

export async function getPendingConnections(userId: string) {
  try {
    const receivedRequests = await prisma.connection.findMany({
      where: {
        receiverId: userId,
        status: "PENDING",
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            profile: {
              select: {
                batch: true,
                degree: true,
                currentCompany: true,
                currentPosition: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const sentRequests = await prisma.connection.findMany({
      where: {
        requesterId: userId,
        status: "PENDING",
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            profile: {
              select: {
                batch: true,
                degree: true,
                currentCompany: true,
                currentPosition: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const acceptedConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { requesterId: userId, status: "ACCEPTED" },
          { receiverId: userId, status: "ACCEPTED" },
        ],
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            profile: {
              select: {
                batch: true,
                degree: true,
                currentCompany: true,
                currentPosition: true,
              },
            },
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            profile: {
              select: {
                batch: true,
                degree: true,
                currentCompany: true,
                currentPosition: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, receivedRequests, sentRequests, acceptedConnections }
  } catch (error) {
    return { success: false, error: "Failed to get pending connections" }
  }
}

export async function removeConnection(connectionId: string) {
  try {
    await prisma.connection.delete({
      where: { id: connectionId },
    })

    revalidatePath("/connections")
    revalidatePath("/connections/pending")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error removing connection:", error)
    return { success: false, error: "Failed to remove connection" }
  }
}

