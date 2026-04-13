"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { markFeedbackReadAction } from "@/app/(dashboard)/admin/mark-feedback-read.action"
import { useRouter } from "next/navigation"

interface Feedback {
  id: string
  userId: string | null
  message: string
  photoUrl: string | null
  status: string
  createdAt: Date
  userName?: string | null
}

interface AdminFeedbackListProps {
  feedbacks: Feedback[]
  users?: Map<string, { name: string | null; email: string }>
}

export default function AdminFeedbackList({ feedbacks, users }: AdminFeedbackListProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Feedback | null>(null)
  const [isPending, startTransition] = useTransition()
  const [localFeedbacks, setLocalFeedbacks] = useState<Feedback[]>(feedbacks)

  function handleOpen(feedback: Feedback) {
    setSelected(feedback)
    
    // Mark as read if unread
    if (feedback.status === "unread") {
      startTransition(async () => {
        const result = await markFeedbackReadAction(feedback.id)
        if (result.ok) {
          // Update local state
          setLocalFeedbacks((prev) =>
            prev.map((f) => (f.id === feedback.id ? { ...f, status: "read" } : f))
          )
          // Refresh the page data
          router.refresh()
        }
      })
    }
  }

  // Get user name for display
  function getUserName(feedback: Feedback): string {
    if (feedback.userName) return feedback.userName
    if (feedback.userId && users) {
      const user = users.get(feedback.userId)
      if (user) return user.name || user.email
    }
    return "Anonymous"
  }

  return (
    <>
      <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
        <CardHeader>
          <CardTitle className="text-white">User Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {localFeedbacks.length === 0 ? (
            <p className="text-sm text-white/60">No feedback yet.</p>
          ) : (
            <ul className="space-y-3">
              {localFeedbacks.map((f) => (
                <li
                  key={f.id}
                  onClick={() => handleOpen(f)}
                  className="cursor-pointer rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/90 line-clamp-2">{f.message}</p>
                      <p className="text-xs text-white/60 mt-2">
                        From: {getUserName(f)}
                      </p>
                      <p className="text-xs text-white/50 mt-1">
                        {new Date(f.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {f.status === "unread" && (
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 shrink-0">
                        unread
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Feedback Reader Modal */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Feedback Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-white/90 whitespace-pre-wrap">{selected.message}</p>
              </div>
              
              {selected.photoUrl && (
                <div className="mt-3">
                  <Image
                    src={selected.photoUrl}
                    alt="Feedback attachment"
                    width={500}
                    height={400}
                    className="max-h-64 w-full rounded-md object-cover border border-white/10"
                    unoptimized
                  />
                </div>
              )}

              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-white/60">
                  From: {getUserName(selected)}
                </p>
                <p className="text-xs text-white/50 mt-1">
                  {new Date(selected.createdAt).toLocaleString()}
                </p>
                <div className="mt-2">
                  <Badge
                    variant={selected.status === "unread" ? "default" : "secondary"}
                    className={
                      selected.status === "unread"
                        ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                        : "bg-green-500/20 text-green-300 border-green-500/30"
                    }
                  >
                    {selected.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => setSelected(null)}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}



















