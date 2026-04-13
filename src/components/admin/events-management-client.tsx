"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContentFormModal } from "@/components/admin/content-form-modal"
import { createEvent, updateEvent, deleteEvent } from "@/actions/event.actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, Calendar, MapPin, Users } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Event {
  id: string
  title: string
  description: string
  eventDate: Date
  endDate: Date | null
  location: string
  venue: string | null
  status: string
  category: string
  featured: boolean
  capacity: number | null
  _count: {
    registrations: number
  }
}

interface EventsManagementClientProps {
  events: Event[]
}

export function EventsManagementClient({ events: initialEvents }: EventsManagementClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)

  const eventFields = [
    { name: "title", label: "Event Title", type: "text" as const, required: true, placeholder: "e.g., Alumni Tech Summit 2025" },
    {
      name: "category",
      label: "Category",
      type: "select" as const,
      required: true,
      options: [
        { label: "Reunion", value: "Reunion" },
        { label: "Seminar / Webinar", value: "Seminar / Webinar" },
        { label: "Career Talk", value: "Career Talk" },
        { label: "Workshop", value: "Workshop" },
        { label: "Community Outreach", value: "Community Outreach" },
        { label: "Alumni Gathering", value: "Alumni Gathering" },
        { label: "Orientation", value: "Orientation" },
        { label: "Other", value: "Other" },
      ],
    },
    {
      name: "customCategory",
      label: "If you selected \"Other\", specify category",
      type: "text" as const,
      placeholder: "e.g., Alumni Sports Fest",
    },
    { name: "description", label: "Description", type: "textarea" as const, required: true, placeholder: "Event description..." },
    { name: "eventDate", label: "Event Date", type: "date" as const, required: true },
    { name: "endDate", label: "End Date", type: "date" as const, placeholder: "Optional end date" },
    { name: "location", label: "Location", type: "text" as const, required: true, placeholder: "City, Country" },
    { name: "venue", label: "Venue", type: "text" as const, placeholder: "Specific venue name" },
    { name: "bannerImage", label: "Banner Image URL", type: "text" as const, placeholder: "https://..." },
    { name: "meetingLink", label: "Meeting Link", type: "text" as const, placeholder: "For virtual events" },
    {
      name: "status",
      label: "Status",
      type: "select" as const,
      required: true,
      options: [
        { label: "Upcoming", value: "UPCOMING" },
        { label: "Ongoing", value: "ONGOING" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Cancelled", value: "CANCELLED" },
      ],
    },
    { name: "isVirtual", label: "Virtual Event", type: "checkbox" as const, placeholder: "This is a virtual event" },
    { name: "featured", label: "Featured", type: "checkbox" as const, placeholder: "Feature this event" },
  ]

  const handleCreate = async (values: Record<string, any>) => {
    const { customCategory, ...rest } = values
    const category =
      rest.category === "Other" && customCategory ? customCategory : rest.category
    const result = await createEvent({ ...rest, category })
    if (result.success) {
      router.refresh()
    }
    return result
  }

  const handleUpdate = async (values: Record<string, any>) => {
    if (!editingEvent) return { success: false, error: "No event selected" }
    const { customCategory, ...rest } = values
    const category =
      rest.category === "Other" && customCategory ? customCategory : rest.category
    const result = await updateEvent(editingEvent.id, { ...rest, category })
    if (result.success) {
      router.refresh()
    }
    return result
  }

  const handleDelete = async () => {
    if (!deleteEventId) return

    const result = await deleteEvent(deleteEventId)
    if (result.success) {
      toast({
        title: "Success",
        description: "Event deleted successfully.",
      })
      setDeleteEventId(null)
      router.refresh()
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to delete event",
      })
    }
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-400/15 border-blue-300/30 text-blue-200"
      case "ONGOING":
        return "bg-emerald-400/15 border-emerald-300/30 text-emerald-200"
      case "COMPLETED":
        return "bg-gray-400/15 border-gray-300/30 text-gray-200"
      case "CANCELLED":
        return "bg-red-400/15 border-red-300/30 text-red-200"
      default:
        return "bg-gray-400/15 border-gray-300/30 text-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Manage Events</h1>
          <p className="text-white/70 mt-2">
            Create and manage alumni events, workshops, and gatherings
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingEvent(null)
            setOpen(true)
          }}
          className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Event
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
        {initialEvents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60">No events yet. Click "New Event" to create your first event.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/10 border-b border-white/10">
                  <TableHead className="text-white/80">Title</TableHead>
                  <TableHead className="text-white/80">Category</TableHead>
                  <TableHead className="text-white/80">Date</TableHead>
                  <TableHead className="text-white/80">Location</TableHead>
                  <TableHead className="text-white/80">Status</TableHead>
                  <TableHead className="text-white/80">Registrations</TableHead>
                  <TableHead className="text-right text-white/80">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialEvents.map((event) => (
                  <TableRow key={event.id} className="border-b border-white/10 hover:bg-white/5">
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        {event.title}
                        {event.featured && (
                          <Badge className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-white/90">{event.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-white/60" />
                        <span className="text-sm text-white/90">
                          {new Date(event.eventDate).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-white/60" />
                        <span className="text-sm text-white/90">{event.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {event.capacity ? (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-white/60" />
                          <span className="text-sm text-white/90">
                            {event._count?.registrations || 0} / {event.capacity}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-white/90">{event._count?.registrations || 0}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/80 hover:bg-white/10"
                          onClick={() => router.push(`/admin/events/${event.id}`)}
                          title="View attendees"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/80 hover:bg-white/10"
                          onClick={() => {
                            setEditingEvent(event)
                            setOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-300 hover:bg-red-500/20"
                          onClick={() => setDeleteEventId(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ContentFormModal
        title={editingEvent ? "Edit Event" : "Create New Event"}
        mode={editingEvent ? "edit" : "create"}
        open={open}
        onOpenChange={setOpen}
        fields={eventFields}
        defaultValues={
          editingEvent
            ? {
                ...editingEvent,
                eventDate: new Date(editingEvent.eventDate).toISOString().split("T")[0],
                endDate: editingEvent.endDate
                  ? new Date(editingEvent.endDate).toISOString().split("T")[0]
                  : "",
              }
            : {
                status: "UPCOMING",
                isVirtual: false,
                featured: false,
              }
        }
        onSubmit={editingEvent ? handleUpdate : handleCreate}
        description={
          editingEvent
            ? "Update the event details below."
            : "Fill in the details to create a new event."
        }
      />

      <AlertDialog open={!!deleteEventId} onOpenChange={(open) => !open && setDeleteEventId(null)}>
        <AlertDialogContent className="bg-gray-900 border border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This action cannot be undone. This will permanently delete the event and all its registrations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

