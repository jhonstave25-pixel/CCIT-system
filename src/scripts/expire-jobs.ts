import { prisma } from "@/lib/prisma"

export async function expireOldJobs() {
  try {
    const now = new Date()
    
    // Find jobs that should be expired
    const expiredJobs = await prisma.job.updateMany({
      where: {
        expiresAt: {
          lt: now,
        },
        status: {
          in: ["PUBLISHED", "PAUSED"],
        },
        archived: false,
      },
      data: {
        status: "EXPIRED",
      },
    })

    console.log(`Expired ${expiredJobs.count} jobs.`)
    return { success: true, count: expiredJobs.count }
  } catch (error: any) {
    console.error("Error expiring jobs:", error)
    return { success: false, error: error.message }
  }
}

// Run this function via cron or scheduled task
if (require.main === module) {
  expireOldJobs()
    .then((result) => {
      console.log("Job expiry completed:", result)
      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error("Fatal error:", error)
      process.exit(1)
    })
}


