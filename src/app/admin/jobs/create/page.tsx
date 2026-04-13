"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { createJob } from "@/actions/job.actions"
import { uploadFiles } from "@/actions/upload.actions"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Uploader } from "@/components/shared/uploader"

const jobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  company: z.string().min(2, "Company name is required"),
  location: z.string().min(2, "Location is required"),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP", "FREELANCE"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.string().optional(),
  salaryRange: z.string().optional(),
  applicationUrl: z.string().url().optional().or(z.literal("")),
  applicationEmail: z.string().email().optional().or(z.literal("")),
  expiresAt: z.string().optional(),
  isRemote: z.boolean().optional(),
  featured: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

type JobFormData = z.infer<typeof jobSchema>

export default function CreateJobPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [attachments, setAttachments] = useState<File[]>([])

  const form = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      jobType: "FULL_TIME",
      isRemote: false,
      featured: false,
      isActive: true,
    },
  })

  const onSubmit = (data: JobFormData) => {
    startTransition(async () => {
      // Upload attachments first
      let uploaded = [] as Awaited<ReturnType<typeof uploadFiles>>

      if (attachments.length > 0) {
        const fd = new FormData()
        attachments.forEach((f) => fd.append("files", f))
        uploaded = await uploadFiles(fd)
      }

      const result = await createJob({
        ...data,
        isRemote: data.isRemote || false,
        featured: data.featured || false,
        isActive: data.isActive ?? true,
        attachments: uploaded,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Job posting created successfully!",
        })
        router.push("/admin/jobs")
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to create job posting",
        })
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white py-12 px-6 transition-colors">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin/jobs"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Link>

        <Card className="w-full bg-white/10 dark:bg-indigo-950/30 border border-white/20 dark:border-indigo-800/30 backdrop-blur-xl text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Create New Job</CardTitle>
            <p className="text-white/70 text-sm">Fill in the details to create a new job posting.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label className="text-white">Job Title *</Label>
                <Input
                  {...form.register("title")}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Senior Developer"
                />
                {form.formState.errors.title && (
                  <p className="text-red-300 text-xs mt-1">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <Label className="text-white">Company *</Label>
                <Input
                  {...form.register("company")}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="LNHS"
                />
                {form.formState.errors.company && (
                  <p className="text-red-300 text-xs mt-1">{form.formState.errors.company.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Location *</Label>
                  <Input
                    {...form.register("location")}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="Calamba"
                  />
                  {form.formState.errors.location && (
                    <p className="text-red-300 text-xs mt-1">{form.formState.errors.location.message}</p>
                  )}
                </div>
                <div>
                  <Label className="text-white">Job Type *</Label>
                  <Select
                    value={form.watch("jobType")}
                    onValueChange={(value) => form.setValue("jobType", value as any)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border border-white/20">
                      <SelectItem value="FULL_TIME">Full-time</SelectItem>
                      <SelectItem value="PART_TIME">Part-time</SelectItem>
                      <SelectItem value="CONTRACT">Contract</SelectItem>
                      <SelectItem value="INTERNSHIP">Internship</SelectItem>
                      <SelectItem value="FREELANCE">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-white">Description *</Label>
                <Textarea
                  {...form.register("description")}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[120px]"
                  placeholder="Job details..."
                />
                {form.formState.errors.description && (
                  <p className="text-red-300 text-xs mt-1">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div>
                <Label className="text-white">Requirements</Label>
                <Textarea
                  {...form.register("requirements")}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[80px]"
                  placeholder="Required skills..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Salary Range</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none">₱</span>
                    <Input
                      {...form.register("salaryRange")}
                      type="text"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-7"
                      placeholder="e.g., 80,000 - 120,000"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white">Expires At</Label>
                  <Input
                    {...form.register("expiresAt")}
                    type="date"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Application URL</Label>
                  <Input
                    {...form.register("applicationUrl")}
                    type="url"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label className="text-white">Application Email</Label>
                  <Input
                    {...form.register("applicationEmail")}
                    type="email"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="jobs@company.com"
                  />
                </div>
              </div>

              {/* Attachments Upload */}
              <div>
                <Label className="text-white">Attachments (resumes/specs)</Label>
                <Uploader
                  accept=".pdf,.doc,.docx,.zip"
                  multiple
                  maxFiles={10}
                  maxSizeMB={25}
                  note="Allowed: PDF/DOC/DOCX/ZIP • up to 25MB each"
                  onChange={setAttachments}
                  cta="Select Files"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:from-indigo-600 hover:to-violet-700"
                >
                  {isPending ? "Creating..." : "Create Job"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

