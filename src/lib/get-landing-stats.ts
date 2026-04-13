import { prisma } from "@/lib/prisma"

export async function getLandingStats() {
  const [alumniCount, eventsCount, jobsCount] = await Promise.all([
    prisma.user.count({ where: { role: "ALUMNI" } }),
    prisma.event.count(),
    prisma.job.count({
      where: {
        isActive: true,
        archived: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    }),
  ])

  return {
    alumni: alumniCount,
    events: eventsCount,
    jobs: jobsCount,
  }
}



