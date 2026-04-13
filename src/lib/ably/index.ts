/**
 * Ably Real-Time Messaging Layer
 * Unified exports for easy importing
 */

// Client-side hooks and utilities
export {
  useAblyChannel,
  useAblyClient,
  useAblyPublish,
  useTypingIndicator,
  getAblyRealtimeClient,
} from "./client"

// Server-side publishing utilities
export {
  getAblyRestClient,
  publishToAblyChannel,
  publishBatch,
  getChannelPresence,
  getChannelHistory,
} from "./rest"

// Enhanced hooks
export {
  useChatChannel,
  useJobChannel,
  useEventChannel,
  useFeedChannel,
  useNotificationChannel,
} from "./useAblyChannel"

// Types and constants
export {
  ABLY_CHANNELS,
  ABLY_EVENTS,
  type ChatMessagePayload,
  type TypingIndicatorPayload,
  type ReadReceiptPayload,
  type FeedPostPayload,
  type JobUpdatePayload,
  type EventUpdatePayload,
  type RecordUpdatePayload,
  type NotificationPayload,
  type AblyPayload,
  type ChannelSubscriptionOptions,
  type PublishOptions,
} from "./types"

// Presence utilities
export {
  usePresence,
  getPresenceMembers,
  type PresenceMember,
} from "./presence"

