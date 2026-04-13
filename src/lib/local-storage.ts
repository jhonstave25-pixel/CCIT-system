/**
 * Local file storage utility for file uploads
 * Stores files in the public/uploads directory
 */

import { mkdir, writeFile } from "fs/promises"
import path from "path"
import crypto from "crypto"

const UPLOAD_BASE_DIR = path.join(process.cwd(), "public", "uploads")

function uniqueFileName(original: string): string {
  const ext = path.extname(original) || ".jpg"
  const base = path.basename(original, ext).replace(/[^a-z0-9-_]+/gi, "-")
  const id = crypto.randomBytes(6).toString("hex")
  return `${base}-${Date.now()}-${id}${ext}`
}

/**
 * Upload a file to local storage
 * @param file - The file to upload
 * @param subdirectory - Subdirectory within uploads (e.g., "gallery", "profile")
 * @returns The public URL path of the uploaded file
 */
export async function uploadToLocal(
  file: File,
  subdirectory: string = "gallery"
): Promise<string> {
  try {
    // Ensure upload directory exists
    const uploadDir = path.join(UPLOAD_BASE_DIR, subdirectory)
    await mkdir(uploadDir, { recursive: true })

    // Validate file type (images and documents)
    const allowedTypes = [
      "image/",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    const isAllowed = allowedTypes.some(type => 
      type === "image/" ? file.type.startsWith("image/") : file.type === type
    )
    if (!isAllowed) {
      throw new Error("Invalid file type. Please upload an image, PDF, or DOC file.")
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      throw new Error(
        `File exceeds 10MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      )
    }

    // Generate unique filename
    const fileName = uniqueFileName(file.name)
    const buffer = Buffer.from(await file.arrayBuffer())
    const filePath = path.join(uploadDir, fileName)

    // Write file to disk
    await writeFile(filePath, buffer)

    // Return public URL path (relative to public folder)
    return `/uploads/${subdirectory}/${fileName}`
  } catch (error: any) {
    console.error("Local upload error:", error)
    throw new Error(error.message || "Failed to upload file")
  }
}

/**
 * Upload multiple files to local storage
 * @param files - Array of files to upload
 * @param subdirectory - Subdirectory within uploads
 * @returns Array of public URL paths
 */
export async function uploadMultipleToLocal(
  files: File[],
  subdirectory: string = "gallery"
): Promise<string[]> {
  const uploads = await Promise.all(
    files.map((file) => uploadToLocal(file, subdirectory))
  )
  return uploads
}


