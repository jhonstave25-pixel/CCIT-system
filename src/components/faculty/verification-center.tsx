"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

interface VerificationRequest {
  id: string
  userId: string
  user: {
    name: string | null
    email: string
  }
  status: string
  reason: string | null
  createdAt: string
}

interface VerificationCenterProps {
  onStatusChange?: () => void
}

export function VerificationCenter({ onStatusChange }: VerificationCenterProps) {
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/faculty/verifications")
      if (!res.ok) throw new Error("Failed to load verification requests")
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load verification requests",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  async function handleApprove(requestId: string, userId: string) {
    setProcessing(true)
    try {
      const res = await fetch("/api/faculty/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          userId,
          status: "APPROVED",
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to approve request")
      }

      toast({
        title: "Success",
        description: "Verification request approved",
      })

      loadRequests()
      onStatusChange?.()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to approve request",
      })
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject() {
    if (!selectedRequest) return

    setProcessing(true)
    try {
      const res = await fetch("/api/faculty/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          userId: selectedRequest.userId,
          status: "REJECTED",
          reason: rejectReason || undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to reject request")
      }

      toast({
        title: "Success",
        description: "Verification request rejected",
      })

      setShowRejectDialog(false)
      setRejectReason("")
      setSelectedRequest(null)
      loadRequests()
      onStatusChange?.()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reject request",
      })
    } finally {
      setProcessing(false)
    }
  }

  const pendingRequests = requests.filter((r) => r.status === "PENDING")

  return (
    <>
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">
            Verification Center
            {pendingRequests.length > 0 && (
              <Badge className="ml-2 bg-indigo-500 text-white">
                {pendingRequests.length} pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full bg-white/10" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 text-white/60">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-white/30" />
                <p>No verification requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-lg border border-white/10 bg-white/5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">
                            {request.user.name || request.user.email}
                          </h3>
                          <Badge
                            className={
                              request.status === "PENDING"
                                ? "bg-yellow-500/20 text-yellow-200 border-yellow-300/30"
                                : request.status === "APPROVED"
                                ? "bg-green-500/20 text-green-200 border-green-300/30"
                                : "bg-red-500/20 text-red-200 border-red-300/30"
                            }
                          >
                            {request.status === "PENDING" && (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {request.status === "APPROVED" && (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            )}
                            {request.status === "REJECTED" && (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-white/70 mb-2">
                          {request.user.email}
                        </p>
                        {request.reason && (
                          <p className="text-sm text-white/60 italic">
                            Reason: {request.reason}
                          </p>
                        )}
                        <p className="text-xs text-white/50 mt-2">
                          {formatDistanceToNow(new Date(request.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      {request.status === "PENDING" && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(request.id, request.userId)}
                            disabled={processing}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request)
                              setShowRejectDialog(true)
                            }}
                            disabled={processing}
                            className="border-red-300/30 text-red-200 hover:bg-red-500/20"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>Reject Verification Request</DialogTitle>
            <DialogDescription className="text-white/70">
              Please provide a reason for rejection (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason" className="text-white">
                Reason (optional)
              </Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="E.g., Missing required documents, incomplete profile, etc."
                className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setRejectReason("")
                setSelectedRequest(null)
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={processing}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {processing ? "Processing..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}



