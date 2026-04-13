import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getDashboardUrl } from "@/lib/redirects"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Shield } from "lucide-react"
import { RecommendedForYou } from "@/components/dashboard/recommended-for-you"
import { Announcements } from "@/components/dashboard/announcements"
import { NotificationsPanel } from "@/components/dashboard/notifications-panel"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { StatsRow } from "@/components/dashboard/stats-row"
import { EngagementOverview } from "@/components/dashboard/engagement-overview"
import { WeeklyDigest } from "@/components/dashboard/weekly-digest"
import { HeroWelcome } from "@/components/dashboard/hero-welcome"
import FeedbackButton from "@/components/dashboard/feedback-button"
import { getDashboardData } from "@/lib/data/dashboard"
import { getChatNotifications } from "@/lib/get-chat-notifications"
import { VerificationRequestButton } from "@/components/alumni/verification-request-button"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Redirect based on role
  const userRole = session.user.role || "ALUMNI"
  const expectedUrl = getDashboardUrl(userRole)

  // If user is not an alumni, redirect to their appropriate dashboard
  if (userRole !== "ALUMNI" && expectedUrl !== "/dashboard") {
    redirect(expectedUrl)
  }

  // Get real data from database
  const [eventCount, connectionCount, jobCount, eventsJoined, jobsApplied] = await Promise.all([
    prisma.event.count({ where: { status: "UPCOMING" } }),
    prisma.connection.count({
      where: {
        OR: [
          { requesterId: session.user.id },
          { receiverId: session.user.id },
        ],
        status: "ACCEPTED",
      },
    }),
    prisma.job.count({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    }),
    prisma.eventRegistration.count({
      where: { userId: session.user.id },
    }),
    prisma.jobApplication.count({
      where: { applicantId: session.user.id },
    }),
  ])

  // Get real recommended jobs and events
  const [recommendedJobs, recommendedEvents] = await Promise.all([
    prisma.job.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 2,
      select: {
        id: true,
        title: true,
        company: true,
      },
    }),
    prisma.event.findMany({
      where: {
        status: "UPCOMING",
        eventDate: { gte: new Date() },
      },
      orderBy: { eventDate: "asc" },
      take: 1,
      select: {
        id: true,
        title: true,
        eventDate: true,
      },
    }),
  ])

  // Get dashboard data (currently mock, but structure is ready for real data)
  const data = await getDashboardData()
  
  // Get chat notifications (with error handling)
  let chatNotifications: Array<{
    id: string
    text: string
    time: string
    chatId?: string
    type?: string
    isRead?: boolean
  }> = []
  
  try {
    chatNotifications = await getChatNotifications(session.user.id)
  } catch (error) {
    console.error("Error fetching chat notifications:", error)
    // Continue with empty array if there's an error
  }

  // Update user data with real session data
  const user = {
    ...data.user,
    fullName: session.user?.name || "Alumni",
    initials: (session.user?.name || "A")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
    lastActiveISO: new Date().toISOString(),
  }

  // Update stats with real data
  const stats = {
    jobsAvailable: jobCount,
    eventsJoined,
    connections: connectionCount,
    jobsApplied,
  }

  // Update recommended items with real data
  const recommended = {
    jobs: recommendedJobs.map((job) => ({
      id: job.id,
      title: job.title,
      org: job.company,
    })),
    events: recommendedEvents.map((event) => ({
      id: event.id,
      title: event.title,
      date: new Date(event.eventDate).toLocaleDateString("en-US", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      }),
    })),
  }

  return (
    <div className="relative min-h-screen">
      {/* Animated gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-indigo-950 via-purple-900 to-fuchsia-900 animate-gradient opacity-60" />

      <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6">
        <HeroWelcome user={user} />

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <QuickActions userRole={userRole} />
          <Card className="md:col-span-1 order-first md:order-none border-white/10 bg-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-white">Weekly Digest</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <WeeklyDigest digest={data.weeklyDigest} />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <StatsRow user={user} stats={stats} />
        </div>

        {/* Alumni Verification Section - Only show for ALUMNI role */}
        {userRole === "ALUMNI" && (
          <div className="mt-6 max-w-md mx-auto">
            <Card className="border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Alumni Verification</h3>
                  <p className="text-sm text-white/70">Get verified to unlock all features</p>
                </div>
              </div>
              <VerificationRequestButton />
            </Card>
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-white/10 bg-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-white">Your Engagement Overview</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <EngagementOverview eventsSeries={data.eventsSeries} />
            </CardContent>
          </Card>
          <NotificationsPanel items={[...(chatNotifications || []), ...(data.notifications || [])]} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <RecommendedForYou items={recommended} />
          <Announcements items={data.announcements} />
        </div>

        <Separator className="my-8" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="text-sm text-white/70">
            Have an idea to improve CCIT‑Connect?
          </span>
          <FeedbackButton userId={session.user.id} />
        </div>
      </div>
    </div>
  )
}
