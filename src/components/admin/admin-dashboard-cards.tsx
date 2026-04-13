"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Users,
  Briefcase,
  CalendarDays,
  Newspaper,
  Image as GalleryIcon,
  Link2 as ConnectionIcon,
  FileText,
  Activity,
  type LucideIcon,
} from "lucide-react"
import { AnimatedNumber } from "./animated-number"

const iconMap: Record<string, LucideIcon> = {
  Users,
  Briefcase,
  CalendarDays,
  Newspaper,
  Image: GalleryIcon,
  GalleryIcon,
  Link: ConnectionIcon,
  ConnectionIcon,
  FileText,
  Activity,
}

interface DashboardCardProps {
  title: string
  iconName: string
  value: number | string
  desc: string
  link: string
}

export function DashboardCard({ title, iconName, value, desc, link }: DashboardCardProps) {
  const Icon = iconMap[iconName] || Activity

  return (
    <Link href={link} className="group relative h-full">
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-full">
        <Card className="relative flex flex-col h-full min-h-[130px] rounded-xl border-white/20 dark:border-indigo-800/30 bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md hover:bg-white/15 hover:border-indigo-400/40 transition-all duration-200 shadow-lg before:absolute before:bottom-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-indigo-500/50 before:to-violet-500/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-medium text-white/80 truncate pr-2">{title}</CardTitle>
            <Icon className="h-4 w-4 text-indigo-300 group-hover:text-indigo-200 transition-colors flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 pb-4 flex-1 flex flex-col justify-between">
            <div className="text-3xl font-bold text-white">
              <AnimatedNumber value={value} />
            </div>
            <p className="text-xs text-white/60 leading-relaxed">{desc}</p>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}

interface FeedCardProps {
  title: string
  desc: string
  entries?: Array<{ name: string; date: string; role?: string; status?: string }>
  emptyText: string
}

export function FeedCard({ title, desc, entries = [], emptyText }: FeedCardProps) {
  return (
    <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 rounded-xl p-6">
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-tight text-white">{title}</CardTitle>
        <CardDescription className="text-white/70 text-xs leading-snug">{desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {entries.length > 0 ? (
          entries.map((entry, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-1 border-b border-white/10 last:border-0"
            >
              <p className="font-medium text-white/90 truncate max-w-[200px]">{entry.name}</p>
              <p className="text-xs text-white/60">{entry.date}</p>
            </div>
          ))
        ) : (
          <p className="text-xs text-white/50 italic">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  )
}

