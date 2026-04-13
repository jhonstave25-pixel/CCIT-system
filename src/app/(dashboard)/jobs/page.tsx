import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { JobsListClient } from "@/components/jobs/jobs-list-client"

export default async function JobsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const jobs = await prisma.job.findMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      postedBy: {
        select: {
          name: true,
        },
      },
    },
    take: 50,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white pt-16 sm:pt-20 p-6 md:p-10 transition-colors">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Job Board</h1>
        <p className="text-white/70 mb-10">Discover exciting career opportunities</p>

        <JobsListClient initialJobs={jobs} />
      </div>
    </div>
  )
}

