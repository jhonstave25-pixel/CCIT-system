"use server"

import { uploadMultipleToLocal } from "@/lib/local-storage"

type Uploaded = { url: string; name: string; type: string; size: number }

/**
 * Upload multiple files to local storage
 * 
 * @param formData - FormData containing files with key "files" and optional "subdirectory"
 * @returns Array of uploaded file information
 */
export async function uploadFiles(formData: FormData, subdirectory: string = "gallery"): Promise<Uploaded[]> {
  try {
    const files = formData.getAll("files") as File[]
    // Allow subdirectory to be passed as parameter or from formData
    const uploadSubdirectory = (formData.get("subdirectory") as string) || subdirectory

    if (files.length === 0) {
      return []
    }

    // Upload all files to local storage
    const urls = await uploadMultipleToLocal(files, uploadSubdirectory)

    const uploads: Uploaded[] = files.map((file, index) => ({
      url: urls[index],
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
    }))

    return uploads
  } catch (error: any) {
    console.error("Server Action uploadFiles failed:", error)
    throw new Error(error.message || "Upload failed") // Prevents silent failure
  }
}

