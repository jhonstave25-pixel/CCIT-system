"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { CalendarDays, Briefcase, Users, TrendingUp, ImageIcon, Shield } from "lucide-react"
import { VerificationRequestButton } from "./verification-request-button"

interface DashboardClientProps {
  userName: string
  userEmail: string
  userImage: string | null
  userRole?: string
  stats: {
    eventCount: number
    connectionCount: number
    jobCount: number
    eventsJoined: number
    jobsApplied: number
  }
}

export function DashboardClient({ userName, userEmail, userImage, userRole, stats }: DashboardClientProps) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const allowedRoles = ["ALUMNI", "FACULTY"]
  const cards = allowedRoles.includes(userRole || "")
    ? [
        {
          title: "Browse Events",
          description: "Join alumni gatherings, workshops, and reunions.",
          href: "/events",
          icon: <CalendarDays className="h-6 w-6" />,
          gradient: "from-indigo-500 to-indigo-700",
          hoverGradient: "from-indigo-600 to-indigo-800",
        },
        {
          title: "View Connections",
          description: "Expand your alumni network and connect with peers.",
          href: "/connections",
          icon: <Users className="h-6 w-6" />,
          gradient: "from-emerald-500 to-teal-600",
          hoverGradient: "from-emerald-600 to-teal-700",
        },
        {
          title: "View Jobs",
          description: "Discover job opportunities from verified partners.",
          href: "/jobs",
          icon: <Briefcase className="h-6 w-6" />,
          gradient: "from-blue-500 to-violet-600",
          hoverGradient: "from-blue-600 to-violet-700",
        },
        {
          title: "Gallery",
          description: "Browse photos and videos from alumni events.",
          href: "/gallery",
          icon: <ImageIcon className="h-6 w-6" />,
          gradient: "from-purple-500 to-pink-600",
          hoverGradient: "from-purple-600 to-pink-700",
        },
      ]
    : [
        {
          title: "Browse Events",
          description: "Join alumni gatherings, workshops, and reunions.",
          href: "/events",
          icon: <CalendarDays className="h-6 w-6" />,
          gradient: "from-indigo-500 to-indigo-700",
          hoverGradient: "from-indigo-600 to-indigo-800",
        },
        {
          title: "View Jobs",
          description: "Discover job opportunities from verified partners.",
          href: "/jobs",
          icon: <Briefcase className="h-6 w-6" />,
          gradient: "from-blue-500 to-violet-600",
          hoverGradient: "from-blue-600 to-violet-700",
        },
        {
          title: "Gallery",
          description: "Browse photos and videos from alumni events.",
          href: "/gallery",
          icon: <ImageIcon className="h-6 w-6" />,
          gradient: "from-purple-500 to-pink-600",
          hoverGradient: "from-purple-600 to-pink-700",
        },
      ]

  const statCards = [
    { label: "Events Joined", value: stats.eventsJoined, icon: <CalendarDays className="h-5 w-5" /> },
    { label: "Connections", value: stats.connectionCount, icon: <Users className="h-5 w-5" /> },
    { label: "Jobs Applied", value: stats.jobsApplied, icon: <Briefcase className="h-5 w-5" /> },
    { label: "Certificates", value: 0, icon: <TrendingUp className="h-5 w-5" /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white pt-16 sm:pt-20 transition-colors">
      {/* Welcome Section */}
      <section className="text-center pt-12 sm:pt-16 pb-16 px-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto space-y-4"
        >
          <div className="flex justify-center mb-4">
            <Avatar className="h-20 w-20 border-4 border-white/30 shadow-xl">
              {userImage ? (
                <AvatarImage src={userImage} alt={userName} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-blue-300 via-indigo-300 to-violet-300 bg-clip-text text-transparent">
              {userName}!
            </span>{" "}
            🎓
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Reconnect, explore events, and discover career opportunities.
          </p>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-12">
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={card.href} className="block h-full">
                <Card className="group h-full rounded-2xl bg-white/95 dark:bg-indigo-950/90 backdrop-blur-[2px] border-0 shadow-xl hover:shadow-2xl transition-[transform,box-shadow] duration-150 hover:scale-[1.02] hover:-translate-y-1">
                  <CardHeader className="flex flex-col items-start space-y-4 pb-4">
                    <div
                      className={`p-4 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg group-hover:bg-gradient-to-br group-hover:${card.hoverGradient} transition-transform duration-150 group-hover:scale-105`}
                    >
                      {card.icon}
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                      {card.description}
                    </CardDescription>
                    <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-2 transition-transform">
                      <span>Explore</span>
                      <svg
                        className="w-5 h-5 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6"
        >
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
            >
              <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-[2px] border border-white/20 dark:border-indigo-800/30 text-center rounded-2xl p-6 hover:bg-white/20 dark:hover:bg-indigo-950/40 transition-[transform,box-shadow,background-color] duration-150 hover:scale-[1.02] hover:shadow-xl">
                <div className="flex justify-center mb-3 text-white/80">{stat.icon}</div>
                <h3 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  {stat.value}
                </h3>
                <p className="text-sm text-white/80 font-medium">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Verification Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="max-w-md mx-auto"
        >
          <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-[2px] border border-white/20 dark:border-indigo-800/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Alumni Verification</h3>
                <p className="text-sm text-white/70">Get verified to unlock all features</p>
              </div>
            </div>
            <VerificationRequestButton />
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
