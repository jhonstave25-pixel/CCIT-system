import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Eye, Users, Calendar, MapPin, Building2, ExternalLink } from "lucide-react"
import JobPipeline from "./pipeline"
import { RecommendationsManager } from "@/components/admin/recommendations-manager"

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      postedBy: {
        select: {
          name: true,
          email: true,
        },
      },
      applications: {
        include: {
          applicant: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
  })

  if (!job) {
    notFound()
  }

  // Update applicantsCount if out of sync
  if (job.applicantsCount !== job._count.applications) {
    await prisma.job.update({
      where: { id: job.id },
      data: { applicantsCount: job._count.applications },
    })
  }

  const stats = {
    totalApplicants: job.applicantsCount || 0,
    new: job.applications.filter((a) => a.status === "NEW").length,
    shortlisted: job.applications.filter((a) => a.status === "SHORTLISTED").length,
    interview: job.applications.filter((a) => a.status === "INTERVIEW").length,
    hired: job.applications.filter((a) => a.status === "HIRED").length,
    rejected: job.applications.filter((a) => a.status === "REJECTED").length,
    views: job.views || 0,
    conversionRate:
      job.applicantsCount > 0
        ? ((job.applications.filter((a) => a.status === "HIRED").length / job.applicantsCount) * 100).toFixed(1)
        : "0",
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
      <div className="flex items-center gap-4">
        <Link href="/admin/jobs">
          <Button variant="ghost" size="icon" className="text-white/80 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{job.title}</h1>
          <p className="text-white/70 mt-1">Job Details & Analytics</p>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="bg-white/5 border-white/15 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="text-white/70 text-xs mb-1">Views</div>
            <div className="text-2xl font-bold text-white">{stats.views}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/15 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="text-white/70 text-xs mb-1">Total Applicants</div>
            <div className="text-2xl font-bold text-white">{stats.totalApplicants}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/15 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="text-white/70 text-xs mb-1">New</div>
            <div className="text-2xl font-bold text-white">{stats.new}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/15 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="text-white/70 text-xs mb-1">Shortlisted</div>
            <div className="text-2xl font-bold text-white">{stats.shortlisted}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/15 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="text-white/70 text-xs mb-1">Interview</div>
            <div className="text-2xl font-bold text-white">{stats.interview}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/15 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="text-white/70 text-xs mb-1">Hired</div>
            <div className="text-2xl font-bold text-white">{stats.hired}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/15 backdrop-blur-xl">
          <CardContent className="p-4">
            <div className="text-white/70 text-xs mb-1">Conversion Rate</div>
            <div className="text-2xl font-bold text-white">{stats.conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Job Details */}
      <Card className="bg-white/5 border-white/15 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">Job Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-white/60" />
            <span className="text-white/90">{job.company}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-white/60" />
            <span className="text-white/90">
              {job.location}
              {job.isRemote && (
                <Badge className="ml-2 bg-emerald-400/15 border-emerald-300/30 text-emerald-200">
                  Remote
                </Badge>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-white/60" />
            <span className="text-white/90">
              Posted: {new Date(job.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getJobTypeColor(job.jobType)}>
              {job.jobType.replace("_", " ")}
            </Badge>
            <Badge className={getStatusColor(job.status)}>
              {job.status || "DRAFT"}
            </Badge>
            {job.featured && (
              <Badge className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white">
                Featured
              </Badge>
            )}
          </div>
          {job.description && (
            <div>
              <h3 className="text-white font-semibold mb-2">Description</h3>
              <p className="text-white/80 text-sm whitespace-pre-wrap">{job.description}</p>
            </div>
          )}
          {job.requirements && (
            <div>
              <h3 className="text-white font-semibold mb-2">Requirements</h3>
              <p className="text-white/80 text-sm whitespace-pre-wrap">{job.requirements}</p>
            </div>
          )}
          {job.salaryRange && (
            <div>
              <h3 className="text-white font-semibold mb-2">Salary Range</h3>
              <p className="text-white/80 text-sm">{job.salaryRange}</p>
            </div>
          )}
          {job.applicationUrl && (
            <div>
              <a
                href={job.applicationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
              >
                <ExternalLink className="h-4 w-4" />
                Application URL
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Faculty Recommendations */}
      <div id="recommendations" className="scroll-mt-6">
        <RecommendationsManager jobId={job.id} jobTitle={job.title} />
      </div>

      {/* Applicant Pipeline */}
      <div id="applicants" className="scroll-mt-6">
        <JobPipeline jobId={job.id} />
      </div>
    </div>
  )
}

