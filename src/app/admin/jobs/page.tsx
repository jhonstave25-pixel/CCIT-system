import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { JobsManagementClientEnhanced } from "@/components/admin/jobs-management-client-enhanced"
import JobAnalyticsCards from "./analytics-cards"

export default async function AdminJobsPage() {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <JobAnalyticsCards />
      <JobsManagementClientEnhanced />
    </div>
  )
}
