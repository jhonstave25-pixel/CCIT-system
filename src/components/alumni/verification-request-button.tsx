"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Clock, AlertCircle, Shield, Loader2 } from "lucide-react"

interface VerificationStatus {
  isVerified: boolean
  request: {
    id: string
    status: "PENDING" | "APPROVED" | "REJECTED"
    reason: string | null
    createdAt: string
  } | null
  canRequest: boolean
}

export function VerificationRequestButton() {
  const [status, setStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [reason, setReason] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadStatus()
  }, [])

  async function loadStatus() {
    try {
      const res = await fetch("/api/alumni/verify/request")
      if (!res.ok) throw new Error("Failed to load verification status")
      const data = await res.json()
      setStatus(data)
    } catch (error: any) {
      console.error("Error loading verification status:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch("/api/alumni/verify/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason || undefined }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request")
      }

      toast({
        title: "Success",
        description: "Verification request submitted successfully! Faculty will review it soon.",
      })

      setShowDialog(false)
      setReason("")
      loadStatus()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit request",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Button disabled variant="outline" className="w-full">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </Button>
    )
  }

  if (!status) return null

  // Already verified
  if (status.isVerified) {
    return (
      <Badge className="bg-green-500/20 text-green-200 border-green-300/30 px-3 py-1">
        <CheckCircle className="w-4 h-4 mr-2" />
        Verified Alumni
      </Badge>
    )
  }

  // Pending request
  if (status.request?.status === "PENDING") {
    return (
      <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-300/30 px-3 py-1">
        <Clock className="w-4 h-4 mr-2" />
        Verification Pending
      </Badge>
    )
  }

  // Rejected request
  if (status.request?.status === "REJECTED") {
    return (
      <div className="space-y-2">
        <Badge className="bg-red-500/20 text-red-200 border-red-300/30 px-3 py-1">
          <AlertCircle className="w-4 h-4 mr-2" />
          Verification Rejected
        </Badge>
        {status.request.reason && (
          <p className="text-sm text-white/60">Reason: {status.request.reason}</p>
        )}
        <Button
          onClick={() => setShowDialog(true)}
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/10"
        >
          <Shield className="w-4 h-4 mr-2" />
          Request Verification Again
        </Button>
      </div>
    )
  }

  // Can request verification
  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90"
      >
        <Shield className="w-4 h-4 mr-2" />
        Request Verification
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Request Alumni Verification</DialogTitle>
            <DialogDescription className="text-white/70">
              Submit a request to get verified as an alumni. Faculty will review your profile.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Why should you be verified? (Optional)
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="E.g., I graduated in 2020 with a degree in Computer Science. I can provide my transcript or diploma if needed."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
