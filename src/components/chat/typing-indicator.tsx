/**
 * Typing Indicator Component
 * Shows when someone is typing in a conversation
 */

"use client"

import { useEffect, useState } from "react"
import { useAblyChannel, useTypingIndicator, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"
import { cn } from "@/lib/utils"
import type { TypingIndicatorPayload } from "@/lib/ably/types"

interface TypingIndicatorProps {
  conversationId: string
  userId: string
  userName: string | null
  onTypingChange?: (isTyping: boolean) => void
}

export function TypingIndicator({
  conversationId,
  userId,
  userName,
  onTypingChange,
}: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const { startTyping, stopTyping } = useTypingIndicator(conversationId, userId, userName || "")

  // Subscribe to typing events
  useAblyChannel(
    ABLY_CHANNELS.CHAT(conversationId),
    ABLY_EVENTS.CHAT_TYPING,
    (payload: TypingIndicatorPayload) => {
      if (payload.conversationId !== conversationId) return
      if (payload.userId === userId) return // Don't show own typing indicator

      if (payload.isTyping) {
        setTypingUsers((prev) => new Set([...prev, payload.userId]))
      } else {
        setTypingUsers((prev) => {
          const next = new Set(prev)
          next.delete(payload.userId)
          return next
        })
      }
    }
  )

  // Notify parent of typing state changes
  useEffect(() => {
    onTypingChange?.(typingUsers.size > 0)
  }, [typingUsers.size, onTypingChange])

  if (typingUsers.size === 0) return null

  return (
    <div className="px-4 py-2 text-sm text-white/60 italic">
      {typingUsers.size === 1 ? "Someone is typing..." : `${typingUsers.size} people are typing...`}
      <span className="inline-flex gap-1 ml-2">
        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
          .
        </span>
        <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
          .
        </span>
        <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
          .
        </span>
      </span>
    </div>
  )
}

// Export hooks for use in chat components
export { useTypingIndicator }





