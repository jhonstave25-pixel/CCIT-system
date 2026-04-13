"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { publishToAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"
import { notifyAllUsersAboutJob } from "@/lib/notifications"
import type { JobUpdatePayload } from "@/lib/ably/types"

export async function createJob(data: {
  title: string
  company: string
  description: string
  requirements?: string
  location: string
  isRemote?: boolean | string
  jobType: string
  salaryRange?: string
  applicationUrl?: string
  applicationEmail?: string
  featured?: boolean | string
  isActive?: boolean | string
  status?: string
  expiresAt?: string
  attachments?: Array<{ url: string; name: string; type: string; size: number }>
}) {
  try {
    console.log("[Server Action] createJob started")
    const session = await auth()
    console.log("[Server Action] createJob auth result:", { hasSession: !!session, role: session?.user?.role })
  if (!session || session.user.role !== "ADMIN") {
      console.log("[Server Action] createJob unauthorized")
      return { success: false, error: "Unauthorized" }
    }

    // Convert string booleans to actual booleans
    const isRemote = typeof data.isRemote === "string" ? data.isRemote === "true" : data.isRemote
    const featured = typeof data.featured === "string" ? data.featured === "true" : data.featured
    const isActive = typeof data.isActive === "string" ? data.isActive === "true" : (data.isActive ?? true)
    const status = (data.status as any) || "DRAFT"

    console.log("[Server Action] createJob creating job with data:", { title: data.title, company: data.company })
    const job = await prisma.job.create({
      data: {
        title: data.title,
        company: data.company,
        description: data.description,
        requirements: data.requirements || "",
        location: data.location,
        isRemote: isRemote || false,
        jobType: data.jobType as any,
        status: status,
        salaryRange: data.salaryRange,
        applicationUrl: data.applicationUrl,
        applicationEmail: data.applicationEmail,
        featured: featured || false,
        isActive,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        postedById: session.user.id,
        attachments: data.attachments
          ? {
              create: data.attachments.map((att) => ({
                url: att.url,
                name: att.name,
                mime: att.type || "application/octet-stream",
                size: att.size,
              })),
            }
          : undefined,
      },
    })

    revalidatePath("/admin/jobs")
    revalidatePath("/admin")
    revalidatePath("/dashboard/jobs")
    revalidatePath("/") // Revalidate landing page
    revalidateTag("admin-analytics")

    // Publish real-time update via Ably
    try {
      const payload: JobUpdatePayload = {
        id: job.id,
        type: "posted",
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        timestamp: new Date().toISOString(),
      }
      await publishToAblyChannel({
        channelName: ABLY_CHANNELS.JOBS_ACTIVE,
        eventName: ABLY_EVENTS.JOB_POSTED,
        data: payload,
      })
    } catch (ablyError) {
      // Don't fail job creation if Ably publish fails
      console.warn("Failed to publish job update to Ably:", ablyError)
    }

    // Send notifications to all alumni users
    try {
      await notifyAllUsersAboutJob(job.id, job.title, job.company)
      console.log("[Server Action] createJob notifications sent")
    } catch (notifError) {
      // Don't fail job creation if notifications fail
      console.warn("Failed to send job notifications:", notifError)
    }

    return { success: true, job }
  } catch (error: any) {
    console.error("[Server Action] createJob error:", error)
    return { success: false, error: error.message || "Failed to create job" }
  }
}

export async function applyForJob(data: {
  jobId: string
  resumeUrl: string
  coverLetter?: string
}) {
  try {
    const session = await auth()
    if (!session) {
      return { success: false, error: "Unauthorized - Please log in" }
    }

    // Validate input
    if (!data.jobId) {
      return { success: false, error: "Job ID is required" }
    }
    if (!data.resumeUrl) {
      return { success: false, error: "Resume is required" }
    }

    // Check if job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
    })

    if (!job) {
      return { success: false, error: "Job not found" }
    }

    if (!job.isActive) {
      return { success: false, error: "This job is no longer accepting applications" }
    }

    // Check if already applied
    const existing = await prisma.jobApplication.findUnique({
      where: {
        jobId_applicantId: {
          jobId: data.jobId,
          applicantId: session.user.id,
        },
      },
    })

    if (existing) {
      return { success: false, error: "You have already applied for this job" }
    }

    // Create application
    const application = await prisma.jobApplication.create({
      data: {
        jobId: data.jobId,
        applicantId: session.user.id,
        resumeUrl: data.resumeUrl,
        coverLetter: data.coverLetter || null,
        status: "NEW",
      },
      include: {
        applicant: {
          select: {
            name: true,
            email: true,
          },
        },
        job: {
          select: {
            title: true,
            company: true,
            postedById: true,
          },
        },
      },
    })

    // Update job applicants count
    const count = await prisma.jobApplication.count({
      where: { jobId: data.jobId },
    })

    await prisma.job.update({
      where: { id: data.jobId },
      data: { applicantsCount: count },
    })

    // Publish real-time update to job poster
    if (application.job.postedById) {
      try {
        const payload: JobUpdatePayload = {
          id: application.id,
          type: "application",
          jobId: application.jobId,
          jobTitle: application.job.title,
          company: application.job.company,
          userId: session.user.id,
          timestamp: new Date().toISOString(),
        }
        await publishToAblyChannel({
          channelName: ABLY_CHANNELS.JOBS_APPLICATION(application.job.postedById),
          eventName: ABLY_EVENTS.JOB_APPLICATION,
          data: payload,
        })
      } catch (ablyError) {
        console.warn("Failed to publish job application to Ably:", ablyError)
      }
    }

    revalidatePath(`/jobs/${data.jobId}`)
    revalidatePath("/jobs")
    return { success: true, application }
  } catch (error: any) {
    console.error("Error applying for job:", error)
    return { success: false, error: error.message || "Failed to submit application" }
  }
}

export async function updateJob(
  id: string,
  data: {
    title?: string
    company?: string
    description?: string
    requirements?: string
    location?: string
    isRemote?: boolean | string
    jobType?: string
    status?: string
    salaryRange?: string
    applicationUrl?: string
    applicationEmail?: string
    featured?: boolean | string
    isActive?: boolean | string
    expiresAt?: string
  }
) {
  try {
    const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.company !== undefined) updateData.company = data.company
    if (data.description !== undefined) updateData.description = data.description
    if (data.requirements !== undefined) updateData.requirements = data.requirements
    if (data.location !== undefined) updateData.location = data.location
    if (data.isRemote !== undefined)
      updateData.isRemote = typeof data.isRemote === "string" ? data.isRemote === "true" : data.isRemote
    if (data.jobType !== undefined) updateData.jobType = data.jobType
    if (data.status !== undefined) updateData.status = data.status as any
    if (data.salaryRange !== undefined) updateData.salaryRange = data.salaryRange
    if (data.applicationUrl !== undefined) updateData.applicationUrl = data.applicationUrl
    if (data.applicationEmail !== undefined) updateData.applicationEmail = data.applicationEmail
    if (data.featured !== undefined)
      updateData.featured = typeof data.featured === "string" ? data.featured === "true" : data.featured
    if (data.isActive !== undefined)
      updateData.isActive = typeof data.isActive === "string" ? data.isActive === "true" : data.isActive
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
    })

    revalidatePath("/admin/jobs")
    revalidatePath("/admin")
    revalidatePath("/jobs")
    revalidatePath(`/jobs/${id}`)
    revalidatePath("/") // Revalidate landing page
    revalidateTag("admin-analytics")

    // Publish real-time update via Ably
    try {
      const payload: JobUpdatePayload = {
        id: job.id,
        type: "updated",
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        timestamp: new Date().toISOString(),
      }
      await publishToAblyChannel({
        channelName: ABLY_CHANNELS.JOBS_ACTIVE,
        eventName: ABLY_EVENTS.JOB_UPDATED,
        data: payload,
      })
    } catch (ablyError) {
      console.warn("Failed to publish job update to Ably:", ablyError)
    }

    return { success: true, job }
  } catch (error: any) {
    console.error("Error updating job:", error)
    return { success: false, error: error.message || "Failed to update job" }
  }
}

export async function deleteJob(id: string) {
  try {
    const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    // Get job info before deletion for Ably notification
    const job = await prisma.job.findUnique({
      where: { id },
      select: { id: true, title: true, company: true },
    })

    await prisma.job.delete({
      where: { id },
    })

    // Publish real-time update via Ably
    if (job) {
      try {
        const payload: JobUpdatePayload = {
          id: job.id,
          type: "updated",
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          status: "DELETED",
          timestamp: new Date().toISOString(),
        }
        await publishToAblyChannel({
          channelName: ABLY_CHANNELS.JOBS_ACTIVE,
          eventName: ABLY_EVENTS.JOB_UPDATED,
          data: payload,
        })
      } catch (ablyError) {
        console.warn("Failed to publish job deletion to Ably:", ablyError)
      }
    }

    revalidatePath("/admin/jobs")
    revalidatePath("/admin")
    revalidatePath("/jobs")
    revalidatePath("/") // Revalidate landing page
    revalidateTag("admin-analytics")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting job:", error)
    return { success: false, error: error.message || "Failed to delete job" }
  }
}
