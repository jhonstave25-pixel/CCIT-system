"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/lib/auth"
import { publishToAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"
import type { JobUpdatePayload } from "@/lib/ably/types"

export async function updateApplicantStatus(
  applicantId: string,
  status: "NEW" | "SHORTLISTED" | "INTERVIEW" | "HIRED" | "REJECTED"
) {
  try {
    const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
      return { success: false, error: "Unauthorized" }
    }

    const application = await prisma.jobApplication.update({
      where: { id: applicantId },
      data: { status },
      include: {
        job: true,
      },
    })

    // Update job applicants count
    const count = await prisma.jobApplication.count({
      where: { jobId: application.jobId },
    })

    await prisma.job.update({
      where: { id: application.jobId },
      data: { applicantsCount: count },
    })

    // Publish real-time update to applicant
    try {
      const payload: JobUpdatePayload = {
        id: application.id,
        type: "status",
        jobId: application.jobId,
        jobTitle: application.job.title,
        company: application.job.company,
        userId: application.applicantId,
        status,
        timestamp: new Date().toISOString(),
      }
      await publishToAblyChannel({
        channelName: ABLY_CHANNELS.JOBS_APPLICATION(application.applicantId),
        eventName: ABLY_EVENTS.JOB_STATUS,
        data: payload,
      })
    } catch (ablyError) {
      console.warn("Failed to publish applicant status update to Ably:", ablyError)
    }

    revalidatePath("/admin/jobs")
    revalidatePath(`/admin/jobs/${application.jobId}`)
    revalidateTag("admin-analytics")

    return { success: true, application }
  } catch (error: any) {
    console.error("Error updating applicant status:", error)
    return { success: false, error: error.message || "Failed to update applicant status" }
  }
}


