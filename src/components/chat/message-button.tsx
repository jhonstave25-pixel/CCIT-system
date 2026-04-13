"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function MessageButton({
  currentUserId,
  otherUserId,
}: {
  currentUserId: string
  otherUserId: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // Don't show button if trying to message yourself
  if (currentUserId === otherUserId) {
    return null
  }

  return (
    <Button
      onClick={async () => {
        if (isLoading) return
        setIsLoading(true)
        try {
          const res = await fetch("/api/chat/initiate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipientId: otherUserId }),
          })

          const data = await res.json()

          if (!res.ok) {
            throw new Error(data.error || "Failed to initiate chat")
          }

          if (data.id) {
            router.push(`/chat/${data.id}`)
          } else {
            throw new Error("No chat ID returned")
          }
        } catch (error: any) {
          console.error("Error creating conversation:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to create conversation",
          })
        } finally {
          setIsLoading(false)
        }
      }}
      disabled={isLoading}
      className="rounded-md border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors text-xs"
      size="sm"
    >
      <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
      {isLoading ? "Loading..." : "Message"}
    </Button>
  )
}


