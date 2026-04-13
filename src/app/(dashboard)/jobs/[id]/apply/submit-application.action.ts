"use server"

import { mkdir, writeFile } from "fs/promises"
import path from "path"
import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "applications")

function uniqueFileName(original: string) {
  const ext = path.extname(original)
  const base = path.basename(original, ext).replace(/[^a-z0-9-_]+/gi, "-")
  const id = crypto.randomBytes(6).toString("hex")
  return `${base}-${Date.now()}-${id}${ext}`
}

export async function submitApplicationAction(fd: FormData) {
  try {
    const session = await auth()
    if (!session) {
      return { ok: false, message: "Unauthorized. Please log in to apply." }
    }

    // Ensure upload directory exists
    try {
      await mkdir(UPLOAD_DIR, { recursive: true })
      console.log(`Upload directory ready: ${UPLOAD_DIR}`)
    } catch (dirError: any) {
      console.error("Error creating upload directory:", dirError)
      // Continue anyway - directory might already exist
      if (dirError.code !== "EEXIST") {
        return { 
          ok: false, 
          message: `Failed to create upload directory: ${dirError.message}. Please check file permissions.` 
        }
      }
    }

    const jobId = String(fd.get("jobId") || "")
    const coverLetter = String(fd.get("coverLetter") || "")
    const resume = fd.get("resume")

    if (!jobId) {
      return { ok: false, message: "Job ID is required." }
    }

    if (!(resume instanceof File)) {
      return { ok: false, message: "Invalid resume file. Please select a file to upload." }
    }

    if (resume.size === 0) {
      return { ok: false, message: "The selected file is empty. Please choose a valid resume file." }
    }

    // Validate file type (also check by extension as fallback)
    const allowedMimeTypes = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ])
    
    const allowedExtensions = [".pdf", ".doc", ".docx"]
    const fileExtension = path.extname(resume.name).toLowerCase()
    
    if (!allowedMimeTypes.has(resume.type) && !allowedExtensions.includes(fileExtension)) {
      return { 
        ok: false, 
        message: `Unsupported file format. Please upload PDF, DOC, or DOCX. (Received: ${resume.type || fileExtension})` 
      }
    }

    // Validate file size (10MB limit)
    if (resume.size > 10 * 1024 * 1024) {
      return { 
        ok: false, 
        message: `Resume exceeds 10MB limit. File size: ${(resume.size / 1024 / 1024).toFixed(2)}MB` 
      }
    }

    // Check if job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        company: true,
        isActive: true,
      },
    })

    if (!job) {
      return { ok: false, message: "Job not found." }
    }

    if (!job.isActive) {
      return { ok: false, message: "This job is no longer accepting applications." }
    }

    // Check if already applied
    const existing = await prisma.jobApplication.findUnique({
      where: {
        jobId_applicantId: {
          jobId,
          applicantId: session.user.id,
        },
      },
    })

    if (existing) {
      return { ok: false, message: "You have already applied for this job." }
    }

    // Write resume file locally
    const fileName = uniqueFileName(resume.name)
    const buffer = Buffer.from(await resume.arrayBuffer())
    const filePath = path.join(UPLOAD_DIR, fileName)
    
    try {
      await writeFile(filePath, buffer)
      console.log(`Resume file saved: ${filePath}`)
    } catch (writeError: any) {
      console.error("Error writing resume file:", writeError)
      return { 
        ok: false, 
        message: `Failed to save resume file: ${writeError.message}. Please check file permissions.` 
      }
    }

    // Get public URL path (relative to public folder)
    const resumeUrl = `/uploads/applications/${fileName}`

    // Save application to database
    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        applicantId: session.user.id,
        resumeUrl,
        coverLetter: coverLetter || null,
        status: "NEW",
      },
    })

    // Update job applicants count
    const count = await prisma.jobApplication.count({
      where: { jobId },
    })

    await prisma.job.update({
      where: { id: jobId },
      data: { applicantsCount: count },
    })

    // Save application metadata locally (optional, for backup)
    try {
      const metaPath = path.join(UPLOAD_DIR, `${fileName}.json`)
      const meta = {
        applicationId: application.id,
        jobId,
        jobTitle: job.title,
        jobCompany: job.company,
        applicantId: session.user.id,
        applicantName: session.user.name,
        applicantEmail: session.user.email,
        file: fileName,
        coverLetter,
        timestamp: new Date().toISOString(),
      }
      await writeFile(metaPath, JSON.stringify(meta, null, 2))
      console.log(`Metadata saved: ${metaPath}`)
    } catch (metaError: any) {
      console.warn("Failed to save metadata (non-critical):", metaError)
      // Continue even if metadata save fails
    }

    // Notify admin (append to simple local log file)
    try {
      const logPath = path.join(UPLOAD_DIR, "admin_notifications.log")
      const logMessage = `[${new Date().toISOString()}] New application submitted:
  Application ID: ${application.id}
  Job: ${job.title} (${job.company}) - ID: ${jobId}
  Applicant: ${session.user.name} (${session.user.email})
  Resume: ${fileName}
  Cover Letter: ${coverLetter ? "Yes" : "No"}
  Status: NEW
---
`
      await writeFile(logPath, logMessage, { flag: "a" })
      console.log(`Admin notification logged: ${logPath}`)
    } catch (logError: any) {
      console.warn("Failed to write admin notification log (non-critical):", logError)
      // Continue even if log write fails
    }

    revalidatePath(`/jobs/${jobId}`)
    revalidatePath("/jobs")
    revalidatePath("/admin/jobs")

    console.log(`Application submitted successfully: ${application.id}`)
    return { ok: true, message: "Application submitted successfully! Admin has been notified." }
  } catch (error: any) {
    console.error("Error submitting application:", error)
    console.error("Error stack:", error.stack)
    
    // Provide more detailed error messages
    let errorMessage = "Failed to submit application. Please try again."
    
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

