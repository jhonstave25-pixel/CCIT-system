import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { FacultyDashboardClient } from "@/components/faculty/faculty-dashboard-client"
import { getFacultyKPIs } from "@/lib/get-faculty-kpis"

export default async function FacultyDashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Allow FACULTY, REGISTRAR, DEAN, ADMIN roles
  const allowedRoles = ["FACULTY", "REGISTRAR", "DEAN", "ADMIN"]
  if (!session.user.role || !allowedRoles.includes(session.user.role)) {
    redirect("/dashboard")
  }

  // Check if faculty user is approved (non-faculty roles bypass this check)
  if (session.user.role === "FACULTY" && session.user.status !== "APPROVED") {
    redirect("/pending-approval")
  }

  const kpis = await getFacultyKPIs(session.user.id)

  return <FacultyDashboardClient initialKPIs={kpis} userId={session.user.id} />
}
