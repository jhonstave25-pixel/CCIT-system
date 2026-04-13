"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Users, ArrowLeft, UserCheck, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { removeConnection } from "@/actions/connection.actions"
import { useToast } from "@/hooks/use-toast"
import { GraduationCap, Building2, Briefcase, Linkedin, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConnectedUser {
  id: string
  name: string | null
  email: string
  image: string | null
  profile?: {
    batch?: string
    degree?: string
    currentCompany?: string | null
    currentPosition?: string | null
    industry?: string | null
    linkedinUrl?: string | null
  } | null
  connectionStatus: "ACCEPTED"
  connectionId: string
  isReceiver: boolean
}

export default function MyConnectionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [connections, setConnections] = useState<ConnectedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [loadingChat, setLoadingChat] = useState<string | null>(null)

  // Fetch connections
  const fetchConnections = useCallback(async () => {
    if (!session?.user?.id) return
    
    try {
      const res = await fetch("/api/connections/my-connections")
      if (!res.ok) throw new Error("Failed to fetch connections")
      
      const data = await res.json()
      setConnections(data.connections || [])
    } catch (error) {
      console.error("Error fetching connections:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your connections",
      })
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, toast])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated") {
      fetchConnections()
    }
  }, [status, router, fetchConnections])

  // Handle unfriend - removes immediately from UI
  const handleUnfriend = async (userId: string, connectionId: string) => {
    if (removingId) return
    
    // Immediately remove from UI for instant feedback
    setConnections((prev) => prev.filter((u) => u.id !== userId))
    setRemovingId(userId)
    
    try {
      const result = await removeConnection(connectionId)
      if (!result.success) {
        // If server failed, add back to list
        throw new Error(result.error || "Failed to remove connection")
      }
      
      toast({
        title: "Connection removed",
        description: "You are no longer connected with this person.",
      })
    } catch (error: any) {
      // Restore the connection in UI if it failed
      await fetchConnections()
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to remove connection",
      })
    } finally {
      setRemovingId(null)
    }
  }

  async function handleStartChat(userId: string) {
    if (loadingChat) return
    setLoadingChat(userId)
    
    try {
      const res = await fetch("/api/chat/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: userId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to start chat")
      }

      if (data.id) {
        router.push(`/chat/${data.id}`)
      } else {
        throw new Error("No chat ID returned")
      }
    } catch (error: any) {
      console.error("Error creating conversation:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to start chat",
      })
    } finally {
      setLoadingChat(null)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return "A"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white pt-16 sm:pt-20 p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white pt-16 sm:pt-20 p-6 md:p-10 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/connections">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <UserCheck className="w-8 h-8 text-emerald-300" />
              <h1 className="text-4xl font-bold">My Connections</h1>
            </div>
            <p className="text-white/70 mt-1">
              {connections.length > 0 
                ? `You have ${connections.length} connection${connections.length === 1 ? "" : "s"}`
                : "People you've connected with"
            }
            </p>
          </div>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Connections</p>
                <p className="text-3xl font-bold text-white">{connections.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-emerald-300" />
              </div>
            </CardContent>
          </Card>

          <Link href="/connections/pending" className="block">
            <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Pending Requests</p>
                  <p className="text-lg font-medium text-white">View Pending</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-yellow-300" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/connections" className="block">
            <Card className="bg-white/10 border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Discover</p>
                  <p className="text-lg font-medium text-white">Find Alumni</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-indigo-300" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Connections Grid */}
        {connections.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {connections.map((user) => {
              const initials = getInitials(user.name)
              const profile = user.profile
              const isRemoving = removingId === user.id

              return (
                <Card
                  key={user.id}
                  className={cn(
                    "bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white hover:bg-white/15 dark:hover:bg-indigo-950/40 transition-all duration-300 hover:shadow-xl",
                    isRemoving && "opacity-50 scale-95"
                  )}
                >
                  <CardHeader className="flex flex-col items-center text-center pb-3">
                    <Link href={`/profile/${user.id}`} className="group">
                      {user.image ? (
                        <Avatar className="w-20 h-20 border-2 border-white/30 mb-3 group-hover:border-indigo-300 transition-colors">
                          <AvatarImage src={user.image} alt={user.name || "Alumni"} />
                          <AvatarFallback className="bg-indigo-500/40 text-white text-xl font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400/40 to-violet-400/40 border-2 border-white/30 flex items-center justify-center text-2xl font-bold mb-3 group-hover:border-indigo-300 transition-colors">
                          {initials}
                        </div>
                      )}
                    </Link>
                    
                    <CardTitle className="text-lg font-semibold mb-1">
                      <Link
                        href={`/profile/${user.id}`}
                        className="hover:text-indigo-300 transition-colors"
                      >
                        {user.name || "Alumni Member"}
                      </Link>
                    </CardTitle>
                    
                    {profile && (
                      <div className="flex items-center gap-2 text-sm text-indigo-200 mb-2">
                        <GraduationCap className="w-4 h-4" />
                        <span>
                          {profile.degree || "N/A"} • Batch {profile.batch || "N/A"}
                        </span>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="text-center space-y-3 pt-0">
                    {profile?.currentPosition && (
                      <div className="flex items-center justify-center gap-2 text-sm text-white/80">
                        <Briefcase className="w-4 h-4 text-white/60" />
                        <span>{profile.currentPosition}</span>
                      </div>
                    )}
                    
                    {profile?.currentCompany && (
                      <div className="flex items-center justify-center gap-2 text-sm text-white/80">
                        <Building2 className="w-4 h-4 text-white/60" />
                        <span>{profile.currentCompany}</span>
                      </div>
                    )}

                    {profile?.industry && (
                      <Badge className="bg-indigo-500/20 border-indigo-300/30 text-indigo-200 text-xs">
                        {profile.industry}
                      </Badge>
                    )}

                    <div className="flex flex-col items-center gap-3 pt-2">
                      {/* Unfriend Button - only action on My Connections page */}
                      <button
                        onClick={() => handleUnfriend(user.id, user.connectionId)}
                        disabled={isRemoving}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm font-medium transition-colors disabled:opacity-50 w-full justify-center"
                      >
                        {isRemoving ? (
                          <span className="w-4 h-4 border-2 border-red-200/30 border-t-red-200 rounded-full animate-spin" />
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                        {isRemoving ? "Removing..." : "Unfriend"}
                      </button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-12 text-center">
              <UserCheck className="w-16 h-16 mx-auto mb-4 text-white/40" />
              <p className="text-lg text-white/80">No connections yet</p>
              <p className="text-sm text-white/60 mt-2 mb-6">
                Start building your network by connecting with fellow alumni
              </p>
              <Link href="/connections">
                <Button className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white">
                  <Users className="w-4 h-4 mr-2" />
                  Browse Alumni Directory
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
