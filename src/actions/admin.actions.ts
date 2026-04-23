"use server"

import { prisma } from "@/lib/prisma"
import { sendAccountApprovedEmail } from "@/lib/email"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { publishToAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"

export async function createUser(data: {
  name: string
  email: string
  role: "ALUMNI" | "FACULTY" | "ADMIN"
}) {
  try {
    const session = await auth()

    // Only ADMIN can create user accounts
    if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Only Admin can create user accounts." }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    })

    if (existingUser) {
      return { success: false, error: "User already exists" }
    }

    // Generate a random password for the user
    const generatedPassword = generateRandomPassword()
    const hashedPassword = await bcrypt.hash(generatedPassword, 10)

    // Create user with generated password
    // Set status to PENDING for FACULTY role, null for others
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        password: hashedPassword,
        role: data.role,
        status: data.role === "FACULTY" ? "PENDING" : null,
        emailVerified: new Date(), // Auto-verify admin-created users
      },
      include: {
        profile: true,
      },
    })

    // Audit log: Log user creation
    console.log(`[AUDIT] User created by Admin:`, {
      actorId: session.user.id,
      actorEmail: session.user.email,
      createdUserId: user.id,
      createdUserEmail: user.email,
      roleAssigned: user.role,
      timestamp: new Date().toISOString(),
    })

    // Send account approved email with login credentials
    await sendAccountApprovedEmail(data.email.toLowerCase(), data.name, generatedPassword)

    // Publish real-time user creation event
    try {
      await publishToAblyChannel({
        channelName: ABLY_CHANNELS.USERS_UPDATE,
        eventName: ABLY_EVENTS.USER_CREATED,
        data: {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          userStatus: user.userStatus || "UNVERIFIED",
          status: user.status,
          createdAt: user.createdAt.toISOString(),
          profile: user.profile,
        },
      })
    } catch (ablyError) {
      console.warn("Failed to publish user creation event to Ably:", ablyError)
      // Don't fail the request if Ably fails
    }

    revalidatePath("/admin/users")
    // Revalidate landing page if creating an alumni user
    if (data.role === "ALUMNI") {
      revalidatePath("/")
    }
    return { success: true, user }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, error: "Failed to create user" }
  }
}

export async function updateUserRole(userId: string, role: "ALUMNI" | "FACULTY" | "ADMIN") {
  try {
    // If changing to FACULTY, set status to PENDING; if changing away from FACULTY, set status to null
    const updateData: any = { role }
    if (role === "FACULTY") {
      updateData.status = "PENDING"
    } else {
      updateData.status = null
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    revalidatePath("/admin/users")
    // Revalidate landing page if role changed to/from ALUMNI
    revalidatePath("/")
    return { success: true, user }
  } catch (error) {
    return { success: false, error: "Failed to update user role" }
  }
}

export async function deleteUser(userId: string) {
  try {
    await prisma.user.delete({
      where: { id: userId },
    })

    revalidatePath("/admin/users")
    // Revalidate landing page in case an alumni was deleted
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to delete user" }
  }
}

// Helper function to generate a random password
function generateRandomPassword(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

