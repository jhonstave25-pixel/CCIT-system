"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContentFormModal } from "@/components/admin/content-form-modal"
import { createJob, updateJob, deleteJob } from "@/actions/job.actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, Briefcase, MapPin, Building2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Job {
  id: string
  title: string
  company: string
  description: string
  location: string
  jobType: string
  isActive: boolean
  featured: boolean
  isRemote: boolean
  expiresAt: Date | null
  createdAt: Date
  postedBy: {
    name: string | null
    email: string
  }
}

interface JobsManagementClientProps {
  jobs: Job[]
}

export function JobsManagementClient({ jobs: initialJobs }: JobsManagementClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null)

  const jobFields = [
    { name: "title", label: "Job Title", type: "text" as const, required: true, placeholder: "e.g., Senior Software Engineer" },
    { name: "company", label: "Company", type: "text" as const, required: true, placeholder: "Company name" },
    { name: "location", label: "Location", type: "text" as const, required: true, placeholder: "City, Country" },
    {
      name: "jobType",
      label: "Job Type",
      type: "select" as const,
      required: true,
      options: [
        { label: "Full-Time", value: "FULL_TIME" },
        { label: "Part-Time", value: "PART_TIME" },
        { label: "Contract", value: "CONTRACT" },
        { label: "Internship", value: "INTERNSHIP" },
        { label: "Freelance", value: "FREELANCE" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select" as const,
      required: true,
      options: [
        { label: "Draft", value: "DRAFT" },
        { label: "Review", value: "REVIEW" },
        { label: "Published", value: "PUBLISHED" },
        { label: "Paused", value: "PAUSED" },
        { label: "Expired", value: "EXPIRED" },
      ],
    },
    { name: "description", label: "Description", type: "textarea" as const, required: true, placeholder: "Job description..." },
    { name: "requirements", label: "Requirements", type: "textarea" as const, placeholder: "Required skills and qualifications..." },
    { name: "salaryRange", label: "Salary Range", type: "text" as const, placeholder: "e.g., ₱80,000 - ₱120,000" },
    { name: "applicationUrl", label: "Application URL", type: "text" as const, placeholder: "https://..." },
    { name: "applicationEmail", label: "Application Email", type: "text" as const, placeholder: "jobs@company.com" },
    { name: "expiresAt", label: "Expires At", type: "date" as const, placeholder: "Select expiration date" },
    { name: "isRemote", label: "Remote Work", type: "checkbox" as const, placeholder: "This is a remote position" },
    { name: "featured", label: "Featured", type: "checkbox" as const, placeholder: "Feature this job posting" },
    { name: "isActive", label: "Active", type: "checkbox" as const, placeholder: "Job is currently active" },
  ]

  const handleCreate = async (values: Record<string, any>) => {
    const result = await createJob(values)
    if (result.success) {
      router.refresh()
    }
    return result
  }

  const handleUpdate = async (values: Record<string, any>) => {
    if (!editingJob) return { success: false, error: "No job selected" }
    const result = await updateJob(editingJob.id, values)
    if (result.success) {
      router.refresh()
    }
    return result
  }

  const handleDelete = async () => {
    if (!deleteJobId) return

    const result = await deleteJob(deleteJobId)
    if (result.success) {
      toast({
        title: "Success",
        description: "Job deleted successfully.",
      })
      setDeleteJobId(null)
      router.refresh()
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to delete job",
      })
    }
  }


  const getJobTypeColor = (type: string) => {
    switch (type) {
      case "FULL_TIME":
        return "bg-blue-400/15 border-blue-300/30 text-blue-200"
      case "PART_TIME":
        return "bg-emerald-400/15 border-emerald-300/30 text-emerald-200"
      case "CONTRACT":
        return "bg-purple-400/15 border-purple-300/30 text-purple-200"
      case "INTERNSHIP":
        return "bg-violet-400/15 border-violet-300/30 text-violet-200"
      default:
        return "bg-gray-400/15 border-gray-300/30 text-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Manage Jobs</h1>
          <p className="text-white/70 mt-2">
            Create and manage job postings for alumni
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingJob(null)
            setOpen(true)
          }}
          className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Job
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
        {initialJobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60">No job postings yet. Click "New Job" to create your first posting.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/10 border-b border-white/10">
                  <TableHead className="text-white/80">Title</TableHead>
                  <TableHead className="text-white/80">Company</TableHead>
                  <TableHead className="text-white/80">Location</TableHead>
                  <TableHead className="text-white/80">Type</TableHead>
                  <TableHead className="text-white/80">Status</TableHead>
                  <TableHead className="text-white/80">Posted By</TableHead>
                  <TableHead className="text-right text-white/80">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialJobs.map((job) => (
                  <TableRow key={job.id} className="border-b border-white/10 hover:bg-white/5">
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        {job.title}
                        {job.featured && (
                          <Badge className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-white/60" />
                        <span className="text-white/90">{job.company}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-white/60" />
                        <span className="text-sm text-white/90">
                          {job.location}
                          {job.isRemote && (
                            <Badge className="ml-2 bg-emerald-400/15 border-emerald-300/30 text-emerald-200">
                              Remote
                            </Badge>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getJobTypeColor(job.jobType)}>
                        {job.jobType.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          job.isActive
                            ? "bg-emerald-400/15 border-emerald-300/30 text-emerald-200"
                            : "bg-gray-400/15 border-gray-300/30 text-gray-200"
                        }
                      >
                        {job.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-white/80">
                      {job.postedBy.name || job.postedBy.email}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/80 hover:bg-white/10"
                          onClick={() => {
                            setEditingJob(job)
                            setOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-300 hover:bg-red-500/20"
                          onClick={() => setDeleteJobId(job.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ContentFormModal
        title={editingJob ? "Edit Job" : "Create New Job"}
        mode={editingJob ? "edit" : "create"}
        open={open}
        onOpenChange={setOpen}
        fields={jobFields}
        defaultValues={
          editingJob
            ? {
                ...editingJob,
                expiresAt:
                  editingJob.expiresAt && editingJob.expiresAt instanceof Date
                    ? new Date(editingJob.expiresAt).toISOString().split("T")[0]
                    : editingJob.expiresAt || "",
              }
            : {}
        }
        onSubmit={editingJob ? handleUpdate : handleCreate}
        description={
          editingJob
            ? "Update the job posting details below."
            : "Fill in the details to create a new job posting."
        }
      />

      <AlertDialog open={!!deleteJobId} onOpenChange={(open) => !open && setDeleteJobId(null)}>
        <AlertDialogContent className="bg-gray-900 border border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This action cannot be undone. This will permanently delete the job posting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

