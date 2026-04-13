/**
 * Ably REST Client for Server-Side Publishing
 * Use this in API routes and server actions to publish messages
 */

import Ably from "ably"
import { PublishOptions, AblyPayload } from "./types"

// Re-export channel and event constants for convenience
export { ABLY_CHANNELS, ABLY_EVENTS } from "./types"

let ablyRestClient: Ably.Rest | null = null
let cachedApiKey: string | null = null

// Message throttling: track last publish time per channel
const channelThrottleMap = new Map<string, number>()
const THROTTLE_MS = 100 // Minimum time between publishes per channel (100ms)

// GLOBAL Rate limiting: track ALL publishes across connection (per-second)
let globalPublishCount = 0
let globalWindowStart = Date.now()
const GLOBAL_RATE_LIMIT_PER_SECOND = 40 // Stay under 50 limit
const GLOBAL_WINDOW_MS = 1000 // 1 second

// Queue for rate-limited messages
const globalPublishQueue: Array<{ options: PublishOptions; validate: boolean; throttle: boolean; resolve: () => void; reject: (err: any) => void }> = []
let isProcessingGlobalQueue = false

async function processGlobalQueue() {
  if (isProcessingGlobalQueue || globalPublishQueue.length === 0) return
  
  isProcessingGlobalQueue = true
  
  // Reset counter every second
  const now = Date.now()
  if (now - globalWindowStart >= GLOBAL_WINDOW_MS) {
    globalPublishCount = 0
    globalWindowStart = now
  }
  
  // Process items while under global rate limit
  while (globalPublishQueue.length > 0 && globalPublishCount < GLOBAL_RATE_LIMIT_PER_SECOND) {
    const item = globalPublishQueue.shift()
    if (!item) continue
    
    try {
      await executePublish(item.options, item.validate, item.throttle)
      globalPublishCount++
      item.resolve()
    } catch (error: any) {
      // If rate limited, put back in queue and break
      if (error?.message?.includes('Rate limit') || error?.code === 429) {
        globalPublishQueue.unshift(item)
        console.warn('Ably global rate limit reached, pausing queue processing')
        break
      }
      item.reject(error)
    }
  }
  
  isProcessingGlobalQueue = false
  
  // If queue still has items, schedule next processing
  if (globalPublishQueue.length > 0) {
    setTimeout(() => processGlobalQueue(), 50)
  }
}

async function executePublish(options: PublishOptions, validate: boolean, throttle: boolean): Promise<void> {
  // Validate payload structure
  if (validate) {
    validatePayload(options.data)
  }

  // Check channel rate limit first (per-minute limit)
  const rateLimitCheck = checkRateLimit(options.channelName)
  if (!rateLimitCheck.allowed) {
    console.warn(
      `Channel rate limit exceeded for ${options.channelName}. Skipping message.`
    )
    return
  }

  // Apply throttling for high-traffic channels
  if (throttle && shouldThrottle(options.channelName)) {
    const lastPublish = channelThrottleMap.get(options.channelName) || 0
    const waitTime = THROTTLE_MS - (Date.now() - lastPublish)
    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }
  }

  const client = getAblyRestClient()
  const channel = client.channels.get(options.channelName)
  
  // Update throttle timestamp
  channelThrottleMap.set(options.channelName, Date.now())
  
  await channel.publish(options.eventName, options.data)
}

// Rate limiting: track message count per minute per channel
const channelRateLimitMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_PER_MINUTE = 45 // Keep below 50 to avoid hitting the limit
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute

/**
 * Validate payload structure before publishing
 */
function validatePayload(data: any, expectedType?: string): void {
  if (!data || typeof data !== "object") {
    throw new Error("Payload must be a non-null object")
  }

  // Type-specific validation
  if (expectedType) {
    switch (expectedType) {
      case "ChatMessagePayload":
        if (!data.id || !data.conversationId || !data.senderId || !data.content) {
          throw new Error("Invalid ChatMessagePayload: missing required fields")
        }
        break
      case "JobUpdatePayload":
        if (!data.id || !data.type || !data.jobId || !data.timestamp) {
          throw new Error("Invalid JobUpdatePayload: missing required fields")
        }
        break
      case "EventUpdatePayload":
        if (!data.eventId || !data.type || !data.timestamp) {
          throw new Error("Invalid EventUpdatePayload: missing required fields")
        }
        break
      case "RecordUpdatePayload":
        if (!data.userId || !data.type || !data.timestamp) {
          throw new Error("Invalid RecordUpdatePayload: missing required fields")
        }
        break
      case "NotificationPayload":
        if (!data.id || !data.userId || !data.title || !data.message) {
          throw new Error("Invalid NotificationPayload: missing required fields")
        }
        break
    }
  }

  // Sanitize payload: remove any undefined values
  Object.keys(data).forEach((key) => {
    if (data[key] === undefined) {
      delete data[key]
    }
  })
}

/**
 * Check if channel should be throttled (per-message throttling)
 */
function shouldThrottle(channelName: string): boolean {
  const lastPublish = channelThrottleMap.get(channelName)
  if (!lastPublish) return false

  const now = Date.now()
  const timeSinceLastPublish = now - lastPublish
  return timeSinceLastPublish < THROTTLE_MS
}

/**
 * Check if channel has exceeded rate limit (per-minute rate limiting)
 * Returns true if rate limit is exceeded
 */
function checkRateLimit(channelName: string): { allowed: boolean; waitTime?: number } {
  const now = Date.now()
  const rateLimit = channelRateLimitMap.get(channelName)

  if (!rateLimit) {
    // First message in this window
    channelRateLimitMap.set(channelName, { count: 1, windowStart: now })
    return { allowed: true }
  }

  // Check if we're still in the same window
  const timeSinceWindowStart = now - rateLimit.windowStart

  if (timeSinceWindowStart >= RATE_LIMIT_WINDOW_MS) {
    // New window, reset counter
    channelRateLimitMap.set(channelName, { count: 1, windowStart: now })
    return { allowed: true }
  }

  // Still in the same window
  if (rateLimit.count >= RATE_LIMIT_PER_MINUTE) {
    // Rate limit exceeded, calculate wait time
    const waitTime = RATE_LIMIT_WINDOW_MS - timeSinceWindowStart
    return { allowed: false, waitTime }
  }

  // Increment counter
  rateLimit.count++
  channelRateLimitMap.set(channelName, rateLimit)
  return { allowed: true }
}

/**
 * Clear the cached Ably REST client
 * Useful when API key changes
 */
export function clearAblyRestClient() {
  ablyRestClient = null
  cachedApiKey = null
}

/**
 * Get or create the Ably REST client instance
 * This client is used for server-side publishing only
 */
export function getAblyRestClient(): Ably.Rest {
  const apiKey = process.env.ABLY_API_KEY

  if (!apiKey) {
    throw new Error(
      "ABLY_API_KEY is not set. Please add it to your environment variables."
    )
  }

  // Trim any whitespace that might have been accidentally added
  const trimmedKey = apiKey.trim()

  // Validate key format
  if (!trimmedKey.includes(":") || !trimmedKey.includes(".")) {
    throw new Error(
      `Invalid ABLY_API_KEY format. Expected format: keyName.keyId:keySecret. Got: ${trimmedKey.substring(0, 20)}...`
    )
  }

  // If key changed or client doesn't exist, recreate it
  if (!ablyRestClient || cachedApiKey !== trimmedKey) {
    try {
      ablyRestClient = new Ably.Rest({
        key: trimmedKey,
      })
      cachedApiKey = trimmedKey
    } catch (error: any) {
      throw new Error(
        `Failed to initialize Ably REST client: ${error.message}. Please verify your ABLY_API_KEY is correct.`
      )
    }
  }

  return ablyRestClient
}

/**
 * Publish a message to an Ably channel (with GLOBAL rate limiting)
 * @param options - Publish options including channel name, event name, and data
 * @param validate - Whether to validate the payload (default: true)
 * @param throttle - Whether to apply throttling (default: true)
 */
export async function publishToAblyChannel(
  options: PublishOptions,
  validate: boolean = true,
  throttle: boolean = true
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if we're already over the global limit
    const now = Date.now()
    if (now - globalWindowStart >= GLOBAL_WINDOW_MS) {
      globalPublishCount = 0
      globalWindowStart = now
    }
    
    // If under limit and queue is empty, publish immediately
    if (globalPublishCount < GLOBAL_RATE_LIMIT_PER_SECOND && globalPublishQueue.length === 0) {
      executePublish(options, validate, throttle)
        .then(() => {
          globalPublishCount++
          resolve()
        })
        .catch((error: any) => {
          if (error?.message?.includes('Rate limit') || error?.code === 429) {
            // Add to queue if rate limited
            globalPublishQueue.push({ options, validate, throttle, resolve, reject })
            processGlobalQueue()
          } else {
            console.error(`Error publishing to ${options.channelName}:`, error)
            resolve() // Don't throw, just resolve
          }
        })
    } else {
      // Queue the message
      globalPublishQueue.push({ options, validate, throttle, resolve, reject })
      processGlobalQueue()
    }
  })
}

/**
 * Publish multiple messages in batch
 * @param options - Array of publish options
 */
export async function publishBatch(options: PublishOptions[]): Promise<void> {
  try {
    const client = getAblyRestClient()
    await Promise.all(
      options.map((opt) => {
        const channel = client.channels.get(opt.channelName)
        return channel.publish(opt.eventName, opt.data)
      })
    )
  } catch (error) {
    console.error("Error publishing batch to Ably:", error)
    throw error
  }
}

/**
 * Get channel presence information
 * @param channelName - The name of the channel
 */
export async function getChannelPresence(channelName: string) {
  try {
    const client = getAblyRestClient()
    const channel = client.channels.get(channelName)
    const presence = await channel.presence.get()
    return presence
  } catch (error) {
    console.error(`Error getting presence for channel ${channelName}:`, error)
    throw error
  }
}

/**
 * Get channel history
 * @param channelName - The name of the channel
 * @param limit - Maximum number of messages to retrieve
 */
export async function getChannelHistory(channelName: string, limit: number = 100) {
  try {
    const client = getAblyRestClient()
    const channel = client.channels.get(channelName)
    const history = await channel.history({ limit })
    return history
  } catch (error) {
    console.error(`Error getting history for channel ${channelName}:`, error)
    throw error
  }
}

