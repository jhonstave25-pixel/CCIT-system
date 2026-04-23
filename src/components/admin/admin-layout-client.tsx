"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Calendar,
  Newspaper,
  Briefcase,
  Images,
  Menu,
  LogOut,
  X,
} from "lucide-react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"

const navItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Events", href: "/admin/events", icon: Calendar },
  { name: "News", href: "/admin/news", icon: Newspaper },
  { name: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { name: "Gallery", href: "/admin/gallery", icon: Images },
]

export function AdminLayoutClient({
  children,
  user,
}: {
  children: React.ReactNode
  user: {
    name?: string | null
    email: string
    image?: string | null
    role: string
  }
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const breadcrumb = useMemo(() => {
    const item =
      navItems.find(
        ({ href }) => pathname === href || (href !== "/admin" && pathname.startsWith(href))
      ) || navItems[0]
    return item?.name || "Dashboard"
  }, [pathname])

  // Handle hydration
  useEffect(() => {
    setMounted(true)
    // Load sidebar state from localStorage
    try {
      const saved = localStorage.getItem("admin-sidebar-collapsed")
      if (saved !== null) {
        const parsed = JSON.parse(saved)
        if (typeof parsed === "boolean") {
          setCollapsed(parsed)
        }
      }
    } catch (error) {
      // If JSON is corrupted, clear it and use default
      console.warn("Failed to parse sidebar state from localStorage:", error)
      localStorage.removeItem("admin-sidebar-collapsed")
    }
  }, [])

  // Save sidebar state to localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("admin-sidebar-collapsed", JSON.stringify(collapsed))
    }
  }, [collapsed, mounted])

  const currentUser = session?.user || user
  const initials = currentUser.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "AD"

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white transition-colors">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-white/10 dark:border-indigo-800/30 bg-white/5 dark:bg-indigo-950/20 backdrop-blur-sm transition-[width,transform] duration-150 ease-in-out",
          collapsed ? "w-20" : "w-64",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo & Toggle */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 dark:border-indigo-800/30 px-4">
          {!collapsed && (
            <h1 className="text-lg font-semibold text-white/90">
              Alumni Admin
            </h1>
          )}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCollapsed(!collapsed)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="space-y-2 p-4">
            <TooltipProvider delayDuration={0}>
              {navItems.map(({ name, href, icon: Icon }) => {
                const active = pathname === href || (href !== "/admin" && pathname.startsWith(href))
                return (
                  <Tooltip key={name}>
                    <TooltipTrigger asChild>
                      <Link
                        href={href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center gap-4 rounded-lg px-4 py-3.5 text-base font-medium transition-colors duration-150",
                          active
                            ? "bg-white/10 text-white shadow-sm"
                            : "text-white/85 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <Icon className="h-6 w-6 shrink-0" />
                        {!collapsed && <span className="truncate">{name}</span>}
                      </Link>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="ml-2">
                        {name}
                      </TooltipContent>
                    )}
                  </Tooltip>
                )
              })}
            </TooltipProvider>
          </nav>
        </ScrollArea>

        {/* User Info (when expanded) */}
        {!collapsed && (
          <div className="border-t border-white/10 dark:border-indigo-800/30 p-4">
            <div className="text-xs text-white/60">
              Logged in as <span className="text-white">{currentUser.name || "Admin"}</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex flex-1 flex-col transition-opacity duration-150 ease-in-out",
          collapsed ? "lg:ml-20" : "lg:ml-64"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 dark:border-indigo-800/30 bg-white/10 dark:bg-indigo-950/20 backdrop-blur-md px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white hover:bg-white/10"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="text-sm font-semibold text-white">
                Admin / {breadcrumb}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-white/10">
                  <Avatar className="h-9 w-9 border-2 border-white/30">
                    <AvatarImage src={currentUser.image || undefined} />
                    <AvatarFallback className="text-xs bg-indigo-700 text-white">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-gradient-to-br from-indigo-950/95 to-purple-950/95 dark:from-slate-900 dark:to-indigo-950 border-white/20 dark:border-indigo-800/30 backdrop-blur-md">
                <DropdownMenuLabel className="text-white">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium text-white">{currentUser.name || "Admin"}</p>
                    <p className="text-xs text-white/70">{currentUser.email}</p>
                    <p className="text-xs text-white/70 capitalize">
                      {currentUser.role.toLowerCase().replace("_", " ")}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/20" />
                <DropdownMenuItem asChild className="text-white hover:bg-white/10 focus:bg-white/10 focus:text-white">
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/20" />
                <DropdownMenuItem
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20 focus:text-red-300 focus:bg-red-500/20"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <section className="p-4 lg:p-6">{children}</section>
        </ScrollArea>
      </main>
    </div>
  )
}


