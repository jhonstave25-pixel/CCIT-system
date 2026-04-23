/**
 * Ably Realtime Client for Browser-Side Subscription
 * Uses token-based authentication via /api/ably/token
 * IMPORTANT: Never pass API key directly to client - always use token auth
 */

"use client"

import Ably from "ably"
import { useEffect, useState, useCallback, useRef } from "react"
import { ChannelSubscriptionOptions } from "./types"

let ablyRealtimeClient: Ably.Realtime | null = null

/**
 * Get or create the Ably Realtime client instance
 * This client uses token authentication for security
 * NEVER pass API key directly - always use authUrl
 */
export function getAblyRealtimeClient(): Ably.Realtime {
  if (typeof window === "undefined") {
    throw new Error("Ably Realtime client can only be used in the browser")
  }

  if (ablyRealtimeClient) {
    return ablyRealtimeClient
  }

  // Use relative path for authUrl - important for security
  // This will call /api/ably/token which generates tokens server-side
  ablyRealtimeClient = new Ably.Realtime({ 
    authUrl: "/api/ably/token",
    authMethod: "POST",
    // Reconnection settings
    disconnectedRetryTimeout: 3000, // Retry after 3 seconds
    suspendedRetryTimeout: 3000, // Retry after 3 seconds when suspended
  })

  // Enhanced connection state handling with reconnection logic
  ablyRealtimeClient.connection.on((stateChange) => {
    const { current, previous, reason, retryIn } = stateChange

    if (current === "connected") {
      console.log("✅ Ably connected")
    } else if (current === "disconnected") {
      console.warn("⚠️ Ably disconnected", reason ? `- ${reason}` : "")
      // Will automatically retry based on disconnectedRetryTimeout
    } else if (current === "suspended") {
      console.warn("⚠️ Ably suspended", reason ? `- ${reason}` : "")
      // Will automatically retry based on suspendedRetryTimeout
    } else if (current === "failed") {
      console.error("❌ Ably connection failed:", reason)
      // Attempt to reconnect after a delay
      if (retryIn) {
        console.log(`🔄 Will retry connection in ${retryIn}ms`)
      }
    } else if (current === "connecting") {
      console.log("🔄 Ably connecting...")
    } else if (current === "closed") {
      console.log("🔒 Ably connection closed")
    }
  })

  // Handle connection errors
  ablyRealtimeClient.connection.on("failed", (error) => {
    console.error("Ably connection error:", error)
  })

  return ablyRealtimeClient
}

/**
 * Hook to get the Ably Realtime client instance and connection state
 * Useful for advanced use cases like presence tracking
 */
export function useAblyClient(): {
  client: Ably.Realtime | null
  connectionState: Ably.ConnectionState
  error: Error | null
} {
  const [client, setClient] = useState<Ably.Realtime | null>(null)
  const [connectionState, setConnectionState] = useState<Ably.ConnectionState>("initialized")
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    try {
      const ablyClient = getAblyRealtimeClient()
      setClient(ablyClient)
      setConnectionState(ablyClient.connection.state)

      const handleConnectionStateChange = (stateChange: Ably.ConnectionStateChange) => {
        setConnectionState(stateChange.current)
        if (stateChange.reason) {
          setError(new Error(String(stateChange.reason)))
        } else {
          setError(null)
        }
      }

      ablyClient.connection.on(handleConnectionStateChange)

      return () => {
        ablyClient.connection.off(handleConnectionStateChange)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      console.error("Error initializing Ably client:", error)
    }
  }, [])

  return { client, connectionState, error }
}

/**
 * Hook to subscribe to an Ably channel with automatic cleanup
 * @param channelName - The name of the channel to subscribe to (null to skip subscription)
 * @param eventName - The event name to listen for
 * @param callback - Callback function to handle messages
 * @param onError - Optional error handler
 */
export function useAblyChannel(
  channelName: string | null,
  eventName: string,
  callback: (message: any) => void,
  onError?: (error: Error) => void
) {
  const callbackRef = useRef(callback)
  const errorRef = useRef(onError)

  // Keep callbacks up to date
  useEffect(() => {
    callbackRef.current = callback
    errorRef.current = onError
  }, [callback, onError])

  useEffect(() => {
    if (!channelName || !eventName) return

    let channel: ReturnType<Ably.Realtime['channels']['get']> | null = null

    try {
      const client = getAblyRealtimeClient()
      
      // Check connection state before subscribing
      if (client.connection.state !== "connected") {
        console.warn(`Ably connection is ${client.connection.state}, skipping subscription to ${channelName}`)
        return
      }
      
      channel = client.channels.get(channelName)

      const handleMessage = (message: Ably.Message) => {
        try {
          callbackRef.current(message.data)
        } catch (error) {
          console.error("Error in channel callback:", error)
          if (errorRef.current) {
            errorRef.current(error instanceof Error ? error : new Error("Unknown error"))
          }
        }
      }

      // Subscribe to channel - use simple subscribe without error callback
      channel.subscribe(eventName, handleMessage)

      // Handle channel errors
      const handleChannelFailed = (error: any) => {
        const errMsg = error?.message || error?.reason || "Unknown error"
        const err = new Error(`Channel ${channelName} failed: ${errMsg}`)
        console.error(err)
        if (errorRef.current) {
          errorRef.current(err)
        }
      }
      channel.on("failed", handleChannelFailed)

      return () => {
        try {
          channel?.unsubscribe(eventName, handleMessage)
          channel?.off("failed", handleChannelFailed)
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error")
      console.error(`Error subscribing to Ably channel ${channelName}:`, err)
      if (errorRef.current) {
        errorRef.current(err)
      }
    }
  }, [channelName, eventName])
}

// Rate limiting for Ably publishes
const publishQueue: Array<{ channelName: string; eventName: string; data: any }> = []
let isProcessingQueue = false
const RATE_LIMIT_PER_SECOND = 40 // Stay under the 50 limit
let publishCount = 0
let lastResetTime = Date.now()

async function processPublishQueue(client: Ably.Realtime) {
  if (isProcessingQueue || publishQueue.length === 0) return
  
  isProcessingQueue = true
  
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
    } catch (error: any) {
      // If rate limited, put back in queue and break
      if (error.message?.includes('Rate limit')) {
        publishQueue.unshift(item)
        console.warn('Ably rate limit reached, queuing message')
        break
      }
      console.error(`Error publishing to ${item.channelName}:`, error)
    }
  }
  
  isProcessingQueue = false
  
  // If queue still has items, schedule next processing
  if (publishQueue.length > 0) {
    setTimeout(() => {
      if (client.connection.state === 'connected') {
        processPublishQueue(client)
      }
    }, 100)
  }
}

/**
 * Hook to publish messages from client components
 * Note: For security, prefer server-side publishing via API routes
 * @param channelName - The name of the channel to publish to
 * @param eventName - The event name
 * @param data - The data to publish
 */
export function useAblyPublish() {
  const clientRef = useRef<Ably.Realtime | null>(null)

  useEffect(() => {
    try {
      clientRef.current = getAblyRealtimeClient()
    } catch (error) {
      console.error("Error initializing Ably client for publishing:", error)
    }
  }, [])

  const publish = useCallback(
    async (channelName: string, eventName: string, data: any) => {
      if (!clientRef.current) {
        console.warn("Ably client not initialized, skipping publish")
        return
      }

      // Check connection state before publishing
      const connectionState = clientRef.current.connection.state
      if (connectionState !== "connected") {
        console.warn(`Ably connection is ${connectionState}, skipping publish to ${channelName}`)
        return
      }

      // Add to queue instead of publishing immediately
      publishQueue.push({ channelName, eventName, data })
      
      // Start processing queue
      processPublishQueue(clientRef.current)
    },
    []
  )

  return { publish }
}

/**
 * Hook to track typing indicators
 * @param conversationId - The conversation ID
 * @param userId - The current user ID
 * @param userName - The current user name
 */
export function useTypingIndicator(
  conversationId: string,
  userId: string,
  userName: string | null
) {
  const { publish } = useAblyPublish()
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastPublishRef = useRef<number>(0)
  const channelName = `ccit:chat:${conversationId}`
  const TYPING_THROTTLE_MS = 500 // Throttle typing events to max 2 per second

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    // Always send stop typing, but still throttle
    const now = Date.now()
    if (now - lastPublishRef.current >= TYPING_THROTTLE_MS) {
      publish(channelName, "typing", {
        conversationId,
        userId,
        userName,
        isTyping: false,
      })
      lastPublishRef.current = now
    }
  }, [conversationId, userId, userName, publish, channelName])

  const startTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Throttle publish to prevent rate limits
    const now = Date.now()
    if (now - lastPublishRef.current >= TYPING_THROTTLE_MS) {
      publish(channelName, "typing", {
        conversationId,
        userId,
        userName,
        isTyping: true,
      })
      lastPublishRef.current = now
    }

    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 3000)
  }, [conversationId, userId, userName, publish, channelName, stopTyping])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      stopTyping()
    }
  }, [stopTyping])

  return { startTyping, stopTyping }
}
