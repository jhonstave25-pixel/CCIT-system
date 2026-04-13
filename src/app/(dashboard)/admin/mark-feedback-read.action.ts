"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function markFeedbackReadAction(id: string) {
  try {
    await prisma.feedback.update({
      where: { id },
      data: { status: "read" },
    })

    revalidatePath("/admin")
    revalidatePath("/dashboard")

    return { ok: true }
  } catch (error: any) {
    console.error("Error marking feedback as read:", error)
    return { ok: false, error: error.message || "Failed to mark feedback as read" }
  }
}



















