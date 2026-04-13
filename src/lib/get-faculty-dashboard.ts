import { prisma } from "@/lib/prisma"

export async function getFacultyDashboardData(userId: string) {
  const [alumni, events, connections, pendingApprovals, messages] = await Promise.all([
    prisma.user.count({ where: { role: "ALUMNI" } }),
    prisma.event.count({
      where: {
        eventDate: {
          gte: new Date(),
        },
        status: {
          in: ["UPCOMING", "ONGOING"],
        },
      },
    }),
    prisma.connection.count({
      where: {
        OR: [
          { requesterId: userId },
          { receiverId: userId },
        ],
        status: "ACCEPTED",
      },
    }),
    prisma.post.count({
      where: {
        published: false,
      },
    }),
    prisma.message.count({
      where: {
        receiverId: userId,
        read: false,
      },
    }),
  ])

  return {
    alumni,
    events,
    connections,
    pendingApprovals,
    messages,
  }
}

