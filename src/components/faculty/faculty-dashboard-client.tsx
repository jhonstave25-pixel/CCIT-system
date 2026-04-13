"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/faculty/stat-card"
import { DirectoryTable } from "@/components/faculty/directory-table"
import { EventManager } from "@/components/faculty/event-manager"
import { Inbox } from "@/components/faculty/inbox"
import { VerificationCenter } from "@/components/faculty/verification-center"
import { EngagementCharts } from "@/components/faculty/engagement-charts"
import { Users, CalendarDays, Network, CheckSquare, MessageSquare } from "lucide-react"

interface FacultyDashboardClientProps {
  initialKPIs: {
    totalAlumni: number
    verifiedAlumni: number
    upcomingEvents: number
    connectionsCount: number
    pendingVerifications: number
    unreadMessages: number
  }
  userId: string
}

const FACULTY_TAB_STORAGE_KEY = "faculty-dashboard-active-tab"

export function FacultyDashboardClient({ initialKPIs, userId }: FacultyDashboardClientProps) {
  const [kpis, setKPIs] = useState(initialKPIs)
  const [activeTab, setActiveTab] = useState<string>("directory")

  // Load saved tab from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem(FACULTY_TAB_STORAGE_KEY)
      if (savedTab && ["directory", "events", "messages", "analytics", "verifications"].includes(savedTab)) {
        setActiveTab(savedTab)
      }
    }
  }, [])

  // Save tab to localStorage when it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (typeof window !== "undefined") {
      localStorage.setItem(FACULTY_TAB_STORAGE_KEY, value)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0d2b] via-[#14163d] to-[#1c0f3e] text-white pt-16 sm:pt-20 transition-colors">
      <main className="max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-10 space-y-8">
        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatCard
            title="Alumni Network"
            value={kpis.totalAlumni}
            icon={Users}
            description="Total alumni"
          />
          <StatCard
            title="Upcoming Events"
            value={kpis.upcomingEvents}
            icon={CalendarDays}
            description="Events scheduled"
          />
          <StatCard
            title="Connections"
            value={kpis.connectionsCount}
            icon={Network}
            description="Your connections"
          />
          <StatCard
            title="Pending Approvals"
            value={kpis.pendingVerifications}
            icon={CheckSquare}
            description="Verification requests"
            badge={kpis.pendingVerifications > 0 ? kpis.pendingVerifications : undefined}
          />
          <StatCard
            title="Unread Messages"
            value={kpis.unreadMessages}
            icon={MessageSquare}
            description="New messages"
            badge={kpis.unreadMessages > 0 ? kpis.unreadMessages : undefined}
          />
        </div>

        {/* Tabs - Fixed position with all 5 sections */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="flex w-full bg-white/5 border border-white/10 rounded-lg p-1 gap-1 h-auto">
            <TabsTrigger 
              value="directory" 
              className="flex-1 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-md transition-all text-pink-300/80 hover:text-pink-200 data-[state=active]:bg-purple-600 data-[state=active]:text-yellow-300"
            >
              Directory
            </TabsTrigger>
            <TabsTrigger 
              value="events" 
              className="flex-1 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-md transition-all text-pink-300/80 hover:text-pink-200 data-[state=active]:bg-purple-600 data-[state=active]:text-yellow-300"
            >
              Events
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="flex-1 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-md transition-all text-pink-300/80 hover:text-pink-200 data-[state=active]:bg-purple-600 data-[state=active]:text-yellow-300"
            >
              Messages
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex-1 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-md transition-all text-pink-300/80 hover:text-pink-200 data-[state=active]:bg-purple-600 data-[state=active]:text-yellow-300"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="verifications" 
              className="flex-1 relative text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-md transition-all text-pink-300/80 hover:text-pink-200 data-[state=active]:bg-purple-600 data-[state=active]:text-yellow-300"
            >
              Verifications
              {kpis.pendingVerifications > 0 && (
                <span className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-indigo-500 text-[10px] sm:text-xs flex items-center justify-center">
                  {kpis.pendingVerifications}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="directory" className="mt-6 min-h-[400px]">
            <DirectoryTable onVerifyChange={() => {
              // Refresh KPIs when verification changes
              fetch("/api/faculty/analytics")
                .then((res) => res.json())
                .then((data) => setKPIs(data))
                .catch(console.error)
            }} />
          </TabsContent>

          <TabsContent value="events" className="mt-6 min-h-[400px]">
            <EventManager />
          </TabsContent>

          <TabsContent value="messages" className="mt-6 min-h-[400px]">
            <Inbox userId={userId} />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6 min-h-[400px]">
            <EngagementCharts />
          </TabsContent>

          <TabsContent value="verifications" className="mt-6 min-h-[400px]">
            <VerificationCenter
              onStatusChange={() => {
                // Refresh KPIs when verification status changes
                fetch("/api/faculty/analytics")
                  .then((res) => res.json())
                  .then((data) => setKPIs(data))
                  .catch(console.error)
              }}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}


