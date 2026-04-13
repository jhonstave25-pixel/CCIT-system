"use server"

import { prisma } from "@/lib/prisma"
import { sendEventRegistrationEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { publishToAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"
import { notifyAllUsersAboutEvent } from "@/lib/notifications"
import type { EventUpdatePayload } from "@/lib/ably/types"

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function registerForEvent(userId: string, eventId: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { _count: { select: { registrations: true } } },
    })

    if (!event) {
      return { success: false, error: "Event not found" }
    }

    if (event.capacity && event._count.registrations >= event.capacity) {
      return { success: false, error: "Event is full" }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Check if user already has a registration (either confirmed or declined)
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    })

    let registration
    if (existingRegistration) {
      // Update existing registration to CONFIRMED
      registration = await prisma.eventRegistration.update({
        where: { id: existingRegistration.id },
        data: {
          status: "CONFIRMED",
        },
      })
    } else {
      // Create new registration
      registration = await prisma.eventRegistration.create({
        data: {
          userId,
          eventId,
          status: "CONFIRMED",
        },
      })
    }

    // Send confirmation email (non-blocking - don't fail registration if email fails)
    try {
      await sendEventRegistrationEmail(
        user.email!,
        user.name || "Alumni",
        event.title,
        event.eventDate,
        event.location
      )
    } catch (emailError: any) {
      // Log email error but don't fail the registration
      console.warn("Failed to send event registration email:", emailError.message)
    }

    // Notify admin (non-blocking)
    try {
      await notifyAdminRSVP(user.name || user.email, event.title, "ATTENDING", null)
    } catch (notifyError: any) {
      console.warn("Failed to notify admin of RSVP:", notifyError.message)
    }

    // Publish real-time RSVP update via Ably
    try {
      const payload: EventUpdatePayload = {
        eventId,
        type: "rsvp",
        userId,
        userName: user.name,
        data: {
          status: "CONFIRMED",
          registrationId: registration.id,
        },
        timestamp: new Date().toISOString(),
      }
      await publishToAblyChannel({
        channelName: ABLY_CHANNELS.EVENT(eventId),
        eventName: ABLY_EVENTS.EVENT_RSVP,
        data: payload,
      })
    } catch (ablyError) {
      console.warn("Failed to publish event RSVP to Ably:", ablyError)
    }

    revalidatePath("/events")
    revalidatePath(`/events/${eventId}`)
    revalidatePath("/admin/events")
    revalidatePath("/admin")
    return { success: true, registration }
  } catch (error: any) {
    console.error("Error registering for event:", error)
    return { success: false, error: error.message || "Failed to register" }
  }
}

export async function declineEvent(userId: string, eventId: string, reason?: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    })

    if (!event) {
      return { success: false, error: "Event not found" }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Check if user already has a registration
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    })

    let registration
    if (existingRegistration) {
      // Update existing registration to DECLINED
      registration = await prisma.eventRegistration.update({
        where: { id: existingRegistration.id },
        data: {
          status: "DECLINED",
        },
      })
    } else {
      // Create new registration with DECLINED status
      registration = await prisma.eventRegistration.create({
        data: {
          userId,
          eventId,
          status: "DECLINED",
        },
      })
    }

    // Notify admin (non-blocking)
    try {
      await notifyAdminRSVP(user.name || user.email, event.title, "NOT_ATTENDING", reason)
    } catch (notifyError: any) {
      console.warn("Failed to notify admin of RSVP:", notifyError.message)
    }

    // Publish real-time RSVP update via Ably
    try {
      const payload: EventUpdatePayload = {
        eventId,
        type: "rsvp",
        userId,
        userName: user.name,
        data: {
          status: "DECLINED",
          registrationId: registration.id,
          reason,
        },
        timestamp: new Date().toISOString(),
      }
      await publishToAblyChannel({
        channelName: ABLY_CHANNELS.EVENT(eventId),
        eventName: ABLY_EVENTS.EVENT_RSVP,
        data: payload,
      })
    } catch (ablyError) {
      console.warn("Failed to publish event RSVP to Ably:", ablyError)
    }

    revalidatePath("/events")
    revalidatePath(`/events/${eventId}`)
    revalidatePath("/admin/events")
    revalidatePath("/admin")
    return { success: true, registration }
  } catch (error: any) {
    console.error("Error declining event:", error)
    return { success: false, error: error.message || "Failed to decline event" }
  }
}

async function notifyAdminRSVP(userName: string, eventTitle: string, response: "ATTENDING" | "NOT_ATTENDING", reason: string | null) {
  try {
    const fs = await import("fs/promises")
    const path = await import("path")
    
    const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "feedback")
    await fs.mkdir(UPLOAD_DIR, { recursive: true })

    const logPath = path.join(UPLOAD_DIR, "admin_notifications.log")
    const logMessage = `[${new Date().toISOString()}] Event RSVP Update:
  User: ${userName}
  Event: ${eventTitle}
  Response: ${response === "ATTENDING" ? "Will Attend" : "Will Not Attend"}
  Reason: ${reason || "Not provided"}
---
`
    await fs.appendFile(logPath, logMessage)
    console.log(`Admin RSVP notification logged: ${logPath}`)
  } catch (error: any) {
    console.warn("Failed to write admin RSVP notification log (non-critical):", error)
  }
}

import { EVENT_CATEGORIES } from "@/lib/constants/event-categories"

export async function createEvent(data: {
  title: string
  description: string
  eventDate: string
  endDate?: string
  location: string
  venue?: string
  isVirtual?: boolean | string
  meetingLink?: string
  featured?: boolean | string
  bannerImage?: string
  status?: string
  category: string
}) {
  try {
    const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    // Basic category validation: must be non-empty
    if (!data.category || !data.category.trim()) {
      return { success: false, error: "Category is required" }
    }

    const slug = generateSlug(data.title)
    const isVirtual = typeof data.isVirtual === "string" ? data.isVirtual === "true" : data.isVirtual
    const featured = typeof data.featured === "string" ? data.featured === "true" : data.featured

    const event = await prisma.event.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        eventDate: new Date(data.eventDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        location: data.location,
        venue: data.venue,
        isVirtual: isVirtual || false,
        meetingLink: data.meetingLink,
        featured: featured || false,
        bannerImage: data.bannerImage,
        status: (data.status as any) || "UPCOMING",
        category: data.category,
        createdById: session.user.id,
      },
    })

    // Publish real-time event creation via Ably
    try {
      const payload: EventUpdatePayload = {
        eventId: event.id,
        type: "update",
        data: {
          action: "created",
          title: event.title,
          eventDate: event.eventDate.toISOString(),
        },
        timestamp: new Date().toISOString(),
      }
      await publishToAblyChannel({
        channelName: ABLY_CHANNELS.EVENT(event.id),
        eventName: ABLY_EVENTS.EVENT_UPDATE,
        data: payload,
      })
    } catch (ablyError) {
      console.warn("Failed to publish event creation to Ably:", ablyError)
    }

    // Send notifications to all users about the new event
    try {
      await notifyAllUsersAboutEvent(event.id, event.title, event.eventDate)
      console.log("[Server Action] createEvent notifications sent")
    } catch (notifError) {
      // Don't fail event creation if notifications fail
      console.warn("Failed to send event notifications:", notifError)
    }

    revalidatePath("/admin/events")
    revalidatePath("/dashboard/events")
    revalidatePath("/") // Revalidate landing page
    return { success: true, event }
  } catch (error: any) {
    console.error("Error creating event:", error)
    return { success: false, error: error.message || "Failed to create event" }
  }
}

export async function updateEvent(
  id: string,
  data: {
    title?: string
    description?: string
    eventDate?: string
    endDate?: string
    location?: string
    venue?: string
    isVirtual?: boolean | string
    meetingLink?: string
    featured?: boolean | string
    bannerImage?: string
    status?: string
    category?: string
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
    if (data.description !== undefined) updateData.description = data.description
    if (data.eventDate !== undefined) updateData.eventDate = new Date(data.eventDate)
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null
    if (data.location !== undefined) updateData.location = data.location
    if (data.venue !== undefined) updateData.venue = data.venue
    if (data.isVirtual !== undefined)
      updateData.isVirtual = typeof data.isVirtual === "string" ? data.isVirtual === "true" : data.isVirtual
    if (data.meetingLink !== undefined) updateData.meetingLink = data.meetingLink
    if (data.featured !== undefined)
      updateData.featured = typeof data.featured === "string" ? data.featured === "true" : data.featured
    if (data.bannerImage !== undefined) updateData.bannerImage = data.bannerImage
    if (data.status !== undefined) updateData.status = data.status
    if (data.category !== undefined) updateData.category = data.category

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/admin/events")
    revalidatePath("/dashboard/events")
    revalidatePath("/") // Revalidate landing page
    return { success: true, event }
  } catch (error: any) {
    console.error("Error updating event:", error)
    return { success: false, error: error.message || "Failed to update event" }
  }
}

export async function deleteEvent(id: string) {
  try {
    const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    await prisma.event.delete({
      where: { id },
    })

    revalidatePath("/admin/events")
    revalidatePath("/dashboard/events")
    revalidatePath("/") // Revalidate landing page
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting event:", error)
    return { success: false, error: error.message || "Failed to delete event" }
  }
}
