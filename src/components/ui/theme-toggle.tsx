"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme" className="rounded-full bg-slate-800/50 hover:bg-slate-700" disabled>
        <Sun className="h-5 w-5 text-yellow-400" />
      </Button>
    )
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme
  const isDark = currentTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`rounded-full transition-colors ${
        isDark 
          ? "bg-white hover:bg-slate-100" 
          : "bg-slate-800 hover:bg-slate-700"
      }`}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-slate-300" />
      )}
    </Button>
  )
}

