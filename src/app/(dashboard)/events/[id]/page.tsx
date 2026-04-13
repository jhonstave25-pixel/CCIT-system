import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, MapPin, Clock, Users, ArrowLeft, Video } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { EventDetailClient } from "@/components/alumni/event-detail-client"

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const { id } = await params

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      registrations: {
        where: {
          userId: session.user.id,
        },
      },
      _count: {
        select: {
          registrations: {
            where: {
              status: "CONFIRMED",
            },
          },
        },
      },
    },
  })

  if (!event) {
    notFound()
  }

  const userRegistration = event.registrations[0]
  const isRegistered = userRegistration?.status === "CONFIRMED"
  const hasDeclined = userRegistration?.status === "DECLINED"

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-500/20 border-blue-300/30 text-blue-200"
      case "ONGOING":
        return "bg-green-500/20 border-green-300/30 text-green-200"
      case "COMPLETED":
        return "bg-gray-500/20 border-gray-300/30 text-gray-200"
      case "CANCELLED":
        return "bg-red-500/20 border-red-300/30 text-red-200"
      default:
        return "bg-white/10 border-white/20 text-white/80"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white pt-16 sm:pt-20 p-6 md:p-10 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <Link href="/events">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
        </Link>

        {/* Event Details Card */}
        <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <CardTitle className="text-2xl font-bold">{event.title}</CardTitle>
                  <Badge className={getStatusColor(event.status)}>{event.status}</Badge>
                </div>
                {event.category && (
                  <Badge variant="outline" className="mb-2 border-white/20 text-white/70">
                    {event.category}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                <span>{format(new Date(event.eventDate), "PPP 'at' p")}</span>
              </div>
              {event.endDate && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Ends: {format(new Date(event.endDate), "PPP 'at' p")}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
              {event.isVirtual && event.meetingLink && (
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  <a
                    href={event.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-300 hover:text-indigo-200 underline"
                  >
                    Join Virtual Event
                  </a>
                </div>
              )}
              {event.capacity && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    {event._count.registrations} / {event.capacity} attendees
                  </span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {event.description && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-white/80 whitespace-pre-wrap leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* RSVP Section */}
            <EventDetailClient
              eventId={event.id}
              isRegistered={isRegistered}
              hasDeclined={hasDeclined}
              eventDate={event.eventDate}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



