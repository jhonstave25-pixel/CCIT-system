"use server"

import { mkdir, writeFile } from "fs/promises"
import path from "path"
import crypto from "crypto"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

const PROFILE_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "profile")

function uniqueFileName(original: string) {
  const ext = path.extname(original) || ".jpg"
  const base = path.basename(original, ext).replace(/[^a-z0-9-_]+/gi, "-")
  const id = crypto.randomBytes(6).toString("hex")
  return `${base}-${Date.now()}-${id}${ext}`
}

export async function updateProfileImage(formData: FormData) {
  try {
    const session = await auth()
    if (!session) {
      return { success: false, error: "Unauthorized" }
    }

    // Ensure upload directory exists
    try {
      await mkdir(PROFILE_UPLOAD_DIR, { recursive: true })
      console.log(`Profile upload directory ready: ${PROFILE_UPLOAD_DIR}`)
    } catch (dirError: any) {
      console.error("Error creating profile upload directory:", dirError)
      if (dirError.code !== "EEXIST") {
        return { 
          success: false, 
          error: `Failed to create upload directory: ${dirError.message}. Please check file permissions.` 
        }
      }
    }

    const userId = session.user.id
    const profileImage = formData.get("profileImage") as File | null

    if (!profileImage || profileImage.size === 0) {
      return { success: false, error: "No image file provided" }
    }

    // Validate file type
    if (!profileImage.type.startsWith("image/")) {
      return { success: false, error: "Invalid file type. Please upload an image." }
    }

    // Validate file size (5MB limit)
    if (profileImage.size > 5 * 1024 * 1024) {
      return { 
        success: false, 
        error: `Image exceeds 5MB limit. File size: ${(profileImage.size / 1024 / 1024).toFixed(2)}MB` 
      }
    }

    // Write image file locally
    const fileName = uniqueFileName(profileImage.name)
    const buffer = Buffer.from(await profileImage.arrayBuffer())
    const filePath = path.join(PROFILE_UPLOAD_DIR, fileName)
    
    try {
      await writeFile(filePath, buffer)
      console.log(`Profile image saved: ${filePath}`)
    } catch (writeError: any) {
      console.error("Error writing profile image file:", writeError)
      return { 
        success: false, 
        error: `Failed to save image file: ${writeError.message}. Please check file permissions.` 
      }
    }

    // Get public URL path (relative to public folder)
    const imageUrl = `/uploads/profile/${fileName}`

    // Update user image in database
    await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
    })

    revalidatePath("/profile")
    revalidatePath("/dashboard")

    console.log(`Profile image updated successfully: ${imageUrl}`)
    return { success: true, imageUrl }
  } catch (error: any) {
    console.error("Error updating profile image:", error)
    console.error("Error stack:", error.stack)
    
    let errorMessage = "Failed to update profile image. Please try again."
    
    if (error.message) {
      errorMessage = error.message
    } else if (error.code === "ENOENT") {
      errorMessage = "Upload directory not found. Please check server configuration."
    } else if (error.code === "EACCES" || error.code === "EPERM") {
      errorMessage = "Permission denied. Please check file system permissions."
    } else if (error.code === "ENOSPC") {
      errorMessage = "No space left on device. Please free up disk space."
    }
    
    return { 
      success: false, 
      error: errorMessage
    }
  }
}

