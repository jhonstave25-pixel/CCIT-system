import Link from "next/link"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { getLandingStats } from "@/lib/get-landing-stats"

// Lazy load heavy components
const AnimatedNavbar = dynamic(() => import("@/components/landing/navbar"), {
  ssr: true,
})

const AnimatedHero = dynamic(() => import("@/components/landing/hero"), {
  ssr: true,
})

const AnimatedAbout = dynamic(() => import("@/components/landing/about"), {
  ssr: true,
})

const AnimatedFeatures = dynamic(() => import("@/components/landing/features"), {
  ssr: true,
})

const Previews = dynamic(() => import("@/components/landing/previews"), {
  ssr: true,
})

const AnimatedTestimonials = dynamic(() => import("@/components/landing/testimonials"), {
  ssr: true,
})

const AnimatedJoinCTA = dynamic(() => import("@/components/landing/join-cta"), {
  ssr: true,
})

// Color tokens
const primaryBtn = "bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-400/40"
const secondaryBtn = "border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30 focus:ring-2 focus:ring-white/20 transition-all duration-200"

export default async function LandingPage() {
  const stats = await getLandingStats()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-[#0b0720] text-foreground relative">
      <AnimatedNavbar />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 pt-28 space-y-20 relative z-10 pb-20">
        <AnimatedHero />

        <AnimatedAbout stats={stats} />

        <AnimatedFeatures />

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-violet-500/5 rounded-3xl -z-10" />
          <Previews />
        </div>

        <AnimatedTestimonials />

        <AnimatedJoinCTA />
      </main>

      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10 text-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-muted-foreground text-white/70">
          © {new Date().getFullYear()} CCIT‑Connect, JRMSU. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-muted-foreground text-white/70">
              <Link href="/about" className="hover:text-foreground hover:text-white transition-colors">
            About
          </Link>
          <Link href="/privacy" className="hover:text-foreground hover:text-white transition-colors">
            Privacy
          </Link>
          <a href="mailto:ccitconnect@jrmsu.edu.ph" className="hover:text-foreground hover:text-white transition-colors">
            Contact
          </a>
        </div>
      </div>
    </footer>
  )
}
