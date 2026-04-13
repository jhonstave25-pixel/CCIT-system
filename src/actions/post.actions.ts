"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { publishToAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"
import type { FeedPostPayload } from "@/lib/ably/types"

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function createPost(data: {
  title: string
  content: string
  excerpt?: string
  coverImage?: string
  sourceUrl?: string
  published?: boolean | string
  featured?: boolean | string
  category: string
  tags?: string
}) {
  try {
    const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const published = typeof data.published === "string" ? data.published === "true" : data.published
    const featured = typeof data.featured === "string" ? data.featured === "true" : data.featured
    const tags = data.tags ? data.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : []

    const slug = generateSlug(data.title)

    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug,
        content: data.content,
        excerpt: data.excerpt,
        coverImage: data.coverImage,
        sourceUrl: data.sourceUrl || null,
        published: published || false,
        featured: featured || false,
        category: data.category,
        tags,
        authorId: session.user.id,
        publishedAt: published ? new Date() : null,
      },
    })

    // Publish real-time post update via Ably (only if published)
    if (published) {
      try {
        const author = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { name: true },
        })
        const payload: FeedPostPayload = {
          id: post.id,
          type: "post",
          authorId: session.user.id,
          authorName: author?.name || null,
          title: post.title,
          content: post.excerpt || undefined,
          imageUrl: post.coverImage || undefined,
          createdAt: post.publishedAt?.toISOString() || new Date().toISOString(),
        }
        await publishToAblyChannel({
          channelName: ABLY_CHANNELS.FEED_PUBLIC,
          eventName: ABLY_EVENTS.FEED_POST,
          data: payload,
        })
      } catch (ablyError) {
        console.warn("Failed to publish post update to Ably:", ablyError)
      }
    }

    revalidatePath("/admin/news")
    revalidatePath("/dashboard/news")
    return { success: true, post }
  } catch (error: any) {
    console.error("Error creating post:", error)
    return { success: false, error: error.message || "Failed to create post" }
  }
}

export async function updatePost(
  id: string,
  data: {
    title?: string
    content?: string
    excerpt?: string
    coverImage?: string
    sourceUrl?: string
    published?: boolean | string
    featured?: boolean | string
    category?: string
    tags?: string
  }
) {
  try {
    const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const updateData: any = {}
    if (data.title !== undefined) {
      updateData.title = data.title
      updateData.slug = generateSlug(data.title)
    }
    if (data.content !== undefined) updateData.content = data.content
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage
    if (data.sourceUrl !== undefined) updateData.sourceUrl = data.sourceUrl || null
    if (data.published !== undefined) {
      updateData.published = typeof data.published === "string" ? data.published === "true" : data.published
      if (updateData.published && !data.published) {
        updateData.publishedAt = new Date()
      }
    }
    if (data.featured !== undefined)
      updateData.featured = typeof data.featured === "string" ? data.featured === "true" : data.featured
    if (data.category !== undefined) updateData.category = data.category
    if (data.tags !== undefined)
      updateData.tags = data.tags ? data.tags.split(",").map((tag) => tag.trim()).filter(Boolean) : []

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/admin/news")
    revalidatePath("/dashboard/news")
    return { success: true, post }
  } catch (error: any) {
    console.error("Error updating post:", error)
    return { success: false, error: error.message || "Failed to update post" }
  }
}

export async function deletePost(id: string) {
  try {
    const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.post.delete({
      where: { id },
    })

    revalidatePath("/admin/news")
    revalidatePath("/dashboard/news")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting post:", error)
    return { success: false, error: error.message || "Failed to delete post" }
  }
}


