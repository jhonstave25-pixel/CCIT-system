"use client"

import { useState } from "react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ConnectButton } from "./connect-button"
import { GraduationCap, Building2, Briefcase, Clock, Linkedin } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface PendingRequest {
  user: {
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
  connectionId: string
  message?: string
  createdAt: string | Date
  type: "received" | "sent"
}

interface PendingConnectionsListProps {
  requests: PendingRequest[]
  currentUserId: string
}

export function PendingConnectionsList({ requests, currentUserId }: PendingConnectionsListProps) {
  const getInitials = (name: string | null) => {
    if (!name) return "A"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {requests.map((request) => {
        const { user, connectionId, message, createdAt, type } = request
        const initials = getInitials(user.name)

        return (
          <Card
            key={connectionId}
            className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white hover:bg-white/15 dark:hover:bg-indigo-950/40 transition-all duration-300"
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
              
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold">
                  <Link
                    href={`/profile/${user.id}`}
                    className="hover:text-indigo-300 transition-colors"
                  >
                    {user.name || "Alumni Member"}
                  </Link>
                </h3>
                <Badge 
                  variant="outline" 
                  className={type === "received" 
                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300 text-xs"
                    : "bg-yellow-500/20 border-yellow-500/30 text-yellow-300 text-xs"
                  }
                >
                  {type === "received" ? "Wants to Connect" : "Pending"}
                </Badge>
              </div>

              {user.profile && (
                <div className="flex items-center gap-2 text-sm text-indigo-200 mb-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>
                    {user.profile.degree || "N/A"} • Batch {user.profile.batch || "N/A"}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-white/50">
                <Clock className="w-3 h-3" />
                <span>
                  {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                </span>
              </div>
            </CardHeader>

            <CardContent className="text-center space-y-3 pt-0">
              {user.profile?.currentPosition && (
                <div className="flex items-center justify-center gap-2 text-sm text-white/80">
                  <Briefcase className="w-4 h-4 text-white/60" />
                  <span>{user.profile.currentPosition}</span>
                </div>
              )}
              
              {user.profile?.currentCompany && (
                <div className="flex items-center justify-center gap-2 text-sm text-white/80">
                  <Building2 className="w-4 h-4 text-white/60" />
                  <span>{user.profile.currentCompany}</span>
                </div>
              )}

              {message && (
                <div className="bg-white/5 rounded-lg p-3 text-sm text-white/80 italic">
                  &quot;{message}&quot;
                </div>
              )}

              <div className="pt-2">
                {type === "received" ? (
                  <ConnectButton
                    currentUserId={currentUserId}
                    otherUserId={user.id}
                    initialStatus="PENDING"
                    connectionId={connectionId}
                    isReceiver={true}
                    showAcceptDecline={true}
                  />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="bg-yellow-500/20 border-yellow-500/30 text-yellow-300 w-full"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Waiting for Response
                  </Button>
                )}
              </div>

              {/* Contact Links */}
              <div className="flex items-center justify-center gap-3 pt-2 border-t border-white/10 mt-3">
                <Link
                  href={`/profile/${user.id}`}
                  className="text-xs text-indigo-300 hover:text-indigo-200 underline"
                >
                  View Profile
                </Link>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
