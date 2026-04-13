/**
 * Ably REST client for server-side publishing
 * Use this for publishing messages from API routes and server actions
 */

import Ably from "ably"

let ablyRestClient: Ably.Rest | null = null

// Rate limiting for server-side publishes
const publishQueue: Array<{ channelName: string; eventName: string; data: any; resolve: () => void; reject: (err: any) => void }> = []
let isProcessingQueue = false
const RATE_LIMIT_PER_SECOND = 40 // Stay under the 50 limit
let publishCount = 0
let lastResetTime = Date.now()

async function processPublishQueue() {
  if (isProcessingQueue || publishQueue.length === 0) return
  
  isProcessingQueue = true
  
  const client = getAblyRestClient()
  
  // Reset counter every second
  const now = Date.now()
  if (now - lastResetTime >= 1000) {
    publishCount = 0
    lastResetTime = now
  }
  
  // Process items while under rate limit
  while (publishQueue.length > 0 && publishCount < RATE_LIMIT_PER_SECOND) {
    const item = publishQueue.shift()
    if (!item) continue
    
    try {
      const channel = client.channels.get(item.channelName)
      await channel.publish(item.eventName, item.data)
      publishCount++
      item.resolve()
    } catch (error: any) {
      // If rate limited, put back in queue and break
      if (error.message?.includes('Rate limit') || error.code === 429) {
        publishQueue.unshift(item)
        console.warn('Ably server-side rate limit reached, queuing message')
        break
      }
      console.error(`Error publishing to ${item.channelName}:`, error)
      item.reject(error)
    }
  }
  
  isProcessingQueue = false
  
  // If queue still has items, schedule next processing
  if (publishQueue.length > 0) {
    setTimeout(() => processPublishQueue(), 100)
  }
}

/**
 * Get or create the Ably REST client instance
 * This client is used for server-side publishing only
 */
export function getAblyRestClient(): Ably.Rest {
  if (ablyRestClient) {
    return ablyRestClient
  }

  const apiKey = process.env.ABLY_API_KEY

  if (!apiKey) {
    throw new Error(
      "ABLY_API_KEY is not set. Please add it to your environment variables."
    )
  }

  ablyRestClient = new Ably.Rest({
    key: apiKey,
  })

  return ablyRestClient
}

/**
 * Publish a message to an Ably channel (with rate limiting)
 * @param channelName - The name of the channel to publish to
 * @param eventName - The event name
 * @param data - The data to publish
 */
export async function publishToAblyChannel(options: {
  channelName: string
  eventName: string
  data: any
}): Promise<void> {
  return new Promise((resolve, reject) => {
    // Add to queue
    publishQueue.push({
      channelName: options.channelName,
      eventName: options.eventName,
      data: options.data,
      resolve,
      reject,
    })
    
    // Start processing queue
    processPublishQueue()
  })
}






