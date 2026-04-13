/**
 * Chat Presence Component
 * Shows who's online in a conversation
 */

"use client"

import { usePresence } from "@/lib/ably"
import { ABLY_CHANNELS } from "@/lib/ably/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ChatPresenceProps {
  conversationId: string
  userId: string
  userName: string | null
  userImage: string | null
  otherParticipants: Array<{
    id: string
    name: string | null
    image: string | null
  }>
}

export function ChatPresence({
  conversationId,
  userId,
  userName,
  userImage,
  otherParticipants,
}: ChatPresenceProps) {
  const channelName = ABLY_CHANNELS.CHAT(conversationId)
  const { members, onlineCount } = usePresence(channelName, {
    userId,
    name: userName,
    image: userImage,
  })

  // Filter out current user and get online others
  const onlineOthers = members.filter(
    (m) => m.data.userId !== userId && otherParticipants.some((p) => p.id === m.data.userId)
  )

  if (onlineOthers.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10 bg-white/5">
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-white/70">
          {onlineOthers.length} {onlineOthers.length === 1 ? "person" : "people"} online
        </span>
      </div>
      <div className="flex -space-x-2">
        {onlineOthers.slice(0, 3).map((member) => {
          const participant = otherParticipants.find((p) => p.id === member.data.userId)
          if (!participant) return null
          return (
            <Avatar key={member.clientId} className="h-6 w-6 border-2 border-slate-800">
              <AvatarImage src={participant.image || undefined} alt={participant.name || ""} />
              <AvatarFallback className="text-xs bg-indigo-500 text-white">
                {participant.name?.charAt(0).toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
          )
        })}
        {onlineOthers.length > 3 && (
          <Badge className="h-6 px-2 text-xs bg-slate-700 text-white border-slate-600">
            +{onlineOthers.length - 3}
          </Badge>
        )}
      </div>
    </div>
  )
}





