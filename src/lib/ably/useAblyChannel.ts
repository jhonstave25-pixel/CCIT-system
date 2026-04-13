/**
 * Enhanced useAblyChannel hook with additional utilities
 * Re-exports the main hook and adds convenience wrappers
 */

export {
  useAblyChannel,
  useAblyClient,
  useAblyPublish,
  useTypingIndicator,
  getAblyRealtimeClient,
} from "./client"

export type { ChannelSubscriptionOptions } from "./types"

/**
 * Hook for subscribing to chat messages
 */
export function useChatChannel(
  conversationId: string,
  onMessage: (message: any) => void
) {
  const { useAblyChannel } = require("./client")
  useAblyChannel(`ccit:chat:${conversationId}`, "message", onMessage)
}

/**
 * Hook for subscribing to job updates
 */
export function useJobChannel(
  userId: string | null,
  onUpdate: (update: any) => void
) {
  const { useAblyChannel } = require("./client")
  
  // Subscribe to active jobs feed
  useAblyChannel("ccit:jobs:active", "job:posted", onUpdate)
  useAblyChannel("ccit:jobs:active", "job:updated", onUpdate)
  
  // Subscribe to user-specific application updates
  if (userId) {
    useAblyChannel(`ccit:jobs:application:${userId}`, "job:application", onUpdate)
    useAblyChannel(`ccit:jobs:application:${userId}`, "job:status", onUpdate)
  }
}

/**
 * Hook for subscribing to event updates
 */
export function useEventChannel(
  eventId: string,
  onUpdate: (update: any) => void
) {
  const { useAblyChannel } = require("./client")
  useAblyChannel(`ccit:events:${eventId}`, "event:rsvp", onUpdate)
  useAblyChannel(`ccit:events:${eventId}`, "event:attendance", onUpdate)
  useAblyChannel(`ccit:events:${eventId}`, "event:update", onUpdate)
}

/**
 * Hook for subscribing to feed updates
 */
export function useFeedChannel(
  batchYear: number | null,
  onUpdate: (update: any) => void
) {
  const { useAblyChannel } = require("./client")
  
  // Always subscribe to public feed
  useAblyChannel("ccit:feed:public", "post", onUpdate)
  useAblyChannel("ccit:feed:public", "announcement", onUpdate)
  useAblyChannel("ccit:feed:public", "gallery", onUpdate)
  
  // Subscribe to batch-specific feed if provided
  if (batchYear) {
    useAblyChannel(`ccit:feed:alumni:${batchYear}`, "post", onUpdate)
    useAblyChannel(`ccit:feed:alumni:${batchYear}`, "announcement", onUpdate)
  }
}

/**
 * Hook for subscribing to notifications
 */
export function useNotificationChannel(
  userId: string | null,
  onNotification: (notification: any) => void
) {
  const { useAblyChannel } = require("./client")
  
  if (userId) {
    useAblyChannel(`ccit:notifications:${userId}`, "notification:new", onNotification)
  }
}





