"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import { sendAccountApprovedEmail } from "@/lib/email"
import { auth } from "@/lib/auth"

// Get all account requests with optional status filter
export async function getAccountRequests(status?: "PENDING" | "APPROVED" | "REJECTED") {
  try {
    const where = status ? { status } : {}
    
    const requests = await prisma.accountRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        admin: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return { success: true, requests }
  } catch (error) {
    console.error("Error fetching account requests:", error)
    return { success: false, error: "Failed to fetch account requests" }
  }
}

// Approve account request - marks as approved for manual account creation
export async function approveAccountRequest(requestId: string) {
  try {
    // Check if admin is authenticated
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return { success: false, error: "Unauthorized" }
    }

    // Get the account request
    const request = await prisma.accountRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      return { success: false, error: "Account request not found" }
    }

    if (request.status !== "PENDING") {
      return { success: false, error: "This request has already been processed" }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: request.email },
    })

    if (existingUser) {
      return { success: false, error: "A user with this email already exists" }
    }

    // Update the account request status to APPROVED
    await prisma.accountRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        processedAt: new Date(),
        processedBy: session.user.id,
      },
    })

    revalidatePath("/admin/users")
    
    return { 
      success: true, 
      message: "Request approved. You can now create the user account.",
      request: {
        id: request.id,
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        contactNumber: request.contactNumber,
      }
    }
  } catch (error) {
    console.error("Error approving account request:", error)
    return { success: false, error: "Failed to approve account request" }
  }
}

// Reject account request
export async function rejectAccountRequest(
  requestId: string,
  notes?: string
) {
  try {
    // Check if admin is authenticated
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
      return { success: false, error: "Unauthorized" }
    }

    // Get the account request
    const request = await prisma.accountRequest.findUnique({
      where: { id: requestId },
    })

    if (!request) {
      return { success: false, error: "Account request not found" }
    }

    if (request.status !== "PENDING") {
      return { success: false, error: "This request has already been processed" }
    }

    // Update the account request status
    await prisma.accountRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        processedAt: new Date(),
        processedBy: session.user.id,
        notes: notes || null,
      },
    })

    revalidatePath("/admin/account-requests")
    
    return { success: true, message: "Request rejected successfully" }
  } catch (error) {
    console.error("Error rejecting account request:", error)
    return { success: false, error: "Failed to reject account request" }
  }
}

// Get account request statistics
export async function getAccountRequestStats() {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      prisma.accountRequest.count({ where: { status: "PENDING" } }),
      prisma.accountRequest.count({ where: { status: "APPROVED" } }),
      prisma.accountRequest.count({ where: { status: "REJECTED" } }),
      prisma.accountRequest.count(),
    ])

    return {
      success: true,
      stats: { pending, approved, rejected, total },
    }
  } catch (error) {
    console.error("Error fetching account request stats:", error)
    return { success: false, error: "Failed to fetch statistics" }
  }
}
