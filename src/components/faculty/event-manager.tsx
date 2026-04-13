"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Plus, Users, MapPin, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

interface Event {
  id: string
  title: string
  description: string
  eventDate: string
  location: string
  capacity: number | null
  _count: {
    registrations: number
  }
}

export function EventManager() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventDate: "",
    location: "",
    category: "",
    customCategory: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    setLoading(true)
    try {
      const res = await fetch("/api/faculty/events")
      if (!res.ok) throw new Error("Failed to load events")
      const data = await res.json()
      setEvents(data.events || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load events",
      })
    } finally {
      setLoading(false)
    }
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { customCategory, ...base } = formData
      const category =
        base.category === "Other" && customCategory ? customCategory : base.category
      const res = await fetch("/api/faculty/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...base, category }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to create event")
      }

      toast({
        title: "Success",
        description: "Event created successfully",
      })

      setOpen(false)
      setFormData({
        title: "",
        description: "",
        eventDate: "",
        location: "",
        category: "",
        customCategory: "",
      })
      loadEvents()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create event",
      })
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Event Manager</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 text-white">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription className="text-white/70">
                  Fill in the details to create a new event
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createEvent}>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-white">
                      Title *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-white">
                      Description *
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      required
                      rows={4}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="eventDate" className="text-white">
                        Event Date *
                      </Label>
                      <Input
                        id="eventDate"
                        type="datetime-local"
                        value={formData.eventDate}
                        onChange={(e) =>
                          setFormData({ ...formData, eventDate: e.target.value })
                        }
                        required
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category" className="text-white">
                        Category *
                      </Label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        required
                        className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select category</option>
                        <option value="Reunion">Reunion</option>
                        <option value="Seminar / Webinar">Seminar / Webinar</option>
                        <option value="Career Talk">Career Talk</option>
                        <option value="Workshop">Workshop</option>
                        <option value="Community Outreach">Community Outreach</option>
                        <option value="Alumni Gathering">Alumni Gathering</option>
                        <option value="Orientation">Orientation</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  {formData.category === "Other" && (
                    <div>
                      <Label htmlFor="customCategory" className="text-white">
                        Specify Category
                      </Label>
                      <Input
                        id="customCategory"
                        value={formData.customCategory}
                        onChange={(e) =>
                          setFormData({ ...formData, customCategory: e.target.value })
                        }
                        required
                        className="bg-white/10 border-white/20 text-white"
                        placeholder="e.g., Alumni Sports Fest"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="location" className="text-white">
                      Location *
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      required
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white">
                    Create Event
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full bg-white/10" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 text-white/30" />
            <p>No events yet. Create your first event!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card
                key={event.id}
                className="border-white/10 bg-white/5 backdrop-blur-sm"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {event.title}
                      </h3>
                      <p className="text-sm text-white/70 mb-4 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {format(new Date(event.eventDate), "PPP 'at' p")}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {event._count.registrations} attendees
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Link href={`/events/${event.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


