"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { prefersReducedMotion } from "@/lib/performance/animation-config"

const primaryBtn = "bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-400/40"
const secondaryBtn = "border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30 focus:ring-2 focus:ring-white/20 transition-colors duration-150"

export default function Hero() {
  const reducedMotion = prefersReducedMotion()

  return (
    <section
      className="relative overflow-hidden py-12 min-h-[60vh] flex items-center z-10 animate-in fade-in duration-300"
    >
      {/* Static mesh gradient (removed expensive animation) */}
      <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_65%)]">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,rgba(99,102,241,0.35),transparent_60%)]" />
        {!reducedMotion && (
          <div className="absolute -top-10 -right-10 h-80 w-80 rounded-full blur-3xl bg-fuchsia-600/20" />
        )}
      </div>

      <div className="text-center space-y-6">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white animate-in fade-in slide-in-from-bottom-4 duration-300">
          Welcome to Your{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-300">
            Alumni Community
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-white/70 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-75">
          Connect with graduates, explore opportunities, attend events, and grow your professional network.
        </p>
        <div className="flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-150">
          <Link href="/register">
            <Button size="lg" className={primaryBtn + " rounded-xl px-6"}>Join Now</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary" className={secondaryBtn + " rounded-xl px-6"}>Sign In</Button>
          </Link>
        </div>
        <p className="text-xs text-white/50">
          Powered by JRMSU–CCIT • Privacy-first • Registrar-verified alumni
        </p>
      </div>
    </section>
  )
}




