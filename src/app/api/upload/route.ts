import { NextResponse } from "next/server"
import { uploadToLocal } from "@/lib/local-storage"

// Ensure Node runtime for file uploads (Edge runtime ignores bodySizeLimit)
export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const subdirectory = (formData.get("subdirectory") as string) || "gallery"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const url = await uploadToLocal(file, subdirectory)

    return NextResponse.json({ url })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    )
  }
}

