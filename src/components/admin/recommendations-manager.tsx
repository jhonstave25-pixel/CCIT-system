"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, CheckCircle, XCircle, Clock, User, Mail, MessageSquare, Briefcase } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { useAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"

interface Recommendation {
  id: string
  status: string
  message: string | null
  createdAt: Date
  faculty: {
    name: string | null
    email: string
  }
  alumni: {
    name: string | null
    email: string
  }
}

interface RecommendationsManagerProps {
  jobId: string
  jobTitle: string
}

export function RecommendationsManager({ jobId, jobTitle }: RecommendationsManagerProps) {
  const { toast } = useToast()
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)

  const loadRecommendations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/recommendations?jobId=${jobId}`)
      if (!res.ok) throw new Error("Failed to load recommendations")
      const data = await res.json()
      setRecommendations(data.recommendations || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load recommendations",
      })
    } finally {
      setLoading(false)
    }
  }, [jobId, toast])

  useEffect(() => {
    loadRecommendations()
  }, [loadRecommendations])

  // Subscribe to Ably channels for real-time recommendation updates
  useAblyChannel(
    ABLY_CHANNELS.JOBS_ACTIVE,
    ABLY_EVENTS.JOB_UPDATED,
    (data: any) => {
      if (data.jobId === jobId) {
        loadRecommendations()
      }
    }
  )

  

  async function handleStatusUpdate(recommendationId: string, status: "ACCEPTED" | "REJECTED") {
    setProcessing(recommendationId)
    try {
      const res = await fetch(`/api/recommendations/${recommendationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update recommendation")
      }

      toast({
        title: "Success",
        description: `Recommendation ${status.toLowerCase()} successfully`,
      })

      loadRecommendations()
      setSelectedRec(null)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update recommendation",
      })
    } finally {
      setProcessing(null)
    }
  }

  async function handleHire(recommendationId: string) {
    setProcessing(recommendationId)
    try {
      const res = await fetch(`/api/recommendations/${recommendationId}/hire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to hire applicant")
      }

      toast({
        title: "Success",
        description: "Applicant hired and added to pipeline successfully",
      })

      loadRecommendations()
      setSelectedRec(null)
      
      // Refresh the page to update the applicant pipeline
      window.location.reload()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to hire applicant",
      })
    } finally {
      setProcessing(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-400/15 border-yellow-300/30 text-yellow-200"
      case "ACCEPTED":
        return "bg-emerald-400/15 border-emerald-300/30 text-emerald-200"
      case "REJECTED":
        return "bg-red-400/15 border-red-300/30 text-red-200"
      default:
        return "bg-gray-400/15 border-gray-300/30 text-gray-200"
    }
  }

  const pendingRecs = recommendations.filter((r) => r.status === "PENDING")
  const acceptedRecs = recommendations.filter((r) => r.status === "ACCEPTED")
  const rejectedRecs = recommendations.filter((r) => r.status === "REJECTED")

  if (loading) {
    return (
      <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30">
        <CardHeader>
          <CardTitle className="text-white">Faculty Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/60">Loading recommendations...</p>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Faculty Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/60">No faculty recommendations for this job yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Faculty Recommendations
            {pendingRecs.length > 0 && (
              <Badge className="bg-purple-500/20 border-purple-300/30 text-purple-200">
                {pendingRecs.length} pending
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingRecs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white/80 mb-2">Pending Review</h4>
                <div className="space-y-2">
                  {pendingRecs.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => setSelectedRec(rec)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-white/60" />
                            <span className="text-white font-medium">
                              {rec.alumni.name || rec.alumni.email}
                            </span>
                            <span className="text-white/50">•</span>
                            <span className="text-sm text-white/70">
                              Recommended by {rec.faculty.name || rec.faculty.email}
                            </span>
                          </div>
                          {rec.message && (
                            <p className="text-sm text-white/60 mt-1 line-clamp-1">{rec.message}</p>
                          )}
                          <p className="text-xs text-white/50 mt-1">
                            {formatDistanceToNow(new Date(rec.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <Badge className={getStatusColor(rec.status)}>{rec.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {acceptedRecs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white/80 mb-2">Accepted</h4>
                <div className="space-y-2">
                  {acceptedRecs.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => setSelectedRec(rec)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white">{rec.alumni.name || rec.alumni.email}</span>
                          <span className="text-white/50 ml-2">
                            by {rec.faculty.name || rec.faculty.email}
                          </span>
                        </div>
                        <Badge className={getStatusColor(rec.status)}>{rec.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rejectedRecs.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-white/80 mb-2">Rejected</h4>
                <div className="space-y-2">
                  {rejectedRecs.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-lg bg-white/5 border border-white/10"
                      onClick={() => setSelectedRec(rec)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white">{rec.alumni.name || rec.alumni.email}</span>
                          <span className="text-white/50 ml-2">
                            by {rec.faculty.name || rec.faculty.email}
                          </span>
                        </div>
                        <Badge className={getStatusColor(rec.status)}>{rec.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendation Detail Dialog */}
      <Dialog open={!!selectedRec} onOpenChange={() => setSelectedRec(null)}>
        <DialogContent className="sm:max-w-[600px] bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
          <DialogHeader>
            <DialogTitle>Recommendation Details</DialogTitle>
            <DialogDescription className="text-white/70">
              Review and manage this faculty recommendation
            </DialogDescription>
          </DialogHeader>

          {selectedRec && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/70">Alumni</label>
                  <div className="mt-1 p-2 rounded bg-white/5">
                    <p className="text-white font-medium">{selectedRec.alumni.name || "N/A"}</p>
                    <p className="text-sm text-white/60">{selectedRec.alumni.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/70">Recommended By</label>
                  <div className="mt-1 p-2 rounded bg-white/5">
                    <p className="text-white font-medium">{selectedRec.faculty.name || "N/A"}</p>
                    <p className="text-sm text-white/60">{selectedRec.faculty.email}</p>
                  </div>
                </div>
              </div>

              {selectedRec.message && (
                <div>
                  <label className="text-sm text-white/70 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Endorsement Message
                  </label>
                  <div className="mt-1 p-3 rounded bg-white/5">
                    <p className="text-white/90 whitespace-pre-wrap">{selectedRec.message}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-white/60">
                <Clock className="w-4 h-4" />
                <span>
                  {formatDistanceToNow(new Date(selectedRec.createdAt), { addSuffix: true })}
                </span>
                <Badge className={getStatusColor(selectedRec.status)}>{selectedRec.status}</Badge>
              </div>

              {selectedRec.status === "PENDING" && (
                <div className="flex gap-3 pt-4 border-t border-white/20">
                  <Button
                    onClick={() => handleStatusUpdate(selectedRec.id, "ACCEPTED")}
                    disabled={processing === selectedRec.id}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate(selectedRec.id, "REJECTED")}
                    disabled={processing === selectedRec.id}
                    variant="outline"
                    className="flex-1 border-red-300/30 text-red-200 hover:bg-red-500/20"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}

              {selectedRec.status === "ACCEPTED" && (
                <div className="flex gap-3 pt-4 border-t border-white/20">
                  <Button
                    onClick={() => handleHire(selectedRec.id)}
                    disabled={processing === selectedRec.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Hire & Add to Pipeline
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

