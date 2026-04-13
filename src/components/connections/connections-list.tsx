"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ConnectButton } from "./connect-button"
import { GraduationCap, Building2, Briefcase, Linkedin, Users, MessageCircle, UserMinus } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { removeConnection } from "@/actions/connection.actions"

interface UserWithConnection {
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
  connectionStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | null
  connectionId?: string | null
  isReceiver?: boolean
}

interface ConnectionsListProps {
  users: UserWithConnection[]
  currentUserId: string
  showAll?: boolean
  showUnfriend?: boolean
  showAcceptDecline?: boolean
}

export function ConnectionsList({ users, currentUserId, showAll = false, showUnfriend = false, showAcceptDecline = false }: ConnectionsListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loadingChat, setLoadingChat] = useState<string | null>(null)
  const [removingConnection, setRemovingConnection] = useState<string | null>(null)

  const getInitials = (name: string | null) => {
    if (!name) return "A"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
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

  if (users.length === 0) {
    return (
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-white/40" />
          <p className="text-lg text-white/80">No alumni found</p>
          <p className="text-sm text-white/60 mt-2">Check back soon!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {users.map((user) => {
        const initials = getInitials(user.name)
        const profile = user.profile

        return (
          <Card
            key={user.id}
            className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white hover:bg-white/15 dark:hover:bg-indigo-950/40 transition-all duration-300 hover:shadow-xl"
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
                {/* Show Connect button if not connected */}
                {/* Only show Accept/Decline in Pending Requests page (showAcceptDecline=true) */}
                {user.connectionStatus !== "ACCEPTED" && currentUserId !== user.id && (
                  <ConnectButton
                    currentUserId={currentUserId}
                    otherUserId={user.id}
                    initialStatus={user.connectionStatus}
                    connectionId={user.connectionId || undefined}
                    isReceiver={user.isReceiver}
                    showAcceptDecline={showAcceptDecline}
                  />
                )}

                {/* Show Unfriend button for accepted connections (only on My Connections page) */}
                {showUnfriend && user.connectionStatus === "ACCEPTED" && user.connectionId && currentUserId !== user.id && (
                  <button
                    onClick={async () => {
                      if (removingConnection) return
                      setRemovingConnection(user.id)
                      
                      try {
                        const result = await removeConnection(user.connectionId!)
                        if (result.success) {
                          toast({
                            title: "Connection removed",
                            description: "You are no longer connected with this person.",
                          })
                          router.refresh()
                        } else {
                          throw new Error(result.error || "Failed to remove connection")
                        }
                      } catch (error: any) {
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: error.message || "Failed to remove connection",
                        })
                      } finally {
                        setRemovingConnection(null)
                      }
                    }}
                    disabled={removingConnection === user.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {removingConnection === user.id ? (
                      <span className="w-4 h-4 border-2 border-red-200/30 border-t-red-200 rounded-full animate-spin" />
                    ) : (
                      <UserMinus className="w-4 h-4" />
                    )}
                    Unfriend
                  </button>
                )}

                <div className="flex items-center justify-center gap-3">
                  {/* Message icon for all users - no connection required */}
                  {currentUserId !== user.id && (
                    <button
                      onClick={() => handleStartChat(user.id)}
                      disabled={loadingChat === user.id}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                      aria-label="Start chat"
                    >
                      {loadingChat === user.id ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  {profile?.linkedinUrl && (
                    <Link
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                      aria-label="LinkedIn profile"
                    >
                      <Linkedin className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
