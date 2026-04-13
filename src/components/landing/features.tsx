"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Briefcase, Users, ShieldCheck } from "lucide-react"

const features = [
  { title: "Verified Alumni Records", desc: "Authentic profiles linked to registrar data.", icon: ShieldCheck },
  { title: "Career Opportunities", desc: "Curated jobs & employer partners.", icon: Briefcase },
  { title: "Smart Events", desc: "Attend, RSVP, and sync with your calendar.", icon: CalendarDays },
  { title: "Meaningful Connections", desc: "Find mentors, classmates, and groups.", icon: Users },
]

export default function Features() {
  return (
    <motion.section
      id="features"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="relative space-y-8 z-10"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-500/5 via-transparent to-indigo-500/5 rounded-3xl -z-10" />
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Everything alumni need, in one place
        </h2>
        <p className="text-white/70">Private, secure, and built for the CCIT community.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <Card className="rounded-xl border-border/30 bg-card/40 hover:border-primary/40 transition">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <Badge variant="outline" className="rounded-full">
                  <f.icon className="w-4 h-4" />
                </Badge>
                <CardTitle className="text-base text-white">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/70">{f.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}




