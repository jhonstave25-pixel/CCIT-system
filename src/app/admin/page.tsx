import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getAdminDashboardData } from "@/lib/get-admin-dashboard"
import { Activity, HardDrive } from "lucide-react"
import { DashboardCard, FeedCard } from "@/components/admin/admin-dashboard-cards"
import { AdminAnalyticsChart } from "@/components/admin/admin-analytics-chart"
import { FeedbackSection } from "@/components/admin/feedback-section"

export default async function AdminDashboardPage() {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const data = await getAdminDashboardData()

  // Sample analytics data (replace with live analytics later)
  const analytics = [
    { week: "Week 1", users: 4, events: 1 },
    { week: "Week 2", users: 6, events: 3 },
    { week: "Week 3", users: 10, events: 2 },
    { week: "Week 4", users: 8, events: 4 },
  ]

  // Calculate today's stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Count users created today
  const todayUsers = data.recentUsers.filter((user: any) => {
    const userDate = new Date(user.createdAt)
    userDate.setHours(0, 0, 0, 0)
    return userDate.getTime() === today.getTime()
  }).length
  
  // Count ongoing events
  const ongoingEvents = data.recentEvents.filter(
    (event: any) => event.status === "ONGOING"
  ).length
  
  const todayPosts = 0 // Can be calculated from posts if needed

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white pt-16 sm:pt-20 transition-colors">
      <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-10 space-y-12 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-black/80 pointer-events-none" />

        {/* Header */}
        <div className="relative space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Welcome back, Admin 🚀
          </h1>
          <p className="text-white/70 text-sm">System overview and engagement summary.</p>
        </div>

        {/* System Status Banner */}
        <section className="bg-gradient-to-r from-indigo-500/20 via-blue-900/40 to-violet-800/30 rounded-xl p-4 border border-white/20 flex flex-wrap md:flex-nowrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-white/90">
            <Activity className="w-4 h-4 text-emerald-400" /> Uptime:{" "}
            <span className="font-semibold text-emerald-400">100%</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/90">
            <HardDrive className="w-4 h-4 text-blue-400" /> Response Time:{" "}
            <span className="font-semibold text-blue-400">124ms</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/90">
            <HardDrive className="w-4 h-4 text-violet-400" /> Storage:{" "}
            <span className="font-semibold text-violet-400">73% used</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/90">
            <Activity className="w-4 h-4 text-pink-400" /> Queue:{" "}
            <span className="font-semibold text-pink-400">0 pending jobs</span>
          </div>
        </section>

        {/* Dashboard Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
          <DashboardCard
            title="Alumni"
            iconName="Users"
            value={data.alumni}
            desc="Total alumni members"
            link="/admin/users?role=ALUMNI"
          />
          <DashboardCard
            title="Faculty"
            iconName="Users"
            value={data.faculty}
            desc="Total faculty members"
            link="/admin/users?role=FACULTY"
          />
          <DashboardCard
            title="Jobs"
            iconName="Briefcase"
            value={data.jobs}
            desc="Active job postings"
            link="/admin/jobs"
          />
          <DashboardCard
            title="Events"
            iconName="CalendarDays"
            value={data.events}
            desc="Total events"
            link="/admin/events"
          />
          <DashboardCard
            title="News"
            iconName="Newspaper"
            value={data.news}
            desc="Published articles"
            link="/admin/news"
          />
          <DashboardCard
            title="Gallery"
            iconName="Image"
            value={data.gallery}
            desc="Photo galleries"
            link="/admin/gallery"
          />
          <DashboardCard
            title="Applications"
            iconName="FileText"
            value={data.applications}
            desc="Job applications"
            link="/admin/jobs"
          />
          <DashboardCard
            title="Connections"
            iconName="Link"
            value={data.connections}
            desc="Total connections"
            link="/admin/users"
          />
          <DashboardCard
            title="Active Systems"
            iconName="Activity"
            value="100%"
            desc="All modules operational"
            link="#"
          />
        </section>

        {/* Analytics Section */}
        <section className="space-y-4 relative">
          <h2 className="text-lg font-semibold tracking-tight text-white border-b border-white/20 pb-2">
            System Analytics
          </h2>
          <p className="text-white/70 text-sm">Weekly overview of user activity and event creation</p>
          <div className="rounded-xl border border-white/20 dark:border-indigo-800/30 bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md p-6 h-[300px]">
            <AdminAnalyticsChart data={analytics} />
          </div>
        </section>

        {/* Activity and Events Feed */}
        <section className="grid md:grid-cols-2 gap-6 relative">
          <FeedCard
            title="Recent Activity"
            desc="New users, alumni, and faculty registrations"
            entries={data.recentUsers}
            emptyText="No recent activity."
          />
          <FeedCard
            title="Recent Events"
            desc="Latest campus or alumni events"
            entries={data.recentEvents}
            emptyText="No recent events."
          />
        </section>

        {/* Recent Feedback */}
        <section className="relative">
          <h2 className="text-lg font-semibold tracking-tight text-white border-b border-white/20 pb-2 mb-4">
            Recent Feedback
          </h2>
          <FeedbackSection />
        </section>

        {/* KPI Summary */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/70 bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border border-white/20 dark:border-indigo-800/30 rounded-xl p-4 text-center">
          <p>{todayUsers} New Users Today</p>
          <p>{todayPosts} New Posts</p>
          <p>{ongoingEvents} Events Ongoing</p>
        </section>
      </main>
    </div>
    </>
  )
}

