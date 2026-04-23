"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

const primaryBtn = "bg-indigo-300 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-600/40"
const secondaryBtn = "border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/30 focus:ring-2 focus:ring-white/20 transition-colors duration-150"

const links = [
  { href: "#about", label: "About" },
  { href: "#features", label: "Features" },
  { href: "#previews", label: "Events & Jobs" },
  { href: "#community", label: "Community" },
]

export default function Navbar() {
  const [activeSection, setActiveSection] = useState("")

  useEffect(() => {
    let currentActiveSection = ""
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150 // Offset for navbar height
      const sections = links.map((l) => l.href.substring(1))
      
      // Find the section that's currently in view
      let newActiveSection = ""
      
      // Check from bottom to top to get the most relevant section
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        const element = document.getElementById(section)
        
        if (element) {
          const rect = element.getBoundingClientRect()
          const elementTop = rect.top + window.scrollY
          const elementBottom = elementTop + rect.height
          
          // Check if scroll position is within this section's bounds
          // Use a threshold to make detection more reliable
          if (scrollPosition >= elementTop - 100 && scrollPosition < elementBottom) {
            newActiveSection = `#${section}`
            break
          }
        }
      }
      
      // If we're at the top of the page, set the first section
      if (scrollPosition < 200 && sections.length > 0) {
        newActiveSection = `#${sections[0]}`
      }
      
      // Only update if the section actually changed
      if (newActiveSection && newActiveSection !== currentActiveSection) {
        currentActiveSection = newActiveSection
        setActiveSection(newActiveSection)
      }
    }

    // Throttle scroll events for better performance
    let ticking = false
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    // Initial check
    handleScroll()
    
    window.addEventListener("scroll", throttledScroll, { passive: true })
    window.addEventListener("resize", handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener("scroll", throttledScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md supports-[backdrop-filter]:bg-black/40 shadow-lg">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight text-white">
              CCIT CONNECT
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              {links.map((l) => {
                const isActive = activeSection === l.href
                return (
                  <a
                    key={l.href}
                    href={l.href}
                    className="relative text-white/70 hover:text-white transition-colors font-medium"
                  >
                    {l.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeSection"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-400 to-fuchsia-400"
                        initial={false}
                        transition={{ 
                          type: "spring", 
                          stiffness: 500, 
                          damping: 35,
                          mass: 0.5
                        }}
                        style={{ originX: 0 }}
                      />
                    )}
                  </a>
                )
              })}
            </nav>
            <div className="flex items-center gap-2">
              <Link href="/request-account">
                <Button size="sm" className={primaryBtn}>Join Now</Button>
              </Link>
              <Link href="/login">
                <Button size="sm" variant="secondary" className={secondaryBtn}>Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



