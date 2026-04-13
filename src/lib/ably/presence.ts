/**
 * Ably Presence Utilities
 * Handles presence tracking for channels (who's online)
 */

"use client"

import { useEffect, useState, useCallback } from "react"
import { getAblyRealtimeClient } from "./client"
import type Ably from "ably"

export interface PresenceMember {
  clientId: string
  data: {
    userId: string
    name: string | null
    image: string | null
    role?: string
    [key: string]: any
  }
}

/**
 * Hook to track presence on a channel
 * @param channelName - The channel to track presence on
 * @param presenceData - Data to send with presence (user info, etc.)
 */
export function usePresence(
  channelName: string,
  presenceData?: {
    userId: string
    name: string | null
    image: string | null
    role?: string
    [key: string]: any
  }
) {
  const [members, setMembers] = useState<PresenceMember[]>([])
  const [isPresent, setIsPresent] = useState(false)

  useEffect(() => {
    if (!channelName || !presenceData) return

    try {
      const client = getAblyRealtimeClient()
      
      // Check if connection is active
      if (client.connection.state !== "connected") {
        console.warn(`Ably connection is ${client.connection.state}, skipping presence for ${channelName}`)
        return
      }
      
      const channel = client.channels.get(channelName)

      // Wait for channel to be attached before entering presence
      if (channel.state !== "attached") {
        channel.attach().then(() => {
          // Now safe to enter presence
          try {
            channel.presence.enter(presenceData)
            setIsPresent(true)
          } catch (enterError) {
            console.warn(`Error entering presence for channel ${channelName}:`, enterError)
          }
        }).catch((err) => {
          console.warn(`Failed to attach to channel ${channelName}:`, err)
        })
      } else {
        // Channel already attached, enter presence directly
        channel.presence.enter(presenceData)
        setIsPresent(true)
      }

      // Subscribe to presence updates
      const handlePresenceUpdate = (presenceMessage: Ably.PresenceMessage) => {
        if (presenceMessage.action === "enter" || presenceMessage.action === "update") {
          setMembers((prev) => {
            const existing = prev.find((m) => m.clientId === presenceMessage.clientId)
            if (existing) {
              return prev.map((m) =>
                m.clientId === presenceMessage.clientId
                  ? {
                      clientId: presenceMessage.clientId,
                      data: presenceMessage.data as any,
                    }
                  : m
              )
            }
            return [
              ...prev,
              {
                clientId: presenceMessage.clientId,
                data: presenceMessage.data as any,
              },
            ]
          })
        } else if (presenceMessage.action === "leave") {
          setMembers((prev) => prev.filter((m) => m.clientId !== presenceMessage.clientId))
        }
      }

      // Subscribe to presence events only if channel is attached
      if (channel.state === "attached") {
        channel.presence.subscribe(handlePresenceUpdate)
        
        // Get initial presence state
        channel.presence.get().then((members) => {
          setMembers(
            members.map((m: any) => ({
              clientId: m.clientId,
              data: m.data as any,
            }))
          )
        }).catch((err) => {
          console.warn(`Error getting presence for ${channelName}:`, err)
        })
      }

      // Cleanup: leave presence and unsubscribe
      return () => {
        try {
          if (channel.state === "attached") {
            channel.presence.leave()
            channel.presence.unsubscribe(handlePresenceUpdate)
          }
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        setIsPresent(false)
      }
    } catch (error) {
      console.error(`Error setting up presence for channel ${channelName}:`, error)
    }
  }, [channelName, presenceData])

  const updatePresence = useCallback(
    (data: Partial<typeof presenceData>) => {
      if (!channelName || !presenceData) return

      try {
        const client = getAblyRealtimeClient()
        
        // Check if connection is active
        if (client.connection.state !== "connected") {
          console.warn(`Ably connection is ${client.connection.state}, skipping presence update`)
          return
        }
        
        const channel = client.channels.get(channelName)
        
        // Only update if channel is attached
        if (channel.state === "attached") {
          channel.presence.update({ ...presenceData, ...data })
        }
      } catch (error) {
        console.error(`Error updating presence for channel ${channelName}:`, error)
      }
    },
    [channelName, presenceData]
  )

  return {
    members,
    isPresent,
    updatePresence,
    onlineCount: members.length,
  }
}

/**
 * Get presence members for a channel (non-hook version)
 */
export async function getPresenceMembers(channelName: string): Promise<PresenceMember[]> {
  try {
    const client = getAblyRealtimeClient()
    
    // Check if connection is active
    if (client.connection.state !== "connected") {
      console.warn(`Ably connection is ${client.connection.state}, cannot get presence members`)
      return []
    }
    
    const channel = client.channels.get(channelName)

    try {
      const members = await channel.presence.get()
      return members.map((m: any) => ({
        clientId: m.clientId,
        data: m.data as any,
      }))
    } catch (err) {
      console.warn(`Error getting presence members for ${channelName}:`, err)
      return []
    }
  } catch (error) {
    console.error(`Error getting presence members for channel ${channelName}:`, error)
    return []
  }
}





