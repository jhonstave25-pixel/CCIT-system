/**
 * Ably Channel and Event Type Definitions
 * All channels use the `ccit:` prefix for namespacing
 */

// Channel Names
export const ABLY_CHANNELS = {
  // Chat channels
  CHAT: (conversationId: string) => `ccit:chat:${conversationId}`,
  
  // Feed channels
  FEED_PUBLIC: "ccit:feed:public",
  FEED_ALUMNI: (batchYear: number) => `ccit:feed:alumni:${batchYear}`,
  
  // Job channels
  JOBS_ACTIVE: "ccit:jobs:active",
  JOBS_APPLICATION: (userId: string) => `ccit:jobs:application:${userId}`,
  
  // Event channels
  EVENT: (eventId: string) => `ccit:events:${eventId}`,
  
  // Registrar channels
  RECORDS: (userId: string) => `ccit:records:${userId}`,
  
  // Notification channels
  NOTIFICATIONS: (userId: string) => `ccit:notifications:${userId}`,
  
  // User update channels
  USERS_UPDATE: "ccit:users:updates",
} as const

// Event Names
export const ABLY_EVENTS = {
  // Chat events
  CHAT_MESSAGE: "message",
  CHAT_TYPING: "typing",
  CHAT_READ: "read",
  
  // Feed events
  FEED_POST: "post",
  FEED_ANNOUNCEMENT: "announcement",
  FEED_GALLERY: "gallery",
  
  // Job events
  JOB_POSTED: "job:posted",
  JOB_UPDATED: "job:updated",
  JOB_APPLICATION: "job:application",
  JOB_STATUS: "job:status",
  
  // Event events
  EVENT_RSVP: "event:rsvp",
  EVENT_ATTENDANCE: "event:attendance",
  EVENT_UPDATE: "event:update",
  
  // Registrar events
  RECORD_VERIFIED: "record:verified",
  RECORD_RELEASED: "record:released",
  RECORD_UPDATE: "record:update",
  
  // Notification events
  NOTIFICATION_NEW: "notification:new",
  NOTIFICATION_READ: "notification:read",
  
  // User events
  USER_VERIFIED: "user:verified",
  USER_CREATED: "user:created",
  USER_UPDATED: "user:updated",
} as const

// Message Payload Types
export interface ChatMessagePayload {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  seenBy: string[]
  sender?: {
    id: string
    name: string | null
    image: string | null
  }
}

export interface TypingIndicatorPayload {
  conversationId: string
  userId: string
  userName: string | null
  isTyping: boolean
}

export interface ReadReceiptPayload {
  conversationId: string
  messageId: string
  userId: string
  readAt: string
}

export interface FeedPostPayload {
  id: string
  type: "post" | "announcement" | "gallery"
  authorId: string
  authorName: string | null
  title?: string
  content?: string
  imageUrl?: string
  createdAt: string
  batchYear?: number
}

export interface JobUpdatePayload {
  id: string
  type: "posted" | "updated" | "application" | "status"
  jobId: string
  jobTitle: string
  company: string
  userId?: string
  status?: string
  timestamp: string
}

export interface EventUpdatePayload {
  eventId: string
  type: "rsvp" | "attendance" | "update"
  userId?: string
  userName?: string | null
  data: Record<string, any>
  timestamp: string
}

export interface RecordUpdatePayload {
  userId: string
  type: "verified" | "released" | "update"
  recordType: string
  status: string
  timestamp: string
  message?: string
}

export interface NotificationPayload {
  id: string
  userId: string
  type: string
  title: string
  message: string
  link?: string
  timestamp: string
}

// Union type for all payloads
export type AblyPayload =
  | ChatMessagePayload
  | TypingIndicatorPayload
  | ReadReceiptPayload
  | FeedPostPayload
  | JobUpdatePayload
  | EventUpdatePayload
  | RecordUpdatePayload
  | NotificationPayload

// Channel subscription options
export interface ChannelSubscriptionOptions {
  channelName: string
  eventName: string
  onMessage: (data: any) => void
  onError?: (error: Error) => void
}

// Publish options
export interface PublishOptions {
  channelName: string
  eventName: string
  data: AblyPayload
}





