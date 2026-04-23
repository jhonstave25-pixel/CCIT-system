"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { sendConnectionRequest, acceptConnectionRequest, declineConnectionRequest } from "@/actions/connection.actions"
import { UserPlus, Check, X, Loader2, Clock } from "lucide-react"

interface ConnectButtonProps {
  currentUserId: string
  otherUserId: string
  initialStatus?: "PENDING" | "ACCEPTED" | "REJECTED" | null
  connectionId?: string
  isReceiver?: boolean
  onStatusChange?: (status: string) => void
  showAcceptDecline?: boolean
}

export function ConnectButton({
  currentUserId,
  otherUserId,
  initialStatus,
  connectionId,
  isReceiver = false,
  onStatusChange,
  showAcceptDecline = false,
}: ConnectButtonProps) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleConnect = async () => {
    setLoading(true)
    try {
      const result = await sendConnectionRequest(currentUserId, otherUserId)
      
      if (result.success) {
        setStatus("PENDING")
        onStatusChange?.("PENDING")
        toast({
          title: "Connection Request Sent",
          description: "Your connection request has been sent successfully!",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to send connection request",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!connectionId) return
    
    setLoading(true)
    try {
      const result = await acceptConnectionRequest(connectionId)
      
      if (result.success) {
        setStatus("ACCEPTED")
        onStatusChange?.("ACCEPTED")
        toast({
          title: "Connection Accepted",
          description: "You are now connected!",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to accept connection",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDecline = async () => {
    if (!connectionId) return
    
    setLoading(true)
    try {
      const result = await declineConnectionRequest(connectionId)
      
      if (result.success) {
        setStatus("REJECTED")
        onStatusChange?.("REJECTED")
        toast({
          title: "Connection Declined",
          description: "The connection request has been declined",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to decline connection",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  // If already connected
  if (status === "ACCEPTED") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
      >
        <Check className="w-4 h-4 mr-2" />
        Connected
      </Button>
    )
  }

  // If pending and current user is the receiver (can accept/decline)
  // Only show Accept/Decline buttons in Pending Requests page
  if (status === "PENDING" && isReceiver && connectionId && showAcceptDecline) {
    return (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAccept}
          disabled={loading}
          className="bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Check className="w-4 h-4 mr-2" />
          )}
          Accept
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDecline}
          disabled={loading}
          className="bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-500/30"
        >
          <X className="w-4 h-4 mr-2" />
          Decline
        </Button>
      </div>
    )
  }

  // If pending and current user sent the request
  if (status === "PENDING") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="bg-yellow-100 dark:bg-yellow-500/20 border-yellow-300 dark:border-yellow-500/30 text-yellow-700 dark:text-yellow-300"
      >
        <Clock className="w-4 h-4 mr-2" />
        Pending
      </Button>
    )
  }

  // If rejected or no connection yet
  return (
    <Button
      size="sm"
      onClick={handleConnect}
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-700 text-white"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <UserPlus className="w-4 h-4 mr-2" />
      )}
      Connect
    </Button>
  )
}
