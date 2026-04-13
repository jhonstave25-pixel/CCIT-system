"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function blockUser(blockerId: string, blockedId: string, reason?: string) {
  if (blockerId === blockedId) {
    return { success: false, error: "Cannot block yourself" }
  }

  try {
    // Check if already blocked
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    })

    if (existingBlock) {
      return { success: false, error: "User is already blocked" }
    }

    await prisma.block.create({
      data: {
        blockerId,
        blockedId,
        reason,
      },
    })

    revalidatePath("/chat")
    revalidatePath("/messages")
    revalidatePath("/blocked-users")
    return { success: true }
  } catch (error) {
    console.error("Error blocking user:", error)
    return { success: false, error: "Failed to block user" }
  }
}

export async function unblockUser(blockerId: string, blockedId: string) {
  try {
    await prisma.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    })

    revalidatePath("/chat")
    revalidatePath("/messages")
    revalidatePath("/blocked-users")
    return { success: true }
  } catch (error) {
    console.error("Error unblocking user:", error)
    return { success: false, error: "Failed to unblock user" }
  }
}

export async function getBlockedUsers(userId: string) {
  try {
    const blocks = await prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
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
      orderBy: { createdAt: "desc" },
    })

    return { success: true, blockedUsers: blocks }
  } catch (error) {
    console.error("Error fetching blocked users:", error)
    return { success: false, error: "Failed to fetch blocked users" }
  }
}

export async function isUserBlocked(blockerId: string, blockedId: string) {
  try {
    const block = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    })

    return { success: true, isBlocked: !!block }
  } catch (error) {
    console.error("Error checking block status:", error)
    return { success: false, error: "Failed to check block status" }
  }
}

export async function checkMutualBlock(userId1: string, userId2: string) {
  try {
    const [block1, block2] = await Promise.all([
      prisma.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: userId1,
            blockedId: userId2,
          },
        },
      }),
      prisma.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: userId2,
            blockedId: userId1,
          },
        },
      }),
    ])

    // block1: userId1 blocked userId2
    // block2: userId2 blocked userId1
    return {
      success: true,
      isBlocked: !!(block1 || block2),
      isBlocker: !!block1, // userId1 is the blocker
      isBlockedBy: !!block2, // userId1 is blocked by userId2
      blockedById: block1 ? userId1 : block2 ? userId2 : null,
      blockedId: block1 ? userId2 : block2 ? userId1 : null,
    }
  } catch (error) {
    console.error("Error checking mutual block:", error)
    return { success: false, error: "Failed to check block status" }
  }
}
