"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CalendarDays,
  Users,
  BookOpen,
  MessageSquare,
  CheckSquare,
  UserCircle,
  Network,
  type LucideIcon,
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  Users,
  CalendarDays,
  BookOpen,
  MessageSquare,
  CheckSquare,
  UserCircle,
  Network,
}

interface DashboardCardProps {
  title: string
  iconName: string
  value: number
  desc: string
  link: string
}

export function DashboardCard({ title, iconName, value, desc, link }: DashboardCardProps) {
  const Icon = iconMap[iconName] || Users

  return (
    <Link href={link} className="group relative h-full">
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-full">
        <Card className="relative flex flex-col h-full min-h-[140px] rounded-xl border-white/20 dark:border-indigo-800/30 bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md hover:bg-white/15 hover:border-indigo-400/40 transition-all duration-200 shadow-lg before:absolute before:bottom-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-indigo-500/50 before:to-violet-500/40">
          <CardHeader className="flex flex-row items-center justify-between pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-medium text-white/80 truncate pr-2">{title}</CardTitle>
            <Icon className="h-4 w-4 text-indigo-300 group-hover:text-indigo-200 transition-colors flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4 flex-1 flex flex-col justify-between">
            <div className="text-3xl font-bold text-white mb-2">{value}</div>
            <p className="text-xs text-white/60 leading-relaxed">{desc}</p>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}

interface ActionCardProps {
  title: string
  href: string
  iconName: string
}

export function ActionCard({ title, href, iconName }: ActionCardProps) {
  const Icon = iconMap[iconName] || Users

  return (
    <Link href={href} className="group">
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Card className="p-5 flex items-center justify-center gap-2 bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border border-white/20 dark:border-indigo-800/30 hover:border-indigo-400/40 hover:shadow-md hover:bg-white/15 rounded-xl transition-all">
          <Icon className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200 transition-colors" />
          <p className="font-semibold text-sm text-white">{title}</p>
        </Card>
      </motion.div>
    </Link>
  )
}

interface FeedCardProps {
  title: string
  desc: string
  emptyText: string
}

export function FeedCard({ title, desc, emptyText }: FeedCardProps) {
  return (
    <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 rounded-xl p-6">
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-white">{title}</CardTitle>
        <CardDescription className="text-white/70 text-xs leading-snug">{desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-white/50 italic">{emptyText}</div>
      </CardContent>
    </Card>
  )
}

