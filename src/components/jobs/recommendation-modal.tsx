"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Search, User, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Alumni {
  id: string
  name: string | null
  email: string
  profile: {
    batch: string
    degree: string
    currentCompany: string | null
    currentPosition: string | null
  } | null
}

interface RecommendationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  jobId: string
  jobTitle: string
}

export function RecommendationModal({
  open,
  onOpenChange,
  jobId,
  jobTitle,
}: RecommendationModalProps) {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null)
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const searchAlumni = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        verified: "true", // Only show verified alumni
        page: "1",
        pageSize: "10",
      })

      const res = await fetch(`/api/faculty/directory?${params}`)
      if (!res.ok) throw new Error("Failed to search alumni")
      const data = await res.json()
      setAlumni(data.alumni || [])
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to search alumni",
      })
    } finally {
      setLoading(false)
    }
  }, [searchQuery, toast])

  useEffect(() => {
    if (open && searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchAlumni()
      }, 300)
      return () => clearTimeout(timeoutId)
    } else if (open && searchQuery.length === 0) {
      setAlumni([])
    }
  }, [searchQuery, open, searchAlumni])

  

  async function handleSubmit() {
    if (!selectedAlumni) {
      toast({
        variant: "destructive",
        title: "Alumni Required",
        description: "Please select an alumni to recommend",
      })
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alumniId: selectedAlumni.id,
          jobId,
          message: message || undefined,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to send recommendation")
      }

      toast({
        title: "Success",
        description: "✅ Recommendation sent to admin for review.",
      })

      // Reset form
      setSelectedAlumni(null)
      setMessage("")
      setSearchQuery("")
      setAlumni([])
      onOpenChange(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send recommendation",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Recommend Alumni for Job</DialogTitle>
          <DialogDescription className="text-white/70">
            Recommend a verified alumni for: <span className="font-semibold">{jobTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Search Alumni */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-white">
              Search Alumni
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            {/* Search Results */}
            {searchQuery.length >= 2 && (
              <div className="border border-white/20 rounded-lg bg-white/5 max-h-60 overflow-hidden">
                {loading ? (
                  <div className="p-4 text-center text-white/60">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Searching...</p>
                  </div>
                ) : alumni.length > 0 ? (
                  <ScrollArea className="h-60">
                    <div className="p-2 space-y-1">
                      {alumni.map((alum) => (
                        <button
                          key={alum.id}
                          onClick={() => {
                            setSelectedAlumni(alum)
                            setSearchQuery("")
                            setAlumni([])
                          }}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedAlumni?.id === alum.id
                              ? "bg-indigo-500/30 border border-indigo-400/50"
                              : "bg-white/5 hover:bg-white/10 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                              <User className="w-5 h-5 text-indigo-300" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white truncate">
                                {alum.name || "No name"}
                              </p>
                              <p className="text-sm text-white/70 truncate">{alum.email}</p>
                              {alum.profile && (
                                <p className="text-xs text-white/60 mt-1">
                                  {alum.profile.degree} • {alum.profile.batch}
                                  {alum.profile.currentCompany &&
                                    ` • ${alum.profile.currentCompany}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="p-4 text-center text-white/60">
                    <p className="text-sm">No alumni found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Alumni */}
          {selectedAlumni && (
            <div className="p-4 rounded-lg bg-indigo-500/20 border border-indigo-400/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-500/30 flex items-center justify-center">
                  <User className="w-6 h-6 text-indigo-200" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{selectedAlumni.name || "No name"}</p>
                  <p className="text-sm text-white/70">{selectedAlumni.email}</p>
                  {selectedAlumni.profile && (
                    <p className="text-xs text-white/60 mt-1">
                      {selectedAlumni.profile.degree} • {selectedAlumni.profile.batch}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAlumni(null)}
                  className="text-white/70 hover:text-white"
                >
                  Change
                </Button>
              </div>
            </div>
          )}

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-white">
              Endorsement Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Add a personal note or endorsement for this recommendation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedAlumni || submitting}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Recommendation"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

