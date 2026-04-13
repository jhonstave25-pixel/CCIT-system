import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export function RecommendedForYou({
  items,
}: {
  items: {
    jobs: { id: string; title: string; org: string }[]
    events: { id: string; title: string; date: string }[]
  }
}) {
  return (
    <Card className="lg:col-span-2 border-white/10 bg-white/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-white">Recommended for You</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 pt-0">
        <div>
          <p className="mb-1 text-xs uppercase text-white/60">Jobs</p>
          {items.jobs.length === 0 ? (
            <p className="text-sm text-white/60">
              No suggestions yet — try completing your profile.
            </p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {items.jobs.map((j) => (
                <li key={j.id} className="rounded-lg border border-white/10 p-3 text-sm bg-white/5">
                  <p className="font-medium text-white">{j.title}</p>
                  <p className="text-white/60">{j.org}</p>
                  <Link href={`/jobs/${j.id}`} className="text-xs underline text-indigo-300 hover:text-indigo-200">
                    See details
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-1 text-xs uppercase text-white/60">Events</p>
          {items.events.length === 0 ? (
            <p className="text-sm text-white/60">No events yet — check back later.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {items.events.map((e) => (
                <li key={e.id} className="rounded-lg border border-white/10 p-3 text-sm bg-white/5">
                  <p className="font-medium text-white">{e.title}</p>
                  <p className="text-white/60">{e.date}</p>
                  <Link href={`/events/${e.id}`} className="text-xs underline text-indigo-300 hover:text-indigo-200">
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


