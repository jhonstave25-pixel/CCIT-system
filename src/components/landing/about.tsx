"use client"

import { motion } from "framer-motion"
import { CalendarDays, Briefcase, ShieldCheck } from "lucide-react"
import { SimpleCounter } from "@/components/ui/simple-counter"

interface AboutProps {
  stats: {
    alumni: number
    events: number
    jobs: number
  }
}

export default function About({ stats }: AboutProps) {
  const statsData = [
    { label: "Verified Alumni", value: stats.alumni },
    { label: "Events", value: stats.events },
    { label: "Jobs", value: stats.jobs },
  ]

  return (
    <motion.section
      id="about"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="relative z-10"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-fuchsia-500/5 rounded-3xl -z-10" />
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            Built for real connections
          </h2>
          <p className="text-white/70">
            CCIT‑Connect bridges graduates, faculty, and industry. Verified alumni profiles, event coordination, and career matching —
            all in one trusted network.
          </p>
          <ul className="text-sm space-y-2 text-white/70">
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" /> Registrar‑verified alumni
            </li>
            <li className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-400" /> Smart events & attendance
            </li>
            <li className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" /> Career opportunities & referrals
            </li>
          </ul>
        </div>
        <div className="relative">
          <div className="rounded-2xl border border-white/10 p-6 bg-black/20 backdrop-blur shadow-xl">
            <div className="grid grid-cols-3 gap-4">
              {statsData.map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white/5 p-4 text-center shadow-lg">
                  <div className="text-2xl font-bold text-white">
                    <SimpleCounter value={stat.value} />
                  </div>
                  <div className="text-xs text-white/60 font-medium mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute -z-10 -bottom-10 -right-6 h-40 w-40 rounded-full bg-indigo-500/30 blur-3xl" />
        </div>
      </div>
    </motion.section>
  )
}


