"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ContentFormModal } from "@/components/admin/content-form-modal"
import { createJob, updateJob, deleteJob } from "@/actions/job.actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2, Briefcase, MapPin, Building2, Search, Filter, X, Eye, Users, CheckCircle, XCircle, UserPlus, Info } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"

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
  status?: string
  views?: number
  applicantsCount?: number
  hiredCount?: number
  rejectedCount?: number
  recommendationsCount?: number
  pendingRecommendationsCount?: number
  recommendations?: Array<{
    id: string
    status: string
    facultyName: string | null
    facultyEmail: string
    createdAt: Date
  }>
  expiresAt: Date | null
  createdAt: Date
  postedBy: {
    name: string | null
    email: string
  }
}

export function JobsManagementClientEnhanced() {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [featuredFilter, setFeaturedFilter] = useState<string>("")
  const [remoteFilter, setRemoteFilter] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("date")
  const [showArchived, setShowArchived] = useState(false)

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { q: searchQuery }),
        ...(statusFilter && statusFilter !== "all" && { status: statusFilter }),
        ...(typeFilter && typeFilter !== "all" && { type: typeFilter }),
        ...(featuredFilter && { featured: featuredFilter }),
        ...(remoteFilter && { remote: remoteFilter }),
        ...(sortBy && { sort: sortBy }),
        ...(showArchived && { archived: "true" }),
      })

      const response = await fetch(`/api/jobs?${params}`)
      const data = await response.json()

      if (response.ok) {
        setJobs(data.jobs || [])
        setTotalPages(data.pages || 1)
        setTotal(data.total || 0)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to fetch jobs",
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to fetch jobs",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, typeFilter, featuredFilter, remoteFilter, sortBy, showArchived])

  // Subscribe to Ably channels for real-time job and recommendation updates
  useAblyChannel(
    ABLY_CHANNELS.JOBS_ACTIVE,
    ABLY_EVENTS.JOB_POSTED,
    () => {
      fetchJobs()
    }
  )

  useAblyChannel(
    ABLY_CHANNELS.JOBS_ACTIVE,
    ABLY_EVENTS.JOB_UPDATED,
    () => {
      fetchJobs()
    }
  )

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchJobs()
      } else {
        setPage(1)
      }
    }, 500)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

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
      fetchJobs()
      router.refresh()
    }
    return result
  }

  const handleUpdate = async (values: Record<string, any>) => {
    if (!editingJob) return { success: false, error: "No job selected" }
    const result = await updateJob(editingJob.id, values)
    if (result.success) {
      fetchJobs()
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
      fetchJobs()
      router.refresh()
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to delete job",
      })
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setTypeFilter("all")
    setFeaturedFilter("")
    setRemoteFilter("")
    setSortBy("date")
    setShowArchived(false)
    setPage(1)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-emerald-400/15 border-emerald-300/30 text-emerald-200"
      case "DRAFT":
        return "bg-gray-400/15 border-gray-300/30 text-gray-200"
      case "REVIEW":
        return "bg-yellow-400/15 border-yellow-300/30 text-yellow-200"
      case "PAUSED":
        return "bg-orange-400/15 border-orange-300/30 text-orange-200"
      case "EXPIRED":
        return "bg-red-400/15 border-red-300/30 text-red-200"
      default:
        return "bg-gray-400/15 border-gray-300/30 text-gray-200"
    }
  }

  const hasActiveFilters =
    searchQuery || (statusFilter && statusFilter !== "all") || (typeFilter && typeFilter !== "all") || featuredFilter || remoteFilter || showArchived

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

      {/* Search and Filters */}
      <Card className="bg-white/5 border-white/15 backdrop-blur-xl">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                <Input
                  placeholder="Search by title, company, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-indigo-950/95 border-white/20">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="REVIEW">Review</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="PAUSED">Paused</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-indigo-950/95 border-white/20">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="FULL_TIME">Full-Time</SelectItem>
                <SelectItem value="PART_TIME">Part-Time</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="INTERNSHIP">Internship</SelectItem>
                <SelectItem value="FREELANCE">Freelance</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-indigo-950/95 border-white/20">
                <SelectItem value="date">Date (Newest)</SelectItem>
                <SelectItem value="applicants">Most Applicants</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full bg-white/10" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60">No job postings found. Click &quot;New Job&quot; to create your first posting.</p>
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
                  <TableHead className="text-white/80">Stats</TableHead>
                  <TableHead className="text-white/80">Recommendations</TableHead>
                  <TableHead className="text-white/80">Posted By</TableHead>
                  <TableHead className="text-right text-white/80">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} className="border-b border-white/10 hover:bg-white/5">
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2 flex-wrap">
                        {job.title}
                        {job.featured && (
                          <Badge className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white">Featured</Badge>
                        )}
                        {job.recommendationsCount && job.recommendationsCount > 0 && (
                          <Badge className="bg-purple-500/20 border-purple-300/30 text-purple-200 flex items-center gap-1">
                            <UserPlus className="w-3 h-3" />
                            Faculty Recommended
                            {job.pendingRecommendationsCount && job.pendingRecommendationsCount > 0 && (
                              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-bold">
                                {job.pendingRecommendationsCount}
                              </span>
                            )}
                          </Badge>
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
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm text-white/70 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{job.views || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{job.applicantsCount || 0}</span>
                        </div>
                        {job.hiredCount && job.hiredCount > 0 && (
                          <div className="flex items-center gap-1" title={`${job.hiredCount} hired`}>
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-300 font-medium">{job.hiredCount}</span>
                          </div>
                        )}
                        {job.rejectedCount && job.rejectedCount > 0 && (
                          <div className="flex items-center gap-1" title={`${job.rejectedCount} rejected`}>
                            <XCircle className="h-3.5 w-3.5 text-red-400" />
                            <span className="text-red-300 font-medium">{job.rejectedCount}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {job.recommendationsCount && job.recommendationsCount > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 text-sm text-white/90">
                            <UserPlus className="h-3.5 w-3.5 text-purple-300" />
                            <span>{job.recommendationsCount}</span>
                          </div>
                          {job.pendingRecommendationsCount && job.pendingRecommendationsCount > 0 && (
                            <Badge className="bg-purple-500/20 border-purple-300/30 text-purple-200 text-xs">
                              {job.pendingRecommendationsCount} pending
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-white/50">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-white/80">
                      {job.postedBy.name || job.postedBy.email}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {job.recommendationsCount && job.recommendationsCount > 0 && (
                          <Link href={`/admin/jobs/${job.id}#recommendations`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-white/80 hover:bg-purple-500/20 relative"
                              title="View Recommendations"
                            >
                              <UserPlus className="h-4 w-4" />
                              {job.pendingRecommendationsCount && job.pendingRecommendationsCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-purple-500 text-white text-[10px] flex items-center justify-center">
                                  {job.pendingRecommendationsCount}
                                </span>
                              )}
                            </Button>
                          </Link>
                        )}
                        {job.applicantsCount > 0 && (
                          <Link href={`/admin/jobs/${job.id}#applicants`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-white/80 hover:bg-indigo-500/20 relative"
                              title="View Applicants"
                            >
                              <Users className="h-4 w-4" />
                              {job.applicantsCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-indigo-500 text-white text-[10px] flex items-center justify-center">
                                  {job.applicantsCount}
                                </span>
                              )}
                            </Button>
                          </Link>
                        )}
                        <Link href={`/admin/jobs/${job.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/80 hover:bg-white/10"
                            title="View Job Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
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

      {/* Pagination */}
      {!loading && jobs.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/70">
            Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total} jobs
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      )}

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
        <AlertDialogContent className="bg-gradient-to-br from-indigo-950/95 to-purple-950/95 border-white/20 backdrop-blur-md">
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

