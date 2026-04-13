"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageSquare } from "lucide-react"

const quotes = [
  {
    name: "A. Dela Cruz",
    role: "BSIT 2023",
    text: "Found my first dev role through CCIT-Connect. The network is real.",
    initials: "AD",
  },
  {
    name: "M. Santos",
    role: "BSCpE 2022",
    text: "Events + verified profiles made it easy to reconnect with batchmates.",
    initials: "MS",
  },
  {
    name: "K. Lim",
    role: "BSCS 2024",
    text: "I like the privacy and trust — records are registrar-linked.",
    initials: "KL",
  },
]

export default function Testimonials() {
  return (
    <motion.section
      id="community"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="relative space-y-8 z-10"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-fuchsia-500/5 rounded-3xl -z-10" />
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">What alumni are saying</h2>
        <p className="text-white/70">Real stories from the CCIT community</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {quotes.map((q, i) => (
          <motion.div
            key={q.name}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            viewport={{ once: true }}
          >
            <Card className="h-full rounded-xl border-border/30 bg-card/40 border-white/10 bg-white/5">
              <CardContent className="p-6 space-y-4">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <p className="text-sm leading-relaxed text-white/80">"{q.text}"</p>
                <div className="flex items-center gap-3 pt-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-indigo-500/20 text-indigo-300">{q.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-white">{q.name}</p>
                    <p className="text-xs text-muted-foreground text-white/60">{q.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.section>
  )
}




