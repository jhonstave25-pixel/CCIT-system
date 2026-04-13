"use client"

import { useState, useTransition, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, MapPin, Clock, CheckCircle, XCircle } from "lucide-react"
// Removed framer-motion for performance - using CSS animations instead
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { registerForEvent, declineEvent } from "@/actions/event.actions"
import { useRouter } from "next/navigation"
import { useAblyChannel, ABLY_CHANNELS, ABLY_EVENTS, usePresence } from "@/lib/ably"
import type { EventUpdatePayload } from "@/lib/ably/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { Event, EventRegistration } from "@prisma/client"

interface EventsClientProps {
  events: (Event & {
    registrations: EventRegistration[]
  })[]
}

export function EventsClient({ events: initialEvents }: EventsClientProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [filter, setFilter] = useState("All")
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [declineReason, setDeclineReason] = useState("")
  const [showDeclineDialog, setShowDeclineDialog] = useState(false)
  const [events, setEvents] = useState(initialEvents)

  // Sync state with props when they change (e.g., after router.refresh())
  useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents])

  // Subscribe to real-time event updates
  // Subscribe to notifications channel for event-related updates
  useAblyChannel(
    session?.user?.id ? ABLY_CHANNELS.NOTIFICATIONS(session.user.id) : "",
    ABLY_EVENTS.NOTIFICATION_NEW,
    (notification: any) => {
      if (notification.type === "event" && notification.link) {
        // Refresh events when we get an event notification
        router.refresh()
      }
    }
  )

  const filtered = events.filter((e) => {
    const eventDate = new Date(e.eventDate)
    const now = new Date()

    if (filter === "Upcoming") return eventDate > now
    if (filter === "Past") return eventDate < now
    return true
  })

  const isRegistered = (eventId: string) => {
    if (!session?.user?.id) return false
    const registration = events
      .find((e) => e.id === eventId)
      ?.registrations.find((r) => r.userId === session.user.id)
    return registration?.status === "CONFIRMED" || false
  }

  const hasDeclined = (eventId: string) => {
    if (!session?.user?.id) return false
    const registration = events
      .find((e) => e.id === eventId)
      ?.registrations.find((r) => r.userId === session.user.id)
    return registration?.status === "DECLINED" || false
  }

  const handleAttend = (event: Event) => {
    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to register for events.",
      })
      return
    }

    // Optimistic update - immediately show "Attending" status
    setEvents((prevEvents) =>
      prevEvents.map((e) => {
        if (e.id === event.id) {
          // Check if registration already exists
          const existingReg = e.registrations.find((r) => r.userId === session.user.id)
          if (existingReg) {
            // Update existing registration
            return {
              ...e,
              registrations: e.registrations.map((r) =>
                r.userId === session.user.id
                  ? { ...r, status: "CONFIRMED" as const }
                  : r
              ),
            }
          } else {
            // Add new registration
            return {
              ...e,
              registrations: [
                ...e.registrations,
                {
                  id: `temp-${Date.now()}`,
                  userId: session.user.id,
                  eventId: event.id,
                  status: "CONFIRMED" as const,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ],
            }
          }
        }
        return e
      })
    )

    startTransition(async () => {
      const result = await registerForEvent(session.user.id, event.id)
      if (result.success) {
        toast({
          title: "Registration Successful",
          description: `You've successfully registered for ${event.title}!`,
        })
        router.refresh()
      } else {
        // Revert optimistic update on error
        setEvents(initialEvents)
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: result.error || "Failed to register for event.",
        })
      }
    })
  }

  const handleNotAttending = (event: Event) => {
    setSelectedEvent(event)
    setShowDeclineDialog(true)
  }

  const handleDeclineSubmit = () => {
    if (!selectedEvent || !session?.user?.id) return

    // Optimistic update - immediately show "Not Attending" status
    setEvents((prevEvents) =>
      prevEvents.map((e) => {
        if (e.id === selectedEvent.id) {
          // Check if registration already exists
          const existingReg = e.registrations.find((r) => r.userId === session.user.id)
          if (existingReg) {
            // Update existing registration
            return {
              ...e,
              registrations: e.registrations.map((r) =>
                r.userId === session.user.id
                  ? { ...r, status: "DECLINED" as const }
                  : r
              ),
            }
          } else {
            // Add new registration
            return {
              ...e,
              registrations: [
                ...e.registrations,
                {
                  id: `temp-${Date.now()}`,
                  userId: session.user.id,
                  eventId: selectedEvent.id,
                  status: "DECLINED" as const,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ],
            }
          }
        }
        return e
      })
    )

    startTransition(async () => {
      const result = await declineEvent(session.user.id, selectedEvent.id, declineReason || undefined)
      if (result.success) {
        toast({
          title: "Thank you for your feedback",
          description: `We've noted that you won't be attending ${selectedEvent.title}.`,
        })
        router.refresh()
      } else {
        // Revert optimistic update on error
        setEvents(initialEvents)
        toast({
          variant: "destructive",
          title: "Failed to submit response",
          description: result.error || "Failed to record your response.",
        })
      }
      setShowDeclineDialog(false)
      setDeclineReason("")
      setSelectedEvent(null)
    })
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 pt-16 sm:pt-20 p-6 text-white transition-colors">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <h1 className="text-3xl font-bold text-white mb-2">Events</h1>
            <p className="text-white/70">Discover and join alumni events</p>
          </div>

          <Tabs defaultValue="All" onValueChange={setFilter} className="w-full">
            <TabsList className="bg-white/10 dark:bg-indigo-950/30 text-white backdrop-blur-sm border border-white/20 dark:border-indigo-800/30">
              <TabsTrigger value="All" className="data-[state=active]:bg-white/20 text-white">
                All
              </TabsTrigger>
              <TabsTrigger value="Upcoming" className="data-[state=active]:bg-white/20 text-white">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="Past" className="data-[state=active]:bg-white/20 text-white">
                Past
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {filtered.length === 0 ? (
              <div className="col-span-full text-center text-white py-12">
                <p className="text-lg">No events found</p>
                <p className="text-white/60 text-sm mt-2">
                  Check back later for upcoming events!
                </p>
              </div>
            ) : (
              filtered.map((event, index) => {
                const registered = isRegistered(event.id)
                const declined = hasDeclined(event.id)
                const eventDate = new Date(event.eventDate)
                const isPast = eventDate < new Date()

                return (
                  <div
                    key={event.id}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-300 hover:scale-[1.02] transition-transform duration-150"
                    style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                  >
                    <Card className="overflow-hidden shadow-xl border-white/20 dark:border-indigo-800/30 rounded-2xl bg-white/10 dark:bg-indigo-950/30 backdrop-blur-lg h-full flex flex-col text-white">
                      {event.bannerImage && (
                        <div className="relative h-40 w-full">
                          <Image
                            src={event.bannerImage}
                            alt={event.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="line-clamp-2 text-white">{event.title}</CardTitle>
                        <CardDescription className="capitalize text-white/70">
                          {event.category}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm space-y-2 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 text-white/80">
                          <CalendarDays className="h-4 w-4 text-indigo-300 flex-shrink-0" />
                          <p className="text-xs">
                            {eventDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-white/80">
                          <Clock className="h-4 w-4 text-indigo-300 flex-shrink-0" />
                          <p className="text-xs">
                            {eventDate.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex items-start gap-2 text-white/80">
                          <MapPin className="h-4 w-4 text-indigo-300 flex-shrink-0 mt-0.5" />
                          <p className="text-xs line-clamp-2">{event.location}</p>
                        </div>
                        <p className="text-xs text-white/60 line-clamp-2 mt-2 flex-1">
                          {event.description}
                        </p>
                        {registered && (
                          <div className="flex items-center gap-2 text-sm text-indigo-300 mt-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>You're attending</span>
                          </div>
                        )}
                        {declined && !registered && (
                          <div className="flex items-center gap-2 text-sm text-orange-300 mt-2">
                            <XCircle className="h-4 w-4" />
                            <span>You're not attending</span>
                          </div>
                        )}
                        <div className="flex gap-2 mt-3">
                          {registered ? (
                            <Button
                              disabled={isPast}
                              className="flex-1 bg-indigo-500/50 text-white cursor-not-allowed"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {isPast ? "Attended" : "Attending"}
                            </Button>
                          ) : declined ? (
                            <div className="flex gap-2 w-full">
                              <Button
                                onClick={() => handleAttend(event)}
                                disabled={isPending || isPast}
                                className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 disabled:opacity-50"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {isPast ? "Attended" : "Change to Attend"}
                              </Button>
                              <Button
                                disabled
                                variant="outline"
                                className="flex-1 border-orange-500/50 text-orange-300 cursor-not-allowed"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Not Attending
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button
                                onClick={() => handleAttend(event)}
                                disabled={isPending || isPast}
                                className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 disabled:opacity-50"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Attend
                              </Button>
                              <Button
                                onClick={() => handleNotAttending(event)}
                                disabled={isPast}
                                variant="outline"
                                className="flex-1 border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Not Attending
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-lg border-white/20 dark:border-indigo-800/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Not Attending</DialogTitle>
            <DialogDescription className="text-white/70">
              We'd love to know why you won't be able to attend {selectedEvent?.title}. Your feedback helps us improve future events.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-white">
                Reason (Optional)
              </Label>
              <Textarea
                id="reason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="E.g., Schedule conflict, location too far, etc."
                className="bg-white/20 dark:bg-gray-800/50 text-white placeholder:text-white/50 border-white/20"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeclineDialog(false)
                setDeclineReason("")
                setSelectedEvent(null)
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeclineSubmit}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90"
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
