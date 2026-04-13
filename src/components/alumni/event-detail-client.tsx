"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { registerForEvent, declineEvent } from "@/actions/event.actions"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
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
import { Badge } from "@/components/ui/badge"

interface EventDetailClientProps {
  eventId: string
  isRegistered: boolean
  hasDeclined: boolean
  eventDate: Date
}

export function EventDetailClient({
  eventId,
  isRegistered: initialIsRegistered,
  hasDeclined: initialHasDeclined,
  eventDate,
}: EventDetailClientProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [declineReason, setDeclineReason] = useState("")
  const [showDeclineDialog, setShowDeclineDialog] = useState(false)
  const [isRegistered, setIsRegistered] = useState(initialIsRegistered)
  const [hasDeclined, setHasDeclined] = useState(initialHasDeclined)
  const isPastEvent = new Date(eventDate) < new Date()

  // Sync state with props when they change (e.g., after router.refresh())
  useEffect(() => {
    setIsRegistered(initialIsRegistered)
    setHasDeclined(initialHasDeclined)
  }, [initialIsRegistered, initialHasDeclined])

  const handleAttend = () => {
    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to register for events.",
      })
      return
    }

    // Optimistic update - immediately show "Attending" status
    setIsRegistered(true)
    setHasDeclined(false)

    startTransition(async () => {
      const result = await registerForEvent(session.user.id, eventId)
      if (result.success) {
        toast({
          title: "Registration Successful",
          description: "You've successfully registered for this event!",
        })
        router.refresh()
      } else {
        // Revert optimistic update on error
        setIsRegistered(initialIsRegistered)
        setHasDeclined(initialHasDeclined)
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: result.error || "Failed to register for event.",
        })
      }
    })
  }

  const handleNotAttending = () => {
    setShowDeclineDialog(true)
  }

  const handleDeclineSubmit = () => {
    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to respond to events.",
      })
      return
    }

    // Optimistic update - immediately show "Not Attending" status
    setIsRegistered(false)
    setHasDeclined(true)
    setShowDeclineDialog(false)

    startTransition(async () => {
      const result = await declineEvent(session.user.id, eventId, declineReason || undefined)
      if (result.success) {
        toast({
          title: "Response Recorded",
          description: "Your response has been recorded.",
        })
        setDeclineReason("")
        router.refresh()
      } else {
        // Revert optimistic update on error
        setIsRegistered(initialIsRegistered)
        setHasDeclined(initialHasDeclined)
        setShowDeclineDialog(true)
        toast({
          variant: "destructive",
          title: "Failed",
          description: result.error || "Failed to record your response.",
        })
      }
    })
  }

  return (
    <>
      <div className="mt-6 pt-6 border-t border-white/10">
        <h3 className="text-lg font-semibold mb-4">RSVP</h3>
        {isRegistered ? (
          <div className="flex items-center gap-3">
            <Badge className="bg-green-500/20 border-green-300/30 text-green-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              You're attending
            </Badge>
            {!isPastEvent && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNotAttending}
                disabled={isPending}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Change to Not Attending
              </Button>
            )}
          </div>
        ) : hasDeclined ? (
          <div className="flex items-center gap-3">
            <Badge className="bg-red-500/20 border-red-300/30 text-red-200 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              You're not attending
            </Badge>
            {!isPastEvent && (
              <Button
                onClick={handleAttend}
                disabled={isPending}
                size="sm"
                className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90"
              >
                Change to Attend
              </Button>
            )}
          </div>
        ) : (
          <div className="flex gap-3">
            {!isPastEvent && (
              <>
                <Button
                  onClick={handleAttend}
                  disabled={isPending}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Attend
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNotAttending}
                  disabled={isPending}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Not Attending
                </Button>
              </>
            )}
            {isPastEvent && (
              <p className="text-sm text-white/60">This event has already passed.</p>
            )}
          </div>
        )}
      </div>

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Not Attending</DialogTitle>
            <DialogDescription className="text-white/70">
              Let us know why you won't be able to attend (optional).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason" className="text-white">
                Reason (optional)
              </Label>
              <Textarea
                id="reason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="E.g., Schedule conflict, out of town, etc."
                className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeclineDialog(false)
                setDeclineReason("")
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeclineSubmit}
              disabled={isPending}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90"
            >
              {isPending ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

