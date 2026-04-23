"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

const primaryBtn = "bg-red-800 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-600/40"
const secondaryBtn = "border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30 focus:ring-2 focus:ring-white/20 transition-colors duration-150"

export default function JoinCTA() {
  return (
    <motion.section
      id="join"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5 }}
      className="relative text-center space-y-6 z-10"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800/10 rounded-3xl -z-10" />
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
        Be part of the growing CCIT Alumni Network
      </h2>
      <p className="max-w-xl mx-auto text-white/70">
        Create your verified alumni profile, connect with peers, and never miss opportunities again.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link href="/request-account">
          <Button size="lg" className={primaryBtn + " rounded-xl px-6"}>Join Now</Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="secondary" className={secondaryBtn + " rounded-xl px-6"}>Sign In</Button>
        </Link>
      </div>
    </motion.section>
  )
}




