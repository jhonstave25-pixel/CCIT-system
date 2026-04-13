import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { CalendarDays, Briefcase } from "lucide-react"

// Main Previews section – display only, no interactions
export default function Previews() {
  // Limit teaser items
  const events = [
    { title: "Alumni Tech Summit", date: "Nov 8, 2025", status: "Completed" },
    { title: "President Birthday", date: "Nov 7, 2025", status: "Upcoming" },
  ].slice(0, 3)

  const jobs = [
    { title: "Frontend Developer", company: "JRMSU Partner", type: "Full-time", salary: "₱30,000+" },
    { title: "IT Support Associate", company: "Local SME", type: "Contract", salary: "₱25,000+" },
    { title: "Data Analyst (Intern)", company: "Startup", type: "Internship", salary: "₱15,000+" },
  ].slice(0, 3)

  return (
    <section id="previews" className="space-y-10">
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Events preview */}
        <Card className="rounded-xl border-border/30 bg-card/40 border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <CalendarDays className="w-4 h-4" /> Latest Events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.map((e) => (
              <div key={e.title} className="rounded-lg bg-white/5 p-3">
                <p className="font-medium text-white">{e.title}</p>
                <p className="text-xs text-white/60 mt-1">
                  {e.status} • {e.date}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Jobs preview */}
        <Card className="rounded-xl border-border/30 bg-card/40 border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white">
              <Briefcase className="w-4 h-4" /> Latest Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {jobs.map((j) => (
              <div key={j.title} className="rounded-lg bg-white/5 p-3">
                <p className="font-medium text-white">{j.title}</p>
                <p className="text-xs text-white/60 mt-1">
                  {j.company} • {j.type}
                </p>
                <p className="text-xs text-indigo-300 mt-1">{j.salary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

