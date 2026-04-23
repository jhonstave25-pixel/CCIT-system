"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { updateApplicantStatus } from "@/actions/applicant.actions"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Users, Eye, FileText, CheckCircle, XCircle, Calendar, Mail, User, Sparkles, Star, Briefcase } from "lucide-react"

interface Applicant {
  id: string
  name: string | null
  email: string
  status: string
  resumeUrl: string | null
  coverLetter: string | null
  createdAt: Date
}

interface JobPipelineProps {
  jobId: string
}

export default function JobPipeline({ jobId }: JobPipelineProps) {
  const { toast } = useToast()
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)

  const fetchApplicants = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/jobs/${jobId}/applicants`)
      const data = await response.json()
      if (response.ok) {
        setApplicants(data.applicants || [])
      }
    } catch (error) {
      console.error("Error fetching applicants:", error)
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    fetchApplicants()
  }, [fetchApplicants])

  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (applicantId: string, newStatus: string) => {
    setIsUpdating(true)
    const result = await updateApplicantStatus(
      applicantId,
      newStatus as "NEW" | "SHORTLISTED" | "INTERVIEW" | "HIRED" | "REJECTED"
    )

    if (result.success) {
      toast({
        title: "Success",
        description: "Applicant status updated successfully.",
      })
      fetchApplicants()
      setIsDialogOpen(false)
      setSelectedApplicant(null)
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to update status",
      })
    }
    setIsUpdating(false)
  }

  const handleQuickAction = (applicant: Applicant, action: "ACCEPT" | "REJECT" | "INTERVIEW") => {
    setSelectedApplicant(applicant)
    let newStatus: "SHORTLISTED" | "INTERVIEW" | "HIRED" | "REJECTED"
    
    if (action === "ACCEPT") {
      newStatus = "HIRED"
    } else if (action === "REJECT") {
      newStatus = "REJECTED"
    } else {
      newStatus = "INTERVIEW"
    }
    
    handleStatusChange(applicant.id, newStatus)
  }

  const stages = [
    { 
      key: "NEW", 
      label: "New", 
      color: "bg-blue-400/15 border-blue-300/30 text-blue-200",
      icon: Sparkles,
      iconColor: "text-blue-400"
    },
    {
      key: "SHORTLISTED",
      label: "Shortlisted",
      color: "bg-purple-400/15 border-purple-300/30 text-purple-200",
      icon: Star,
      iconColor: "text-purple-400"
    },
    {
      key: "INTERVIEW",
      label: "Interview",
      color: "bg-yellow-400/15 border-yellow-300/30 text-yellow-200",
      icon: Calendar,
      iconColor: "text-yellow-400"
    },
    { 
      key: "HIRED", 
      label: "Hired", 
      color: "bg-emerald-400/15 border-emerald-300/30 text-emerald-200",
      icon: CheckCircle,
      iconColor: "text-emerald-400"
    },
    { 
      key: "REJECTED", 
      label: "Rejected", 
      color: "bg-red-400/15 border-red-300/30 text-red-200",
      icon: XCircle,
      iconColor: "text-red-400"
    },
  ]

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/15 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Applicant Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-64 w-full bg-white/10" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/5 border-white/15 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="h-5 w-5" />
          Applicant Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-5 gap-4">
          {stages.map((stage) => {
            const stageApplicants = applicants.filter((a) => a.status === stage.key)
            return (
              <div
                key={stage.key}
                className="rounded-lg border border-white/15 bg-white/5 p-4 min-h-[300px]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {stage.icon && (
                      <stage.icon className={`h-5 w-5 ${stage.iconColor}`} />
                    )}
                    <h3 className="font-semibold text-white">{stage.label}</h3>
                  </div>
                  <Badge className={stage.color}>{stageApplicants.length}</Badge>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {stageApplicants.length === 0 ? (
                    <p className="text-white/50 text-sm text-center py-4">No applicants</p>
                  ) : (
                    stageApplicants.map((applicant) => (
                      <div
                        key={applicant.id}
                        className="rounded-md p-3 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              {applicant.name || "No name"}
                            </p>
                            <p className="text-xs text-white/60">{applicant.email}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
                            onClick={() => {
                              setSelectedApplicant(applicant)
                              setIsDialogOpen(true)
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-white/50 mb-3">
                          Applied: {new Date(applicant.createdAt).toLocaleDateString()}
                        </p>
                        
                        {/* Quick Action Buttons */}
                        {applicant.status === "NEW" && (
                          <div className="flex flex-col gap-2 mb-2">
                            <Button
                              size="sm"
                              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs h-7"
                              onClick={() => handleQuickAction(applicant, "ACCEPT")}
                              disabled={isUpdating}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Accept
                            </Button>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/30 text-yellow-200 hover:bg-yellow-500/30 text-xs h-7"
                                onClick={() => handleQuickAction(applicant, "INTERVIEW")}
                                disabled={isUpdating}
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                Interview
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30 text-xs h-7"
                                onClick={() => handleQuickAction(applicant, "REJECT")}
                                disabled={isUpdating}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {applicant.status === "SHORTLISTED" && (
                          <div className="flex gap-1 mb-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs h-7"
                              onClick={() => handleQuickAction(applicant, "ACCEPT")}
                              disabled={isUpdating}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/30 text-yellow-200 hover:bg-yellow-500/30 text-xs h-7"
                              onClick={() => handleQuickAction(applicant, "INTERVIEW")}
                              disabled={isUpdating}
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              Interview
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30 text-xs h-7"
                              onClick={() => handleQuickAction(applicant, "REJECT")}
                              disabled={isUpdating}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        
                        {applicant.status === "INTERVIEW" && (
                          <div className="flex gap-1 mb-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs h-7"
                              onClick={() => handleQuickAction(applicant, "ACCEPT")}
                              disabled={isUpdating}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30 text-xs h-7"
                              onClick={() => handleQuickAction(applicant, "REJECT")}
                              disabled={isUpdating}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {/* Status Selector (for manual changes) */}
                        <Select
                          value={applicant.status}
                          onValueChange={(value) => handleStatusChange(applicant.id, value)}
                        >
                          <SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-indigo-950/95 border-white/20">
                            {stages.map((s) => (
                              <SelectItem
                                key={s.key}
                                value={s.key}
                                className="text-white hover:bg-indigo-800/50"
                              >
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>

      {/* Applicant Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-indigo-950/95 border-white/20 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Applicant Details
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Review applicant information and manage their application status
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplicant && (
            <div className="space-y-4 mt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/70">Name</label>
                  <p className="text-white font-medium">{selectedApplicant.name || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm text-white/70">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-white/60" />
                    <a
                      href={`mailto:${selectedApplicant.email}`}
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      {selectedApplicant.email}
                    </a>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/70">Applied Date</label>
                  <p className="text-white">
                    {new Date(selectedApplicant.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-white/70">Current Status</label>
                  <Badge className={stages.find(s => s.key === selectedApplicant.status)?.color || "bg-gray-400/15"}>
                    {stages.find(s => s.key === selectedApplicant.status)?.label || selectedApplicant.status}
                  </Badge>
                </div>
              </div>

              {selectedApplicant.resumeUrl && (
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Resume</label>
                  <a
                    href={selectedApplicant.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-400/30 rounded-lg text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    View Resume
                  </a>
                </div>
              )}

              {selectedApplicant.coverLetter && (
                <div>
                  <label className="text-sm text-white/70 mb-2 block">Cover Letter</label>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                    <p className="text-white/80 text-sm whitespace-pre-wrap">
                      {selectedApplicant.coverLetter}
                    </p>
                  </div>
                </div>
              )}

              <div className="border-t border-white/10 pt-4">
                <label className="text-sm text-white/70 mb-3 block">Quick Actions</label>
                <div className="flex flex-wrap gap-2">
                  {selectedApplicant.status !== "HIRED" && (
                    <Button
                      className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white"
                      onClick={() => handleQuickAction(selectedApplicant, "ACCEPT")}
                      disabled={isUpdating}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Accept / Hire
                    </Button>
                  )}
                  {selectedApplicant.status !== "INTERVIEW" && selectedApplicant.status !== "HIRED" && (
                    <Button
                      variant="outline"
                      className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/30 text-yellow-200 hover:bg-yellow-500/30"
                      onClick={() => handleQuickAction(selectedApplicant, "INTERVIEW")}
                      disabled={isUpdating}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Prepare for Interview
                    </Button>
                  )}
                  {selectedApplicant.status !== "REJECTED" && (
                    <Button
                      variant="outline"
                      className="bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30"
                      onClick={() => handleQuickAction(selectedApplicant, "REJECT")}
                      disabled={isUpdating}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <label className="text-sm text-white/70 mb-3 block">Change Status</label>
                <Select
                  value={selectedApplicant.status}
                  onValueChange={(value) => handleStatusChange(selectedApplicant.id, value)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-indigo-950/95 border-white/20">
                    {stages.map((s) => (
                      <SelectItem
                        key={s.key}
                        value={s.key}
                        className="text-white hover:bg-indigo-800/50"
                      >
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}


