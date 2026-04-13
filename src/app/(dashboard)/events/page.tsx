import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EventsClient } from "@/components/alumni/events-client"
import { prisma } from "@/lib/prisma"

export default async function EventsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const events = await prisma.event.findMany({
    orderBy: {
      eventDate: "asc",
    },
    include: {
      registrations: true,
    },
    take: 50,
  })

  return <EventsClient events={events} />
}
