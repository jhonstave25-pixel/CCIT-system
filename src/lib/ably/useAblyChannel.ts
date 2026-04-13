/**
 * Enhanced useAblyChannel hook with additional utilities
 * Re-exports the main hook and adds convenience wrappers
 */

import { useAblyChannel, useAblyClient, useAblyPublish, useTypingIndicator, getAblyRealtimeClient } from "./client"

export {
  useAblyChannel,
  useAblyClient,
  useAblyPublish,
  useTypingIndicator,
  getAblyRealtimeClient,
}

export type { ChannelSubscriptionOptions } from "./types"

/**
 * Hook for subscribing to chat messages
 */
export function useChatChannel(
  conversationId: string,
  onMessage: (message: any) => void
) {
  useAblyChannel(`ccit:chat:${conversationId}`, "message", onMessage)
}

/**
 * Hook for subscribing to job updates
 */
export function useJobChannel(
  userId: string | null,
  onUpdate: (update: any) => void
) {
  // Subscribe to active jobs feed
  useAblyChannel("ccit:jobs:active", "job:posted", onUpdate)
  useAblyChannel("ccit:jobs:active", "job:updated", onUpdate)
  
  // Subscribe to user-specific application updates (always call hook, pass null if no userId)
  const userAppChannel = userId ? `ccit:jobs:application:${userId}` : null
  const userStatusChannel = userId ? `ccit:jobs:application:${userId}` : null
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useAblyChannel(userAppChannel, "job:application", onUpdate)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useAblyChannel(userStatusChannel, "job:status", onUpdate)
}

/**
 * Hook for subscribing to event updates
 */
export function useEventChannel(
  eventId: string,
  onUpdate: (update: any) => void
) {
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
  // Always subscribe to public feed
  useAblyChannel("ccit:feed:public", "post", onUpdate)
  useAblyChannel("ccit:feed:public", "announcement", onUpdate)
  useAblyChannel("ccit:feed:public", "gallery", onUpdate)
  
  // Subscribe to batch-specific feed (always call hook, pass null if no batchYear)
  const batchPostChannel = batchYear ? `ccit:feed:alumni:${batchYear}` : null
  const batchAnnounceChannel = batchYear ? `ccit:feed:alumni:${batchYear}` : null
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useAblyChannel(batchPostChannel, "post", onUpdate)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useAblyChannel(batchAnnounceChannel, "announcement", onUpdate)
}

/**
 * Hook for subscribing to notifications
 */
export function useNotificationChannel(
  userId: string | null,
  onNotification: (notification: any) => void
) {
  // Always call hook, pass null if no userId - hook handles null internally
  const notifChannel = userId ? `ccit:notifications:${userId}` : null
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useAblyChannel(notifChannel, "notification:new", onNotification)
}





