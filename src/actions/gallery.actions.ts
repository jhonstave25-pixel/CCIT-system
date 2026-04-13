"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { publishToAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"
import type { FeedPostPayload } from "@/lib/ably/types"

export interface GalleryPayload {
  title: string
  description: string
  mediaUrls: string[]
  coverUrl?: string
  isPublic: boolean
  createdBy: string
}

export async function createGallery(data: GalleryPayload) {
  try {
    const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    if (!data.title || data.title.trim().length === 0) {
      throw new Error("Title is required")
    }

    if (!data.mediaUrls || data.mediaUrls.length === 0) {
      throw new Error("At least one image is required")
    }

    // Validate that URLs are not base64 data URLs (which can be very large)
    // Data URLs start with "data:" and should be uploaded first via /api/upload
    const hasDataUrls = data.mediaUrls.some((url) => url.startsWith("data:"))
    if (hasDataUrls) {
      throw new Error(
        "Data URLs detected. Please upload images first using the file upload feature. Data URLs are too large to store directly in the database."
      )
    }

    // Validate that URLs are local paths (should start with /uploads/)
    const invalidUrls = data.mediaUrls.filter(
      (url) => !url.startsWith("/uploads/") && !url.startsWith("http")
    )
    if (invalidUrls.length > 0) {
      throw new Error(
        `Invalid image URLs detected. Please ensure all images are properly uploaded. Invalid URLs: ${invalidUrls.join(", ")}`
      )
    }

    // Always use the session user ID for security (ignore client-provided createdBy)
    // Don't return the created gallery to avoid Prisma response size limit
    const gallery = await prisma.gallery.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        images: data.mediaUrls,
        coverImage: data.coverUrl || data.mediaUrls[0] || null,
        isPublic: data.isPublic,
        createdBy: session.user.id,
      },
      select: {
        id: true,
        title: true,
        coverImage: true,
        createdAt: true,
      },
    })

    // Publish real-time gallery update via Ably
    try {
      const payload: FeedPostPayload = {
        id: gallery.id,
        type: "gallery",
        authorId: session.user.id,
        authorName: null, // Could fetch if needed
        title: gallery.title,
        imageUrl: gallery.coverImage || undefined,
        createdAt: gallery.createdAt.toISOString(),
      }
      await publishToAblyChannel({
        channelName: ABLY_CHANNELS.FEED_PUBLIC,
        eventName: ABLY_EVENTS.FEED_GALLERY,
        data: payload,
      })
    } catch (ablyError) {
      console.warn("Failed to publish gallery update to Ably:", ablyError)
    }

    // Refresh both Admin and Alumni gallery views
    revalidatePath("/admin/gallery")
    revalidatePath("/gallery")
  } catch (error: any) {
    console.error("Failed to create gallery:", error)
    throw new Error(error.message || "Error creating gallery")
  }
}

export async function updateGallery(
  id: string,
  data: {
    title?: string
    description?: string
    eventId?: string
    images?: string
    coverImage?: string
    isPublic?: boolean | string
  }
) {
  try {
    const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.eventId !== undefined) updateData.eventId = data.eventId || null
    if (data.images !== undefined)
      updateData.images = data.images ? data.images.split(",").map((img) => img.trim()).filter(Boolean) : []
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage
    if (data.isPublic !== undefined)
      updateData.isPublic = typeof data.isPublic === "string" ? data.isPublic === "true" : data.isPublic

    const gallery = await prisma.gallery.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/admin/gallery")
    revalidatePath("/gallery")
    revalidatePath("/dashboard")
    return { success: true, gallery }
  } catch (error: any) {
    console.error("Error updating gallery:", error)
    return { success: false, error: error.message || "Failed to update gallery" }
  }
}

export async function deleteGallery(id: string) {
  try {
    const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.gallery.delete({
      where: { id },
    })

    revalidatePath("/admin/gallery")
    revalidatePath("/gallery")
    revalidatePath("/dashboard")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting gallery:", error)
    return { success: false, error: error.message || "Failed to delete gallery" }
  }
}


