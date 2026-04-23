"use client"

import { useEffect, useRef, useState } from "react"
import { getMessages } from "@/app/(dashboard)/messages/_actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useSession } from "next-auth/react"
import { Send, Check, X, Paperclip, Camera, Image } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { useAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: Date
  seenBy: string[]
  status: "PENDING" | "APPROVED" | "REJECTED"
}

export default function ChatWindow({ conversationId }: { conversationId: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const userId = session?.user?.id || ""
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // Check if there are any pending messages from others that need approval
  const pendingMessages = messages.filter(
    (m) => m.status === "PENDING" && m.senderId !== userId
  )
  const hasPendingMessages = pendingMessages.length > 0

  async function refresh() {
    if (!userId) return
    try {
      const data = await getMessages(conversationId, userId)
      const uniqueMessages = Array.from(
        new Map(
          data.map((m) => [
            m.id,
            {
              ...m,
              createdAt: new Date(m.createdAt),
            },
          ])
        ).values()
      ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      
      setMessages(uniqueMessages)
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      })
    } catch (error) {
      console.error("Error fetching messages:", error)
    }
  }

  // Handle new message from Ably
  const handleNewMessage = (newMessage: any) => {
    // Only add if it's for this conversation
    if (newMessage.conversationId === conversationId) {
      setMessages((prev) => {
        // Check if message already exists to avoid duplicates
        if (prev.some((m) => m.id === newMessage.id)) {
          return prev
        }
        return [
          ...prev,
          {
            ...newMessage,
            createdAt: new Date(newMessage.createdAt),
          },
        ]
      })
      // Scroll to bottom when new message arrives
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      })
    } else {
      // Show notification for messages in other conversations
      toast({
        title: "New message",
        description: `New message from ${newMessage.sender?.name || "Someone"}`,
      })
    }
  }

  // Initial load
  useEffect(() => {
    if (!userId) return
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, userId])

  // Subscribe to Ably channels for real-time updates
  useAblyChannel(
    ABLY_CHANNELS.CHAT(conversationId),
    ABLY_EVENTS.CHAT_MESSAGE,
    (message) => {
      handleNewMessage(message)
    }
  )

  // Subscribe to notification channel for messages in other conversations
  useAblyChannel(
    userId ? ABLY_CHANNELS.NOTIFICATIONS(userId) : "",
    ABLY_EVENTS.NOTIFICATION_NEW,
    (notification: any) => {
      if (notification.type === "chat" && notification.link?.includes(conversationId)) {
        // Refresh messages if notification is for this conversation
        refresh()
      }
    }
  )

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      })
    }
  }, [messages.length])

  async function handleApproveMessage(messageId: string) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/chat/message/${messageId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to approve message")
      }

      // Update message status locally
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: "APPROVED" } : m))
      )

      toast({
        title: "Message Approved",
        description: "You can now reply to this conversation.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to approve message",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRejectMessage(messageId: string) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/chat/message/${messageId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to reject message")
      }

      // Update message status locally
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: "REJECTED" } : m))
      )

      toast({
        title: "Message Rejected",
        description: "You have rejected this message.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reject message",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !userId || isLoading) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/chat/${conversationId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to send message")
      }

      const newMessage = await res.json()
      
      // Add message optimistically
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === newMessage.id)
        if (exists) {
          return prev
        }
        return [
          ...prev,
          {
            ...newMessage,
            createdAt: new Date(newMessage.createdAt),
          },
        ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      })

      setText("")
      
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      })
    } catch (error: any) {
      console.error("Error sending message:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send message",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Can only send if there are no pending messages from others (must approve/reject first)
  const canSendMessage = !hasPendingMessages

  return (
    <section className="md:col-span-8 lg:col-span-9 flex h-[calc(100vh-8rem)] flex-col rounded-xl border border-white/20 bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md text-white">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/60 text-sm">
            <div className="text-center">
              <p className="text-lg mb-2">No messages yet</p>
              <p className="text-sm opacity-70">Start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => {
              const isOwn = m.senderId === userId
              const isPending = m.status === "PENDING" && !isOwn
              const isRejected = m.status === "REJECTED"
              
              return (
                <div
                  key={m.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"} w-full`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      isOwn
                        ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
                        : isRejected
                        ? "bg-red-500/20 text-white/50 border border-red-300/30"
                        : isPending
                        ? "bg-yellow-500/20 text-white border border-yellow-300/30"
                        : "bg-white/20 dark:bg-indigo-900/30 text-white border border-white/10"
                    }`}
                  >
                    <p className={`break-words leading-relaxed ${isRejected ? "line-through" : ""}`}>
                      {m.content}
                    </p>
                    <div className={`flex items-center gap-1.5 mt-1.5 ${isOwn ? "justify-end" : "justify-start"}`}>
                      <span className="text-[10px] opacity-70">
                        {format(m.createdAt, "h:mm a")}
                      </span>
                      {isOwn && (
                        <span className="text-[10px] opacity-70">
                          {m.seenBy.length > 1 ? "✓✓" : "✓"}
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[10px] text-yellow-300">Pending</span>
                      )}
                      {isRejected && (
                        <span className="text-[10px] text-red-300">Rejected</span>
                      )}
                    </div>
                    
                    {/* Approve/Decline buttons for pending messages */}
                    {isPending && (
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button
                          onClick={() => handleApproveMessage(m.id)}
                          disabled={isLoading}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-2"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Accept
                        </Button>
                        <Button
                          onClick={() => handleRejectMessage(m.id)}
                          disabled={isLoading}
                          size="sm"
                          variant="destructive"
                          className="text-xs h-7 px-2"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>
      
      {/* Message Approval UI - show when there are pending messages */}
      {hasPendingMessages && (
        <div className="border-t border-white/20 p-4 bg-yellow-500/10">
          <p className="text-sm text-white/80 text-center mb-2">
            You have pending messages that require your approval before you can reply.
          </p>
        </div>
      )}
      
      {/* Input Form - only show if no pending messages */}
      {canSendMessage && (
        <form onSubmit={onSend} className="border-t border-white/20 p-4 bg-white/5">
          <div className="flex gap-2 items-end">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type a message..."
              className="min-h-[44px] max-h-32 bg-white/10 dark:bg-indigo-900/30 text-white placeholder:text-white/50 border-white/20 resize-none focus-visible:ring-2 focus-visible:ring-indigo-400 flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  onSend(e)
                }
              }}
              rows={1}
            />
            <div className="flex gap-2 items-center">
              {/* File Upload Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-[40px] w-[40px] p-0 bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 hover:scale-105 rounded-full transition-all duration-200 shadow-sm"
                title="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              {/* Camera Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-[40px] w-[40px] p-0 bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 hover:scale-105 rounded-full transition-all duration-200 shadow-sm"
                title="Take photo"
              >
                <Camera className="w-5 h-5" />
              </Button>
              {/* Picture Upload Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-[40px] w-[40px] p-0 bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 hover:scale-105 rounded-full transition-all duration-200 shadow-sm"
                title="Upload image"
              >
                <Image className="w-5 h-5" />
              </Button>
              {/* Send Button */}
              <Button
                type="submit"
                disabled={isLoading || !text.trim()}
                className="shrink-0 h-[44px] w-[44px] p-0 bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:from-indigo-400 hover:to-violet-500 hover:scale-105 hover:shadow-lg disabled:opacity-50 rounded-full transition-all duration-200"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </form>
      )}
      
      {/* Blocked Message - if has pending messages */}
      {!canSendMessage && (
        <div className="border-t border-white/20 p-4 bg-white/5">
          <p className="text-sm text-white/60 text-center">
            Please approve or decline the pending messages above to continue the conversation.
          </p>
        </div>
      )}
    </section>
  )
}


