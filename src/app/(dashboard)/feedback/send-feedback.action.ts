"use server"

import { mkdir, writeFile } from "fs/promises"
import path from "path"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

const FEEDBACK_DIR = path.join(process.cwd(), "public", "uploads", "feedback")

export async function sendFeedbackAction(fd: FormData) {
  try {
    const session = await auth()
    const userId = session?.user?.id || null

    const message = String(fd.get("message") || "").trim()
    const photo = fd.get("photo") as File | null

    if (!message) {
      return { ok: false, message: "Message cannot be empty." }
    }

    let photoUrl: string | null = null

    // Handle photo upload if provided (store locally, save URL in DB)
    if (photo && photo instanceof File && photo.size > 0) {
      // Validate file type
      if (!photo.type.startsWith("image/")) {
        return { ok: false, message: "Invalid file type. Please upload an image." }
      }

      // Validate file size (5MB limit)
      if (photo.size > 5 * 1024 * 1024) {
        return { 
          ok: false, 
          message: `Image exceeds 5MB limit. File size: ${(photo.size / 1024 / 1024).toFixed(2)}MB` 
        }
      }

      try {
        // Ensure feedback directory exists
        await mkdir(FEEDBACK_DIR, { recursive: true })

        // Generate unique filename
        const ext = path.extname(photo.name) || ".jpg"
        const name = `fb-${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`
        const buffer = Buffer.from(await photo.arrayBuffer())
        const filePath = path.join(FEEDBACK_DIR, name)
        
        // Save image locally
        await writeFile(filePath, buffer)
        console.log(`Feedback photo saved locally: ${filePath}`)
        
        // Store only the URL path in database
        photoUrl = `/uploads/feedback/${name}`
      } catch (photoError: any) {
        console.error("Error saving feedback photo:", photoError)
        return { 
          ok: false, 
          message: `Failed to save photo: ${photoError.message}. Please try again without a photo.` 
        }
      }
    }

    // Save feedback in Prisma ORM (only image URL stored, image file is local)
    try {
      // Check if Feedback model exists in Prisma client
      if (!prisma.feedback) {
        console.error("Feedback model not found in Prisma client. Please run: npx prisma generate")
        return { 
          ok: false, 
          message: "Feedback model not available. Please run 'npx prisma generate' to regenerate the Prisma client." 
        }
      }

      // Get user name if userId exists
      let userName: string | null = null
      if (userId) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true },
          })
          if (user) {
            userName = user.name || user.email || null
          }
        } catch (userError) {
          // If we can't get user name, continue without it
          console.warn("Could not fetch user name for feedback:", userError)
        }
      }

      // Save feedback to database
      const feedback = await prisma.feedback.create({
        data: {
          userId: userId || null,
          message,
          photoUrl: photoUrl || null, // Only the URL path is stored in DB
          status: "unread",
        },
      })

      console.log(`Feedback saved to database: ${feedback.id}`)

      revalidatePath("/admin")
      revalidatePath("/dashboard")

      return { ok: true, message: "Feedback successfully stored in database." }
    } catch (dbError: any) {
      console.error("Error saving feedback to database:", dbError)
      console.error("Error details:", {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
      })
      
      // Provide helpful error message
      let errorMessage = dbError.message || "Failed to save feedback. Please try again."
      
      if (dbError.message?.includes("Unknown model") || dbError.message?.includes("does not exist") || dbError.message?.includes("Cannot read properties of undefined")) {
        errorMessage = "Feedback model not found. Please run 'npx prisma generate' and 'npx prisma migrate dev --name add_feedback_model' to set up the database."
      } else if (dbError.code === "P2002") {
        errorMessage = "A feedback with this information already exists."
      } else if (dbError.code === "P2003") {
        errorMessage = "Invalid user reference."
      }
      
      return { 
        ok: false, 
        message: errorMessage
      }
    }
  } catch (error: any) {
    console.error("Error in sendFeedbackAction:", error)
    console.error("Error stack:", error.stack)
    
    let errorMessage = "Failed to submit feedback. Please try again."
    
    if (error.message) {
      errorMessage = error.message
    } else if (error.code === "ENOENT") {
      errorMessage = "Upload directory not found. Please check server configuration."
    } else if (error.code === "EACCES" || error.code === "EPERM") {
      errorMessage = "Permission denied. Please check file system permissions."
    } else if (error.code === "ENOSPC") {
      errorMessage = "No space left on device. Please free up disk space."
    }
    
    return { ok: false, message: errorMessage }
  }
}

