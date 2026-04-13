"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    // Verify the notification belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { userId: true, isRead: true },
    })

    if (!notification) {
      return { success: false, error: "Notification not found" }
    }

    if (notification.userId !== userId) {
      return { success: false, error: "Unauthorized" }
    }

    if (notification.isRead) {
      return { success: true } // Already read
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error marking notification as read:", error)
    return { success: false, error: error.message || "Failed to mark notification as read" }
  }
}

export async function markChatNotificationsAsRead(chatId: string, userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        chatId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error marking chat notifications as read:", error)
    return { success: false, error: error.message || "Failed to mark notifications as read" }
  }
}
