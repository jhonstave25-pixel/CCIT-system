"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Uploader } from "@/components/shared/uploader"
import { uploadFiles } from "@/actions/upload.actions"
import { applyForJob } from "@/actions/job.actions"
import { Briefcase } from "lucide-react"

interface JobApplicationFormProps {
  jobId: string
}

export function JobApplicationForm({ jobId }: JobApplicationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [resume, setResume] = useState<File[]>([])
  const [coverLetter, setCoverLetter] = useState("")

  const handleSubmit = () => {
    if (resume.length === 0) {
      toast({
        variant: "destructive",
        title: "Resume Required",
        description: "Please upload your resume to apply for this job.",
      })
      return
    }

    startTransition(async () => {
      try {
        // Upload resume
        const fd = new FormData()
        resume.forEach((f) => fd.append("files", f))
        const uploaded = await uploadFiles(fd)

        if (uploaded.length === 0) {
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "Failed to upload resume. Please try again.",
          })
          return
        }

        const result = await applyForJob({
          jobId,
          resumeUrl: uploaded[0].url,
          coverLetter: coverLetter || undefined,
        })

        if (result.success) {
          toast({
            title: "Application Submitted",
            description: "Your application has been submitted successfully!",
          })
          router.refresh()
        } else {
          toast({
            variant: "destructive",
            title: "Application Failed",
            description: result.error || "Failed to submit application. Please try again.",
          })
        }
      } catch (error: any) {
        console.error("Job application error:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error?.message || "An unexpected error occurred. Please try again.",
        })
      }
    })
  }

  return (
    <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Apply for this Position
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="resume" className="text-white mb-2 block">
            Resume <span className="text-red-400">*</span>
          </Label>
          <Uploader
            accept=".pdf,.doc,.docx"
            multiple={false}
            maxFiles={1}
            maxSizeMB={10}
            onChange={setResume}
            cta="Upload Resume"
            note="PDF, DOC, or DOCX format. Max size: 10MB"
          />
        </div>

        <div>
          <Label htmlFor="coverLetter" className="text-white mb-2 block">
            Cover Letter (Optional)
          </Label>
          <Textarea
            id="coverLetter"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Tell us why you're interested in this position..."
            rows={6}
            className="bg-white/20 dark:bg-gray-800/50 text-white placeholder:text-white/50 border-white/20"
            disabled={isPending}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isPending || resume.length === 0}
          className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "Submitting..." : "Submit Application"}
        </Button>
      </CardContent>
    </Card>
  )
}

