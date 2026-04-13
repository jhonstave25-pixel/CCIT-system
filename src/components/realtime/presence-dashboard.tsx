/**
 * Presence Dashboard
 * Shows active users across different channels and modules
 */

"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Users, Circle, MessageSquare, Calendar, FileText, Briefcase } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePresence } from "@/lib/ably/presence"
import { ABLY_CHANNELS } from "@/lib/ably"
import { cn } from "@/lib/utils"

interface PresenceDashboardProps {
  conversationId?: string
  eventId?: string
  className?: string
}

export function PresenceDashboard({ conversationId, eventId, className }: PresenceDashboardProps) {
  const { data: session } = useSession()
  const [activeChannels, setActiveChannels] = useState<string[]>([])
  const [chatSearch, setChatSearch] = useState("")
  const [chatRoleFilter, setChatRoleFilter] = useState<"ALL" | "ALUMNI" | "FACULTY" | "ADMIN">("ALL")
  const [eventSearch, setEventSearch] = useState("")
  const [eventRoleFilter, setEventRoleFilter] = useState<"ALL" | "ALUMNI" | "FACULTY" | "ADMIN">("ALL")

  // Track presence on chat channel if conversationId provided
  const chatPresence = usePresence(
    conversationId ? ABLY_CHANNELS.CHAT(conversationId) : "",
    session?.user
      ? {
          userId: session.user.id,
          name: session.user.name,
          image: session.user.image,
          role: session.user.role,
        }
      : undefined
  )

  // Track presence on event channel if eventId provided
  const eventPresence = usePresence(
    eventId ? ABLY_CHANNELS.EVENT(eventId) : "",
    session?.user
      ? {
          userId: session.user.id,
          name: session.user.name,
          image: session.user.image,
          role: session.user.role,
        }
      : undefined
  )

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Active Users
        </CardTitle>
        <CardDescription>Real-time presence across channels</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">Current Channel</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {conversationId && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm">Chat Participants</h4>
                  <Badge variant="secondary">{chatPresence.onlineCount}</Badge>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground"
                  />
                  <select
                    value={chatRoleFilter}
                    onChange={(e) => setChatRoleFilter(e.target.value as any)}
                    className="w-full sm:w-32 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                  >
                    <option value="ALL">All roles</option>
                    <option value="ALUMNI">Alumni</option>
                    <option value="FACULTY">Faculty</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                {(() => {
                  const filtered = chatPresence.members.filter((member) => {
                    const name = (member.data.name || "").toLowerCase()
                    const role = (member.data.role || "").toUpperCase()
                    const matchesSearch = !chatSearch.trim() || name.includes(chatSearch.toLowerCase())
                    const matchesRole =
                      chatRoleFilter === "ALL" || role === chatRoleFilter
                    return matchesSearch && matchesRole
                  })
                  return (
                <div className="space-y-2">
                  {filtered.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active participants</p>
                  ) : (
                    filtered.map((member) => (
                      <div key={member.clientId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.data.image || undefined} />
                            <AvatarFallback>
                              {member.data.name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <Circle className="absolute -bottom-0 -right-0 h-3 w-3 fill-green-500 text-green-500 border-2 border-background rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.data.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{member.data.role || "User"}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                  )
                })()}
              </div>
            )}

            {eventId && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm">Event Attendees</h4>
                  <Badge variant="secondary">{eventPresence.onlineCount}</Badge>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground"
                  />
                  <select
                    value={eventRoleFilter}
                    onChange={(e) => setEventRoleFilter(e.target.value as any)}
                    className="w-full sm:w-32 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                  >
                    <option value="ALL">All roles</option>
                    <option value="ALUMNI">Alumni</option>
                    <option value="FACULTY">Faculty</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                {(() => {
                  const filtered = eventPresence.members.filter((member) => {
                    const name = (member.data.name || "").toLowerCase()
                    const role = (member.data.role || "").toUpperCase()
                    const matchesSearch = !eventSearch.trim() || name.includes(eventSearch.toLowerCase())
                    const matchesRole =
                      eventRoleFilter === "ALL" || role === eventRoleFilter
                    return matchesSearch && matchesRole
                  })
                  return (
                <div className="space-y-2">
                  {filtered.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active attendees</p>
                  ) : (
                    filtered.map((member) => (
                      <div key={member.clientId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.data.image || undefined} />
                            <AvatarFallback>
                              {member.data.name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <Circle className="absolute -bottom-0 -right-0 h-3 w-3 fill-green-500 text-green-500 border-2 border-background rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{member.data.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{member.data.role || "User"}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                  )
                })()}
              </div>
            )}

            {!conversationId && !eventId && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Open a chat or event to see active participants
              </p>
            )}
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{chatPresence.onlineCount}</p>
                  <p className="text-xs text-muted-foreground">Active conversations</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{eventPresence.onlineCount}</p>
                  <p className="text-xs text-muted-foreground">Active events</p>
                </CardContent>
              </Card>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-sm mb-3">System Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Real-time connection</span>
                  <Badge variant={chatPresence.isPresent ? "default" : "secondary"}>
                    {chatPresence.isPresent ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}





