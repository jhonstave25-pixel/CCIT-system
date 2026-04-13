"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sendFeedbackAction } from "@/app/(dashboard)/feedback/send-feedback.action"
import { useToast } from "@/hooks/use-toast"

export default function FeedbackButton({ userId }: { userId?: string }) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!message.trim()) {
      toast({
        variant: "destructive",
        title: "Message Required",
        description: "Please provide your feedback message.",
      })
      return
    }

    setLoading(true)

    try {
      const fd = new FormData()
      fd.append("message", message)
      if (photo) {
        fd.append("photo", photo)
      }
      if (userId) {
        fd.append("userId", userId)
      }

      const res = await sendFeedbackAction(fd)

      if (res.ok) {
        toast({
          title: "Feedback Submitted",
          description: res.message || "Your feedback has been submitted successfully!",
        })
        setMessage("")
        setPhoto(null)
        setOpen(false)
      } else {
        toast({
          variant: "destructive",
          title: "Submission Failed",
          description: res.message || "Failed to submit feedback. Please try again.",
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="border-white/20 text-white hover:bg-white/10">
        Share Feedback
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Share a suggestion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="feedback-message" className="text-white/80 mb-2 block">
                Your Feedback
              </Label>
              <Textarea
                id="feedback-message"
                placeholder="Type your idea here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] bg-white/20 dark:bg-gray-800/50 text-white placeholder:text-white/50 border-white/20 resize-none"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="feedback-photo" className="text-white/80 mb-2 block">
                Photo (Optional)
              </Label>
              <Input
                id="feedback-photo"
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                className="cursor-pointer border-white/20 bg-white/20 dark:bg-gray-800/50 text-white placeholder:text-white/70 file:mr-4 file:rounded-md file:border-0 file:bg-gradient-to-r file:from-indigo-500 file:to-violet-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-90 disabled:opacity-50"
                disabled={loading}
              />
              <p className="text-xs text-white/60 mt-1">Supported: JPG, PNG, GIF. Max 5MB.</p>
              {photo && (
                <p className="text-xs mt-1 text-indigo-300">
                  Selected: {photo.name} ({(photo.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={loading || !message.trim()}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


