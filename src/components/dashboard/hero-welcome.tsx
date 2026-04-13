"use client"

import { motion } from "framer-motion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { DashboardUser } from "@/lib/types/dashboard"
import { useMemo, useState, useEffect } from "react"

const lines = [
  (n: string) => `Good morning, ${n} — here's what's happening in your network.`,
  (n: string) => `Welcome back, ${n}. Ready to explore new events and jobs?`,
  (n: string) => `${n}, your alumni network has new activity today.`,
]

export function HeroWelcome({ user }: { user: DashboardUser }) {
  const name = user.fullName.split(" ")[0]
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % lines.length), 5000)
    return () => clearInterval(t)
  }, [])
  const text = useMemo(() => lines[idx](name), [idx, name])

  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="mb-3 inline-flex items-center justify-center rounded-full border border-white/20 p-1"
      >
        <motion.div
          whileHover={{ rotate: 5 }}
          className="rounded-full p-1 ring-2 ring-transparent hover:ring-4 hover:ring-indigo-400/60 transition"
        >
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-indigo-600/20 text-indigo-300">
              {user.initials}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      </motion.div>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-white">
        Welcome back, <span className="text-indigo-300">{user.fullName}</span>!
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-white/70 min-h-5" aria-live="polite">
        {text}
      </p>
    </div>
  )
}


