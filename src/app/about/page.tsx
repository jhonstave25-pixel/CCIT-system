import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GraduationCap, Users, Briefcase, ShieldCheck, Target, Network } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-[#0b0720] text-foreground">
      {/* Header */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-6">
          <Link href="/">
            <Button variant="ghost" className="text-white hover:text-white/80">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 sm:px-8 py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            About <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-fuchsia-300">CCIT-Connect</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Bridging graduates, employers, and the school in a trusted alumni network
          </p>
        </div>

        {/* Main Content */}
        <Card className="bg-white/5 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
          <CardContent className="p-8 space-y-6">
            <div className="prose prose-invert max-w-none space-y-6">
              <p className="text-white/90 leading-relaxed text-lg">
                The College of Communication, Information & Technology, Inc. (CCIT) in Calamba, Misamis Occidental is a private TVET-oriented institution led by <strong className="text-white">Dr. Rolly T. Baroy</strong>, whose stewardship has kept the school focused on practical, employment-ready training in ICT and allied fields.
              </p>

              <p className="text-white/90 leading-relaxed text-lg">
                To extend that mission beyond graduation, the college built <strong className="text-indigo-300">CCIT-Connect</strong>—an alumni networking and career platform designed to keep graduates, employers, and the school meaningfully linked.
              </p>

              <div className="my-8 p-6 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-violet-500/10 border border-indigo-500/20">
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Target className="w-6 h-6 text-indigo-300" />
                  Our Mission
                </h2>
                <p className="text-white/90 leading-relaxed">
                  CCIT-Connect was created to solve three persistent gaps:
                </p>
                <ol className="list-decimal list-inside space-y-3 mt-4 text-white/90 ml-4">
                  <li>
                    <strong className="text-white">Verifying alumni credentials</strong> quickly and securely (anchored to registrar records/ARMVS proofs)
                  </li>
                  <li>
                    <strong className="text-white">Giving graduates a trusted space</strong> to find jobs, mentorship, and events sourced from partners who recognize CCIT standards
                  </li>
                  <li>
                    <strong className="text-white">Providing the school leadership</strong> with feedback and employment insights that guide curriculum and industry tie-ups
                  </li>
                </ol>
              </div>

              <p className="text-white/90 leading-relaxed text-lg">
                In short, under Dr. Baroy&apos;s leadership, CCIT-Connect turns the end of formal study into a continuing relationship—supporting careers, community projects, and data-informed program improvement while preserving the authenticity of CCIT&apos;s alumni network.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Key Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-white/5 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6 text-indigo-300" />
              </div>
              <h3 className="font-semibold text-lg">Verified Credentials</h3>
              <p className="text-sm text-white/70">
                Secure verification anchored to registrar records and ARMVS proofs
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto">
                <Network className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="font-semibold text-lg">Trusted Network</h3>
              <p className="text-sm text-white/70">
                Connect with employers, mentors, and events from CCIT-recognized partners
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
            <CardContent className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center mx-auto">
                <GraduationCap className="w-6 h-6 text-violet-300" />
              </div>
              <h3 className="font-semibold text-lg">Continuous Growth</h3>
              <p className="text-sm text-white/70">
                Supporting careers, community projects, and data-informed improvements
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Leadership Section */}
        <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-violet-500/10 border border-indigo-500/20 text-white">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">Leadership</h2>
                <p className="text-white/90 leading-relaxed">
                  Under the stewardship of <strong className="text-white">Dr. Rolly T. Baroy</strong>, CCIT has maintained its focus on practical, employment-ready training. CCIT-Connect extends this mission, ensuring that the relationship between the school and its graduates continues to grow and evolve long after graduation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center space-y-4 pt-8">
          <h2 className="text-2xl font-semibold text-white">Join the CCIT-Connect Community</h2>
          <p className="text-white/70">
            Whether you&apos;re a graduate, employer, or current student, CCIT-Connect is here to support your journey.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button asChild className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
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
    </div>
  )
}



