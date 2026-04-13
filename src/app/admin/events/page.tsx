import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EventsManagementClient } from "@/components/admin/events-management-client"

export default async function AdminEventsPage() {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const events = await prisma.event.findMany({
    orderBy: {
      eventDate: "desc",
    },
    include: {
      _count: {
        select: {
          registrations: true,
        },
      },
    },
    take: 100,
  })

  return <EventsManagementClient events={events} />
}
