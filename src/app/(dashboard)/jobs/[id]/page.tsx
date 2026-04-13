import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { JobApplicationForm } from "@/components/alumni/job-application-form"
import { JobRecommendButton } from "@/components/jobs/job-recommend-button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Briefcase, MapPin, Building2, Clock, DollarSign, ExternalLink, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const { id } = await params
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      postedBy: {
        select: {
          name: true,
        },
      },
      attachments: true,
    },
  })

  if (!job) {
    notFound()
  }

  // Check if user has already applied
  const existingApplication = await prisma.jobApplication.findUnique({
    where: {
      jobId_applicantId: {
        jobId: id,
        applicantId: session.user.id,
      },
    },
  })

  const formatJobType = (type: string) => {
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white pt-16 sm:pt-20 p-6 md:p-10 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back Button */}
        <Link href="/jobs">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            ← Back to Jobs
          </Button>
        </Link>

        {/* Job Details Card */}
        <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-2xl font-bold">{job.title}</CardTitle>
                  {job.featured && (
                    <Badge className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0">
                      Featured
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-indigo-200 mb-2">
                  <Building2 className="w-5 h-5" />
                  <span className="text-lg font-semibold">{job.company}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
                {job.isRemote && (
                  <Badge variant="outline" className="ml-2 border-white/20 text-white/70 text-xs">
                    Remote
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatJobType(job.jobType)}</span>
              </div>
              {job.salaryRange && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>{job.salaryRange}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge className={getJobTypeColor(job.jobType)}>
                {formatJobType(job.jobType)}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Job Description</h3>
              <p className="text-white/80 whitespace-pre-wrap">{job.description}</p>
            </div>

            {job.requirements && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                <p className="text-white/80 whitespace-pre-wrap">{job.requirements}</p>
              </div>
            )}

            {job.attachments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Attachments</h3>
                <div className="space-y-2">
                  {job.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{attachment.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-white/20">
              {job.applicationUrl && (
                <Button
                  asChild
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90"
                >
                  <a
                    href={job.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    Apply via Website <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
              {job.applicationEmail && (
                <Button
                  asChild
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <a
                    href={`mailto:${job.applicationEmail}?subject=Application for ${job.title}`}
                    className="flex items-center gap-2"
                  >
                    Email Application <Mail className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Application Form or Recommendation */}
        {session.user.role === "FACULTY" ? (
          <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recommend an Alumni</h3>
              <p className="text-sm text-white/70 mb-4">
                As a faculty member, you can recommend verified alumni for this position.
              </p>
              <div className="flex justify-start">
                <JobRecommendButton jobId={job.id} jobTitle={job.title} size="default" />
              </div>
            </CardContent>
          </Card>
        ) : !existingApplication ? (
          <div className="space-y-4">
            <JobApplicationForm jobId={job.id} />
            <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-white/70 mb-3">Or apply using our dedicated application page</p>
                <Button asChild className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90">
                  <Link href={`/jobs/${job.id}/apply`}>Go to Application Page</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
            <CardContent className="p-6 text-center">
              <p className="text-lg font-semibold mb-2">You have already applied for this position</p>
              <div className="text-sm text-white/70 flex items-center justify-center gap-2">
                <span>Application Status:</span>
                <Badge className="ml-2">{existingApplication.status}</Badge>
              </div>
              <p className="text-xs text-white/60 mt-2">
                Applied on {new Date(existingApplication.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

