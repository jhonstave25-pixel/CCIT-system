import { prisma } from "@/lib/prisma"

export async function getFacultyKPIs(userId: string) {
  // Safely get verification request count (with error handling for dev server cache issues)
  let pendingVerifications = 0
  try {
    pendingVerifications = await prisma.verificationRequest.count({
      where: { status: "PENDING" },
    })
  } catch (error: any) {
    // Handle case where Prisma client might be cached/outdated
    console.warn("Error fetching verification requests:", error?.message || error)
    pendingVerifications = 0
  }

  const [totalAlumni, verifiedAlumni, upcomingEvents, connectionsCount, unreadMessages] = await Promise.all([
    prisma.user.count({ where: { role: "ALUMNI" } }),
    prisma.alumniProfile.count({ where: { verified: true } }),
    prisma.event.count({
      where: {
        eventDate: { gte: new Date() },
        status: { in: ["UPCOMING", "ONGOING"] },
      },
    }),
    prisma.connection.count({
      where: {
        OR: [{ requesterId: userId }, { receiverId: userId }],
        status: "ACCEPTED",
      },
    }),
    prisma.chatMessage.count({
      where: {
        conversation: {
          participants: {
            some: { userId },
          },
        },
        NOT: { seenBy: { has: userId } },
        NOT: { senderId: userId },
      },
    }),
  ])

  return {
    totalAlumni,
    verifiedAlumni,
    upcomingEvents,
    connectionsCount,
    pendingVerifications,
    unreadMessages,
  }
}

