/**
 * Jobs List Client Component
 * Adds real-time updates via Ably subscriptions
 */

"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"
import { useToast } from "@/hooks/use-toast"
import type { JobUpdatePayload } from "@/lib/ably/types"
import { Briefcase, MapPin, Building2, Clock, ExternalLink } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { JobRecommendButton } from "@/components/jobs/job-recommend-button"

interface Job {
  id: string
  title: string
  company: string
  description: string
  location: string
  isRemote: boolean
  jobType: string
  salaryRange: string | null
  featured: boolean
  createdAt: Date
  expiresAt: Date | null
  applicationUrl?: string | null
  postedBy?: {
    name: string | null
  } | null
}

interface JobsListClientProps {
  initialJobs: Job[]
}

export function JobsListClient({ initialJobs }: JobsListClientProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [jobs, setJobs] = useState<Job[]>(initialJobs)

  // Subscribe to job updates
  useAblyChannel(
    ABLY_CHANNELS.JOBS_ACTIVE,
    ABLY_EVENTS.JOB_POSTED,
    (payload: JobUpdatePayload) => {
      // Add new job to the list
      setJobs((prev) => {
        // Check if job already exists
        if (prev.some((j) => j.id === payload.jobId)) {
          return prev
        }
        // Add new job at the beginning
        return [
          {
            id: payload.jobId,
            title: payload.jobTitle,
            company: payload.company,
            description: "",
            location: "",
            isRemote: false,
            jobType: "",
            salaryRange: null,
            featured: false,
            createdAt: new Date(payload.timestamp),
            expiresAt: null,
          },
          ...prev,
        ]
      })

      toast({
        title: "New Job Posted",
        description: `${payload.jobTitle} at ${payload.company}`,
        action: (
          <button
            onClick={() => router.push(`/jobs/${payload.jobId}`)}
            className="text-sm font-medium underline"
          >
            View
          </button>
        ),
      })
    }
  )

  useAblyChannel(
    ABLY_CHANNELS.JOBS_ACTIVE,
    ABLY_EVENTS.JOB_UPDATED,
    (payload: JobUpdatePayload) => {
      // Update existing job
      setJobs((prev) =>
        prev.map((job) =>
          job.id === payload.jobId
            ? { ...job, title: payload.jobTitle, company: payload.company }
            : job
        )
      )

      toast({
        title: "Job Updated",
        description: `${payload.jobTitle} has been updated`,
        action: (
          <button
            onClick={() => router.push(`/jobs/${payload.jobId}`)}
            className="text-sm font-medium underline"
          >
            View
          </button>
        ),
      })
    }
  )

  // Subscribe to user-specific application status updates
  useAblyChannel(
    session?.user?.id ? ABLY_CHANNELS.JOBS_APPLICATION(session.user.id) : "",
    ABLY_EVENTS.JOB_STATUS,
    (payload: JobUpdatePayload) => {
      toast({
        title: "Application Status Update",
        description: `Your application for ${payload.jobTitle} is now ${payload.status}`,
        action: (
          <button
            onClick={() => router.push(`/jobs/${payload.jobId}`)}
            className="text-sm font-medium underline"
          >
            View
          </button>
        ),
      })
    }
  )

  const getJobTypeColor = (type: string) => {
    switch (type) {
      case "FULL_TIME":
        return "bg-indigo-500/20 border-indigo-300/30 text-indigo-200"
      case "PART_TIME":
        return "bg-violet-500/20 border-violet-300/30 text-violet-200"
      case "CONTRACT":
        return "bg-blue-500/20 border-blue-300/30 text-blue-200"
      case "INTERNSHIP":
        return "bg-purple-500/20 border-purple-300/30 text-purple-200"
      case "FREELANCE":
        return "bg-indigo-500/20 border-indigo-300/30 text-indigo-200"
      default:
        return "bg-white/10 border-white/20 text-white/80"
    }
  }

  const formatJobType = (type: string) => {
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

  return (
    <>
      {jobs.length === 0 ? (
        <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
          <CardContent className="p-12 text-center">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-white/40" />
            <p className="text-lg text-white/80">No job opportunities available at the moment</p>
            <p className="text-sm text-white/60 mt-2">Check back soon for new listings!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-[2px] border-white/20 dark:border-indigo-800/30 text-white hover:bg-white/15 dark:hover:bg-indigo-950/40 transition-[background-color,box-shadow] duration-150 hover:shadow-xl"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="flex items-start gap-2 text-lg font-semibold flex-1">
                    <Briefcase className="w-5 h-5 text-indigo-300 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{job.title}</span>
                  </CardTitle>
                  {job.featured && (
                    <Badge className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0 text-xs">
                      Featured
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-indigo-200">
                  <Building2 className="w-4 h-4" />
                  {job.company}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-white/80 line-clamp-3">{job.description}</p>

                <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                    {job.isRemote && (
                      <Badge variant="outline" className="ml-1 border-white/20 text-white/70 text-xs">
                        Remote
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>{formatJobType(job.jobType)}</span>
                  </div>
                </div>

                {job.salaryRange && (
                  <p className="text-sm font-medium text-indigo-200">
                    {job.salaryRange.replace(/\$/g, "₱")}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge className={getJobTypeColor(job.jobType)}>
                    {formatJobType(job.jobType)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    asChild
                    size="sm"
                    className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90"
                  >
                    <Link href={`/jobs/${job.id}`} className="flex items-center justify-center gap-1.5">
                      <span className="truncate">View Details</span>
                    </Link>
                  </Button>
                  {session?.user?.role === "FACULTY" ? (
                    <JobRecommendButton jobId={job.id} jobTitle={job.title} />
                  ) : job.applicationUrl ? (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/10"
                    >
                      <a
                        href={job.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5"
                      >
                        <span className="truncate">Apply</span>
                        <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/10"
                    >
                      <Link href={`/jobs/${job.id}`} className="flex items-center justify-center gap-1.5">
                        <span className="truncate">Apply</span>
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}





