"use client"

import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function WeeklyDigest({
  digest,
}: {
  digest: { jobs: number; connectionRequests: number; events: number }
}) {
  const items = [
    { label: "new jobs", value: digest.jobs, href: "/jobs" },
    { label: "new connection request", value: digest.connectionRequests, href: "/connections" },
    { label: "event this week", value: digest.events, href: "/events" },
  ]
  return (
    <div className="grid gap-2">
      {items.map((i) => (
        <div key={i.label} className="flex items-center justify-between rounded-lg border border-white/10 p-2 text-sm bg-white/5">
          <span className="text-white/70">
            {i.value} {i.label}
          </span>
          <Link href={i.href}>
            <Badge 
              variant="secondary" 
              className="bg-indigo-600/20 text-indigo-300 border-indigo-500/30 cursor-pointer hover:bg-indigo-600/30 transition-colors"
            >
              View
            </Badge>
          </Link>
        </div>
      ))}
    </div>
  )
}


