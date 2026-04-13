/**
 * Connection Status Banner
 * Displays connection state and reconnection status for Ably
 */

"use client"

import { useEffect, useState } from "react"
import { useAblyClient } from "@/lib/ably"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Wifi, WifiOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function ConnectionStatus() {
  const { connectionState, error } = useAblyClient()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show banner when disconnected, suspended, or failed
    const shouldShow =
      connectionState === "disconnected" ||
      connectionState === "suspended" ||
      connectionState === "failed" ||
      connectionState === "connecting"

    setIsVisible(shouldShow)
  }, [connectionState])

  if (!isVisible) return null

  const getStatusConfig = () => {
    switch (connectionState) {
      case "connecting":
        return {
          icon: Loader2,
          message: "Reconnecting...",
          variant: "default" as const,
          className: "bg-blue-500/10 border-blue-500/20 text-blue-300",
        }
      case "disconnected":
        return {
          icon: WifiOff,
          message: "Connection lost. Attempting to reconnect...",
          variant: "default" as const,
          className: "bg-yellow-500/10 border-yellow-500/20 text-yellow-300",
        }
      case "suspended":
        return {
          icon: WifiOff,
          message: "Connection suspended. Reconnecting...",
          variant: "default" as const,
          className: "bg-orange-500/10 border-orange-500/20 text-orange-300",
        }
      case "failed":
        return {
          icon: WifiOff,
          message: error?.message || "Connection failed. Please refresh the page.",
          variant: "destructive" as const,
          className: "bg-red-500/10 border-red-500/20 text-red-300",
        }
      default:
        return null
    }
  }

  const config = getStatusConfig()
  if (!config) return null

  const Icon = config.icon

  return (
    <Alert
      className={cn(
        "fixed top-0 left-0 right-0 z-50 rounded-none border-b shadow-lg",
        config.className,
        connectionState === "connecting" && "animate-pulse"
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            "h-4 w-4",
            connectionState === "connecting" && "animate-spin"
          )}
        />
        <AlertDescription className="text-sm font-medium">
          {config.message}
        </AlertDescription>
      </div>
    </Alert>
  )
}





