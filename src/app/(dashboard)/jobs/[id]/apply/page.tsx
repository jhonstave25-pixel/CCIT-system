"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { submitApplicationAction } from "./submit-application.action"
import { useToast } from "@/hooks/use-toast"
import { Briefcase } from "lucide-react"

export default function ApplyJobPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const { id: jobId } = use(params)
  const [resume, setResume] = useState<File | null>(null)
  const [coverLetter, setCoverLetter] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!resume) {
      setStatus("Please upload your resume first.")
      toast({
        variant: "destructive",
        title: "Resume Required",
        description: "Please upload your resume to apply for this job.",
      })
      return
    }

    setLoading(true)
    setStatus(null)

    const fd = new FormData()
    fd.append("jobId", jobId)
    fd.append("coverLetter", coverLetter)
    fd.append("resume", resume)

    try {
      const res = await submitApplicationAction(fd)

      if (res.ok) {
        setStatus(res.message || "Application submitted successfully!")
        toast({
          title: "Application Submitted",
          description: res.message || "Your application has been submitted successfully!",
        })
        // Redirect to job page after a short delay
        setTimeout(() => {
          router.push(`/jobs/${jobId}`)
          router.refresh()
        }, 2000)
      } else {
        setStatus(res.message || "Failed to submit application.")
        toast({
          variant: "destructive",
          title: "Application Failed",
          description: res.message || "Failed to submit application. Please try again.",
        })
      }
    } catch (error: any) {
      setStatus(error.message || "An error occurred. Please try again.")
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white pt-16 sm:pt-20 p-6 md:p-10 transition-colors">
      <div className="mx-auto max-w-3xl">
        <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Apply for this Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="resume" className="text-white mb-2 block">
                  Resume <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="resume"
                  type="file"
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setResume(e.target.files?.[0] || null)}
                  className="cursor-pointer border-white/20 bg-white/20 dark:bg-gray-800/50 text-white placeholder:text-white/70 file:mr-4 file:rounded-md file:border-0 file:bg-gradient-to-r file:from-indigo-500 file:to-violet-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:opacity-90 disabled:opacity-50"
                  disabled={loading}
                />
                <p className="text-xs text-white/60 mt-1">PDF, DOC, or DOCX. Max 10MB.</p>
                {resume && (
                  <p className="text-xs mt-1 text-indigo-300">
                    Selected: {resume.name} ({(resume.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="coverLetter" className="text-white mb-2 block">
                  Cover Letter (Optional)
                </Label>
                <Textarea
                  id="coverLetter"
                  placeholder="Write a short cover letter or note to the employer."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={6}
                  className="bg-white/20 dark:bg-gray-800/50 text-white placeholder:text-white/50 border-white/20 resize-none"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !resume}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Submitting…" : "Submit Application"}
              </Button>

              {status && (
                <p
                  className={`text-sm text-center ${
                    status.includes("successfully") || status.includes("notified")
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {status}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

