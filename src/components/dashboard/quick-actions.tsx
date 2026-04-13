"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDays, Users, Briefcase, Images } from "lucide-react"
import Link from "next/link"

interface QuickActionsProps {
  userRole?: string
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const allowedRoles = ["ALUMNI", "FACULTY"]
  const actions = allowedRoles.includes(userRole || "")
    ? [
        { href: "/events", title: "Browse Events", desc: "Join gatherings, workshops, reunions.", icon: CalendarDays },
        { href: "/connections", title: "View Connections", desc: "Expand your alumni network.", icon: Users },
        { href: "/jobs", title: "View Jobs", desc: "Discover verified opportunities.", icon: Briefcase },
        { href: "/gallery", title: "Gallery", desc: "Browse alumni photos & videos.", icon: Images },
      ]
    : [
        { href: "/events", title: "Browse Events", desc: "Join gatherings, workshops, reunions.", icon: CalendarDays },
        { href: "/jobs", title: "View Jobs", desc: "Discover verified opportunities.", icon: Briefcase },
        { href: "/gallery", title: "Gallery", desc: "Browse alumni photos & videos.", icon: Images },
      ]

  return (
    <div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
      {actions.map(({ href, title, desc, icon: Icon }) => (
        <Card key={href} className="transition hover:scale-[1.02] hover:shadow-lg border-white/10 bg-white/5">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <div className="rounded-xl bg-indigo-600/20 p-2">
              <Icon className="size-5 text-indigo-300 transition group-hover:animate-pulse" />
            </div>
            <CardTitle className="text-base text-white">{title}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-white/70">
            <p>{desc}</p>
            <Button asChild size="sm" className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white">
              <Link href={href}>Explore</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


