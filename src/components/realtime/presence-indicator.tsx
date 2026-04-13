"use client"

import { usePresenceChannel } from "@/hooks/use-presence-channel"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PresenceIndicatorProps {
  channelName: string
  showList?: boolean
  className?: string
}

export function PresenceIndicator({ channelName, showList = false, className }: PresenceIndicatorProps) {
  const { members, onlineCount } = usePresenceChannel({
    channelName,
  })

  if (onlineCount === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className={className}>
            <Users className="w-3 h-3 mr-1" />
            {onlineCount} {onlineCount === 1 ? "online" : "online"}
          </Badge>
        </TooltipTrigger>
        {showList && members.length > 0 && (
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold text-sm mb-2">Online Users:</p>
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>{member.name}</span>
                  {member.role && (
                    <span className="text-xs text-muted-foreground">({member.role})</span>
                  )}
                </div>
              ))}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  )
}

