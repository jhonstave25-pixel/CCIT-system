"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Shield, ArrowLeft, UserX, GraduationCap, Building2, Briefcase, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { unblockUser } from "@/actions/block.actions"

interface BlockedUser {
  id: string
  blocked: {
    id: string
    name: string | null
    email: string
    image: string | null
    profile?: {
      batch?: string
      degree?: string
      currentCompany?: string | null
      currentPosition?: string | null
    } | null
  }
  reason?: string | null
  createdAt: string
}

export default function BlockedUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [unblockingId, setUnblockingId] = useState<string | null>(null)

  const fetchBlockedUsers = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) return

    try {
      const res = await fetch("/api/blocked-users")
      if (!res.ok) throw new Error("Failed to fetch blocked users")

      const data = await res.json()
      setBlockedUsers(data.blockedUsers || [])
    } catch (error) {
      console.error("Error fetching blocked users:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load blocked users",
      })
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, status, toast])

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
      return
    }
    if (status === "authenticated") {
      fetchBlockedUsers()
    }
  }, [status, router, fetchBlockedUsers])

  const handleUnblock = async (blockedId: string) => {
    if (!session?.user?.id || unblockingId) return

    setUnblockingId(blockedId)

    try {
      const result = await unblockUser(session.user.id, blockedId)
      if (result.success) {
        setBlockedUsers((prev) => prev.filter((b) => b.blocked.id !== blockedId))
        toast({
          title: "User unblocked",
          description: "You can now message this user again.",
        })
      } else {
        throw new Error(result.error || "Failed to unblock user")
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to unblock user",
      })
    } finally {
      setUnblockingId(null)
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white pt-16 sm:pt-20 p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-white/60" />
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
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-300" />
              <h1 className="text-4xl font-bold">Blocked Users</h1>
            </div>
            <p className="text-white/70 mt-1">
              Manage users you&apos;ve blocked from messaging you
            </p>
          </div>
        </div>

        {/* Stats Card */}
        <Card className="bg-white/10 border-white/20 mb-8">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total Blocked</p>
              <p className="text-3xl font-bold text-white">{blockedUsers.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <UserX className="w-6 h-6 text-red-300" />
            </div>
          </CardContent>
        </Card>

        {/* Blocked Users List */}
        {blockedUsers.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blockedUsers.map((block) => {
              const user = block.blocked
              const initials = getInitials(user.name, user.email)
              const profile = user.profile
              const isUnblocking = unblockingId === user.id

              return (
                <Card
                  key={block.id}
                  className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white"
                >
                  <CardHeader className="flex flex-col items-center text-center pb-3">
                    <Link href={`/profile/${user.id}`} className="group">
                      {user.image ? (
                        <Avatar className="w-20 h-20 border-2 border-white/30 mb-3 group-hover:border-red-300 transition-colors">
                          <AvatarImage src={user.image} alt={user.name || "User"} />
                          <AvatarFallback className="bg-red-500/40 text-white text-xl font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400/40 to-orange-400/40 border-2 border-white/30 flex items-center justify-center text-2xl font-bold mb-3 group-hover:border-red-300 transition-colors">
                          {initials}
                        </div>
                      )}
                    </Link>

                    <CardTitle className="text-lg font-semibold mb-1">
                      <Link
                        href={`/profile/${user.id}`}
                        className="hover:text-red-300 transition-colors"
                      >
                        {user.name || "Unknown User"}
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

                    {block.reason && (
                      <Badge className="bg-red-500/20 border-red-300/30 text-red-200 text-xs">
                        {block.reason}
                      </Badge>
                    )}

                    <div className="pt-2">
                      <Button
                        onClick={() => handleUnblock(user.id)}
                        disabled={isUnblocking}
                        variant="outline"
                        className="w-full border-white/20 text-white hover:bg-white/10"
                      >
                        {isUnblocking ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <UserX className="w-4 h-4 mr-2" />
                        )}
                        {isUnblocking ? "Unblocking..." : "Unblock"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-12 text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-white/40" />
              <p className="text-lg text-white/80">No blocked users</p>
              <p className="text-sm text-white/60 mt-2 mb-6">
                When you block someone, you&apos;ll see them here. You can block a user from their profile or from a chat conversation.
              </p>
              <Link href="/chat">
                <Button className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white">
                  Go to Messages
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
