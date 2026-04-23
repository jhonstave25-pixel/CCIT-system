"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Menu, X, Shield } from "lucide-react"
import { EnhancedNotificationCenter } from "@/components/realtime/enhanced-notification-center"

export function FloatingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const isLanding = pathname === "/"

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut({ callbackUrl: "/", redirect: true })
  }

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-[background-color,backdrop-filter,box-shadow] duration-150 ${
        scrolled
          ? "bg-white/10 dark:bg-gray-900/60 backdrop-blur-lg shadow-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className="h-14 sm:h-16 flex items-center rounded-b-xl bg-transparent">
          {/* Left: Brand */}
          <Link href="/" className="select-none">
            <h1 className="text-white/90 font-extrabold tracking-wide text-base sm:text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              CCIT CONNECT
            </h1>
          </Link>

          {isLanding ? (
            /* Landing Page: CTA Buttons */
            <div className="ml-auto flex items-center gap-3">
              <Button
                asChild
                className="h-9 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white px-4 py-2 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                <Link href="/request-account">Join Now</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-9 rounded-lg border-white/20 bg-white/10 text-white px-4 py-2 hover:bg-white/20 hover:border-white/30 focus-visible:ring-2 focus-visible:ring-indigo-300 transition-colors duration-150"
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <ThemeToggle />
            </div>
          ) : (
            <>
              {/* Center: Main links — larger with better spacing (desktop) */}
              {session && (
                <ul className="hidden md:flex mx-auto gap-6 lg:gap-8">
                  {(session?.user?.role === "ALUMNI" || session?.user?.role === "FACULTY" 
                    ? [
                        ["Dashboard", "/dashboard"],
                        ["Profile", "/profile"],
                        ["Events", "/events"],
                        ["Connections", "/connections"],
                        ["Jobs", "/jobs"],
                        ["Gallery", "/gallery"],
                      ]
                    : [
                        ["Dashboard", "/dashboard"],
                        ["Profile", "/profile"],
                        ["Events", "/events"],
                        ["Jobs", "/jobs"],
                        ["Gallery", "/gallery"],
                      ]
                  ).map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`relative text-white/90 hover:text-white transition-all duration-200 ease-out text-[15px] md:text-[16px] lg:text-[18px] font-semibold hover:scale-105 ${
                          pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                            ? "text-white after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-400"
                            : "hover:after:content-[''] hover:after:absolute hover:after:bottom-0 hover:after:left-0 hover:after:w-full hover:after:h-0.5 hover:after:bg-white/50 hover:after:transition-all hover:after:duration-200"
                        }`}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {/* Right: Sign Out and Mobile Menu */}
              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                {session && (
                  <>
                    <EnhancedNotificationCenter />
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="hidden sm:block rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold bg-white/10 text-white hover:bg-white/25 hover:scale-105 backdrop-blur-md transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      {isSigningOut ? "Signing out..." : "Sign Out"}
                    </button>
                    {/* Mobile Menu Button */}
                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="md:hidden p-2 rounded-lg bg-white/10 text-white hover:bg-white/25 hover:scale-105 backdrop-blur-md transition-all duration-200 ease-out active:scale-95"
                      aria-label="Toggle menu"
                    >
                      {mobileMenuOpen ? (
                        <X className="h-5 w-5" />
                      ) : (
                        <Menu className="h-5 w-5" />
                      )}
                    </button>
                  </>
                )}
                <ThemeToggle />
              </div>
            </>
          )}
        </nav>

        {/* Mobile Menu */}
        {!isLanding && session && mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-white/10 backdrop-blur-lg">
            <nav className="px-4 py-4 space-y-2">
              {(session?.user?.role === "ALUMNI" || session?.user?.role === "FACULTY" 
                ? [
                    ["Dashboard", "/dashboard"],
                    ["Profile", "/profile"],
                    ["Events", "/events"],
                    ["Connections", "/connections"],
                    ["Jobs", "/jobs"],
                    ["Gallery", "/gallery"],
                  ]
                : [
                    ["Dashboard", "/dashboard"],
                    ["Profile", "/profile"],
                    ["Events", "/events"],
                    ["Jobs", "/jobs"],
                    ["Gallery", "/gallery"],
                  ]
              ).map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors duration-150 font-semibold ${
                    pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                      ? "bg-white/20 text-white"
                      : ""
                  }`}
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/blocked-users"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors duration-150 font-semibold ${
                  pathname === "/blocked-users" ? "bg-white/20 text-white" : ""
                }`}
              >
                <Shield className="h-4 w-4" />
                Blocked Users
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleSignOut()
                }}
                disabled={isSigningOut}
                className="w-full text-left px-4 py-3 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors duration-150 font-semibold disabled:opacity-50"
              >
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

