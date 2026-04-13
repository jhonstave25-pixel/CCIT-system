"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface Attendee {
  id: string
  userId: string
  eventId: string
  status: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

export default function AttendeesList({ eventId }: { eventId: string }) {
  const [data, setData] = useState<Attendee[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAttendees() {
      try {
        setLoading(true)
        const res = await fetch(`/api/admin/events/${eventId}/attendees`)
        if (!res.ok) {
          throw new Error("Failed to load attendees")
        }
        const attendees = await res.json()
        setData(attendees)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load attendees")
      } finally {
        setLoading(false)
      }
    }

    fetchAttendees()
  }, [eventId])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-white/60" />
        <span className="ml-2 text-white/60">Loading attendees...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20">
        <CardContent className="p-6">
          <p className="text-red-400">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20">
        <CardContent className="p-6 text-center">
          <p className="text-white/60">No RSVPs yet for this event</p>
        </CardContent>
      </Card>
    )
  }

  const attending = data.filter((a) => a.status === "CONFIRMED")
  const notAttending = data.filter((a) => a.status === "DECLINED")

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Attending ({attending.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
          {attending.length > 0 ? (
            attending.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {a.user.image ? (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={a.user.image} alt={a.user.name || a.user.email} />
                      <AvatarFallback className="bg-indigo-500/40 text-white text-xs">
                        {getInitials(a.user.name, a.user.email)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 shrink-0 rounded-full bg-indigo-500/40 flex items-center justify-center text-white text-xs font-semibold">
                      {getInitials(a.user.name, a.user.email)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {a.user.name || a.user.email}
                    </p>
                    {a.user.name && (
                      <p className="text-xs text-white/60 truncate">{a.user.email}</p>
                    )}
                  </div>
                </div>
                <Badge className="bg-green-500/20 border-green-400/30 text-green-300 shrink-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Attending
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-white/60 text-sm text-center py-4">No attendees yet</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <XCircle className="w-5 h-5 text-orange-400" />
            Not Attending ({notAttending.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
          {notAttending.length > 0 ? (
            notAttending.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {a.user.image ? (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={a.user.image} alt={a.user.name || a.user.email} />
                      <AvatarFallback className="bg-orange-500/40 text-white text-xs">
                        {getInitials(a.user.name, a.user.email)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-8 w-8 shrink-0 rounded-full bg-orange-500/40 flex items-center justify-center text-white text-xs font-semibold">
                      {getInitials(a.user.name, a.user.email)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {a.user.name || a.user.email}
                    </p>
                    {a.user.name && (
                      <p className="text-xs text-white/60 truncate">{a.user.email}</p>
                    )}
                  </div>
                </div>
                <Badge className="bg-orange-500/20 border-orange-400/30 text-orange-300 shrink-0">
                  <XCircle className="w-3 h-3 mr-1" />
                  Not Attending
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-white/60 text-sm text-center py-4">No declines yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}



