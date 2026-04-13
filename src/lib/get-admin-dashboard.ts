import { prisma } from "@/lib/prisma"

export async function getAdminDashboardData() {
  const [
    alumni,
    faculty,
    jobs,
    events,
    news,
    gallery,
    applications,
    connections,
    recentUsers,
    recentEvents,
    eventRSVPs,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "ALUMNI" } }),
    prisma.user.count({ where: { role: "FACULTY" } }),
    prisma.job.count({ where: { archived: false } }),
    prisma.event.count(),
    prisma.post.count({ where: { published: true } }),
    prisma.gallery.count(),
    prisma.jobApplication.count(),
    prisma.connection.count({ where: { status: "ACCEPTED" } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    prisma.event.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        eventDate: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.eventRegistration.groupBy({
      by: ["status"],
      _count: {
        status: true,
      },
    }),
  ])

  const attendingCount = eventRSVPs.find((r) => r.status === "CONFIRMED")?._count.status || 0
  const notAttendingCount = eventRSVPs.find((r) => r.status === "DECLINED")?._count.status || 0

  return {
    alumni,
    faculty,
    jobs,
    events,
    news,
    gallery,
    applications,
    connections,
    eventRSVPs: {
      attending: attendingCount,
      notAttending: notAttendingCount,
      total: attendingCount + notAttendingCount,
    },
    recentUsers: recentUsers.map((user) => ({
      name: user.name || user.email,
      date: new Date(user.createdAt).toLocaleDateString(),
      createdAt: user.createdAt,
      role: user.role,
    })),
    recentEvents: recentEvents.map((event) => ({
      name: event.title,
      date: new Date(event.eventDate).toLocaleDateString(),
      eventDate: event.eventDate,
      createdAt: event.createdAt,
      status: event.status,
    })),
  }
}

