import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Briefcase, CalendarCheck, UserCheck, ClipboardCheck } from "lucide-react"
import type { DashboardUser } from "@/lib/types/dashboard"

export function StatsRow({
  user,
  stats,
}: {
  user: DashboardUser
  stats: {
    jobsAvailable: number
    eventsJoined: number
    connections: number
    jobsApplied: number
  }
}) {
  const items = [
    { label: "Available Jobs", value: stats.jobsAvailable, icon: Briefcase },
    { label: "Events Joined", value: stats.eventsJoined, icon: CalendarCheck },
    { label: "Connections", value: stats.connections, icon: UserCheck },
    { label: "Jobs Applied", value: stats.jobsApplied, icon: ClipboardCheck },
  ]
  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="grid gap-6 p-4 sm:grid-cols-2 md:grid-cols-4">
        {items.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 p-4 bg-white/5">
            <div>
              <p className="text-xs text-white/60">{label}</p>
              <p className="text-2xl font-semibold text-white">{value}</p>
            </div>
            <div className="rounded-xl p-2 bg-indigo-600/20">
              <Icon className="size-5 text-indigo-300" />
            </div>
          </div>
        ))}
        <div className="sm:col-span-2 md:col-span-4 grid gap-3 rounded-xl border border-white/10 p-4 bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="outline" className="text-white/70 border-white/20">
              Last Active: {new Date(user.lastActiveISO).toLocaleString()}
            </Badge>
            <Badge variant="secondary" className="bg-indigo-600/20 text-indigo-300 border-indigo-500/30">
              Profile Completion
            </Badge>
          </div>
          <Progress value={user.profileCompletion} />
        </div>
      </CardContent>
    </Card>
  )
}


