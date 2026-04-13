import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { FloatingNavbar } from "@/components/ui/floating-navbar"
import { ConnectionStatus } from "@/components/realtime/connection-status"
import { cn } from "@/lib/utils"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white transition-colors")}>
      <ConnectionStatus />
      <FloatingNavbar />
      <main>{children}</main>
    </div>
  )
}

