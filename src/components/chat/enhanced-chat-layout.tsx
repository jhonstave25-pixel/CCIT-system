"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Send, Menu, X, Ban, UserCheck, Paperclip, Camera, Image } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { getMessages } from "@/app/(dashboard)/messages/_actions"
import { blockUser, unblockUser, checkMutualBlock } from "@/actions/block.actions"
import { useToast } from "@/hooks/use-toast"
import { useAblyChannel, ABLY_CHANNELS, ABLY_EVENTS, usePresence } from "@/lib/ably"
import { ChatPresence } from "./chat-presence"
import { TypingIndicator } from "./typing-indicator"

interface Conversation {
  id: string
  name: string | null
  isGroup: boolean
  participants: Array<{
    user: {
      id: string
      name: string | null
      image: string | null
    }
  }>
  messages: Array<{
    id: string
    content: string
    createdAt: Date | string
    senderId: string
  }>
  updatedAt: Date | string
}

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: Date
  seenBy: string[]
}

interface EnhancedChatLayoutProps {
  conversations: Conversation[]
  initialConversationId?: string
}

export default function EnhancedChatLayout({
  conversations,
  initialConversationId,
}: EnhancedChatLayoutProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const userId = session?.user?.id || ""

  const [activeChatId, setActiveChatId] = useState<string | null>(
    initialConversationId || null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [isBlocker, setIsBlocker] = useState(false)
  const [isBlockedBy, setIsBlockedBy] = useState(false)
  const [blockLoading, setBlockLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  // Get active conversation details
  const activeChat = conversations.find((c) => c.id === activeChatId)

  // Get conversation display name and avatar
  const getConversationDisplay = (conv: Conversation) => {
    const others = conv.participants
      .map((p) => p.user)
      .filter((u) => u.id !== userId)

    const name = conv.isGroup
      ? conv.name || "Group Chat"
      : others.length > 0
        ? others.map((u) => u.name || "User").join(", ")
        : conv.participants[0]?.user.name || "User"

    const avatarUrl = others.length > 0 ? others[0].image : conv.participants[0]?.user.image
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)

    return { name, avatarUrl, initials }
  }

  // Check if users are blocked
  const checkBlockStatus = useCallback(async (otherUserId: string) => {
    if (!userId) return
    try {
      const result = await checkMutualBlock(userId, otherUserId)
      if (result.success) {
        setIsBlocked(result.isBlocked)
        setIsBlocker(result.isBlocker)
        setIsBlockedBy(result.isBlockedBy)
      }
    } catch (error) {
      console.error("Error checking block status:", error)
    }
  }, [userId])

  // Load messages for active conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!userId) return
    try {
      const data = await getMessages(conversationId, userId)
      // Deduplicate messages by ID and sort by creation time
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
  }, [userId])

  // Set active chat and load messages
  useEffect(() => {
    if (activeChatId && userId) {
      loadMessages(activeChatId)
      // Check block status for 1:1 chats
      const activeChat = conversations.find((c) => c.id === activeChatId)
      if (activeChat && !activeChat.isGroup) {
        const otherUser = activeChat.participants.find((p) => p.user.id !== userId)?.user
        if (otherUser) {
          checkBlockStatus(otherUser.id)
        }
      }
      // Only update URL if it's different
      if (pathname !== `/chat/${activeChatId}`) {
        router.push(`/chat/${activeChatId}`)
      }
    }
  }, [activeChatId, userId, loadMessages, checkBlockStatus, pathname, router, conversations])

  // Sync with URL
  useEffect(() => {
    const chatIdFromPath = pathname.split("/chat/")[1]
    if (chatIdFromPath && chatIdFromPath !== activeChatId) {
      setActiveChatId(chatIdFromPath)
    }
  }, [pathname, activeChatId])

  // Handle new message from Ably
  const handleNewMessage = useCallback((newMessage: any) => {
    if (!newMessage || !newMessage.id) return
    
    if (newMessage.conversationId === activeChatId) {
      setMessages((prev) => {
        // Check if message already exists
        const exists = prev.some((m) => m.id === newMessage.id)
        if (exists) {
          return prev
        }
        
        // Add new message and sort by creation time
        const updated = [
          ...prev,
          {
            ...newMessage,
            createdAt: new Date(newMessage.createdAt),
          },
        ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        
        return updated
      })
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      })
    } else {
      toast({
        title: "New message",
        description: `New message from ${newMessage.sender?.name || "Someone"}`,
      })
    }
  }, [activeChatId, toast])

  // Subscribe to Ably channels for real-time updates
  useAblyChannel(
    activeChatId ? ABLY_CHANNELS.CHAT(activeChatId) : "",
    ABLY_EVENTS.CHAT_MESSAGE,
    handleNewMessage
  )

  // Subscribe to notification channel for messages in other conversations
  useAblyChannel(
    userId ? ABLY_CHANNELS.NOTIFICATIONS(userId) : "",
    ABLY_EVENTS.NOTIFICATION_NEW,
    (notification: any) => {
      if (notification.type === "chat" && notification.link?.includes(activeChatId)) {
        // Refresh messages if notification is for this conversation
        if (activeChatId) loadMessages(activeChatId)
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

  // File upload handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && activeChatId) {
      // TODO: Implement file upload to server
      toast({
        title: "File selected",
        description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      })
      // Reset input
      e.target.value = ""
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && activeChatId) {
      // TODO: Implement image upload to server
      toast({
        title: "Image selected",
        description: `${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
      })
      // Reset input
      e.target.value = ""
    }
  }

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && activeChatId) {
      // TODO: Implement photo upload to server
      toast({
        title: "Photo captured",
        description: `Photo (${(file.size / 1024).toFixed(1)} KB)`,
      })
      // Reset input
      e.target.value = ""
    }
  }

  // Send message
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || !userId || !activeChatId || isLoading) return

    setIsLoading(true)
    try {
      const res = await fetch(`/api/chat/${activeChatId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message.trim() }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to send message")
      }

      const newMessage = await res.json()
      setMessages((prev) => {
        // Check if message already exists (might have arrived via Ably)
        const exists = prev.some((m) => m.id === newMessage.id)
        if (exists) {
          return prev
        }
        // Add new message and sort by creation time
        return [
          ...prev,
          {
            ...newMessage,
            createdAt: new Date(newMessage.createdAt),
          },
        ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      })

      setMessage("")
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

  const activeDisplay = activeChat ? getConversationDisplay(activeChat) : null
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-[calc(100dvh-8rem)] sm:h-[calc(100dvh-9rem)] rounded-xl overflow-hidden bg-gradient-to-br from-[#0a0d2b] via-[#14163d] to-[#1c0f3e] shadow-xl border border-white/10">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "w-full md:w-[300px] border-r border-white/10 bg-white/5 backdrop-blur-sm flex flex-col transition-transform duration-300 z-50",
        "fixed md:relative inset-y-0 left-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Conversations</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-white/10 text-white"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ScrollArea className="flex-1 custom-scrollbar">
          {conversations.length === 0 ? (
            <p className="text-sm text-center text-white/50 py-6">No conversations yet</p>
          ) : (
            <div className="p-2">
              {conversations.map((chat) => {
                const display = getConversationDisplay(chat)
                const lastMessage = chat.messages[0]
                const lastMessageText = lastMessage
                  ? lastMessage.content.length > 50
                    ? lastMessage.content.substring(0, 50) + "..."
                    : lastMessage.content
                  : "No messages yet"

                const timeAgo = lastMessage
                  ? formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })
                  : ""

                const isActive = chat.id === activeChatId

                return (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setActiveChatId(chat.id)
                      setSidebarOpen(false) // Close sidebar on mobile when selecting conversation
                    }}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-colors mb-1",
                      isActive
                        ? "bg-gradient-to-r from-indigo-500/30 to-violet-600/30 border border-indigo-400/30"
                        : "hover:bg-white/10"
                    )}
                  >
                    {display.avatarUrl ? (
                      <Avatar className="h-10 w-10 shrink-0 border border-white/20">
                        <AvatarImage src={display.avatarUrl} alt={display.name} />
                        <AvatarFallback className="bg-indigo-500/40 text-white text-xs font-semibold">
                          {display.initials}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-500/40 to-violet-600/40 flex items-center justify-center text-white text-xs font-semibold border border-white/20">
                        {display.initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="truncate text-sm font-medium text-white">{display.name}</p>
                        {timeAgo && (
                          <span className="text-xs text-white/50 shrink-0">{timeAgo}</span>
                        )}
                      </div>
                      <p className="truncate text-xs text-white/60">{lastMessageText}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        {activeChat && activeDisplay ? (
          <>
            <div className="flex items-center gap-3 px-4 sm:px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-sm">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              {activeDisplay.avatarUrl ? (
                <Avatar className="h-10 w-10 border border-white/20">
                  <AvatarImage src={activeDisplay.avatarUrl} alt={activeDisplay.name} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500/40 to-violet-600/40 text-white font-semibold">
                    {activeDisplay.initials}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/40 to-violet-600/40 text-white uppercase font-semibold border border-white/20">
                  {activeDisplay.initials}
                </div>
              )}
              <div className="flex-1">
                <p className="text-white font-medium">{activeDisplay.name}</p>
                <p className="text-xs text-white/60">Active now</p>
              </div>
              
              {/* Block/Unblock Button - only for 1:1 chats */}
              {!activeChat.isGroup && (
                <>
                  {/* Show unblock button only if current user is the blocker */}
                  {isBlocker && (
                    <button
                      onClick={async () => {
                        const otherUser = activeChat.participants.find(p => p.user.id !== userId)?.user
                        if (!otherUser || blockLoading) return
                        
                        setBlockLoading(true)
                        try {
                          const result = await unblockUser(userId, otherUser.id)
                          if (result.success) {
                            setIsBlocked(false)
                            setIsBlocker(false)
                            toast({ title: "User unblocked", description: "You can now message this user again." })
                          } else {
                            throw new Error(result.error || "Failed to unblock")
                          }
                        } catch (error: any) {
                          toast({ variant: "destructive", title: "Error", description: error.message })
                        } finally {
                          setBlockLoading(false)
                        }
                      }}
                      disabled={blockLoading}
                      className="p-2 rounded-lg transition-colors text-green-400 hover:bg-green-500/20 disabled:opacity-50"
                      title="Unblock user"
                    >
                      <UserCheck className="w-5 h-5" />
                    </button>
                  )}
                  
                  {/* Show block button only if not blocked at all */}
                  {!isBlocked && (
                    <button
                      onClick={async () => {
                        const otherUser = activeChat.participants.find(p => p.user.id !== userId)?.user
                        if (!otherUser || blockLoading) return
                        
                        setBlockLoading(true)
                        try {
                          const result = await blockUser(userId, otherUser.id, "Blocked from chat")
                          if (result.success) {
                            setIsBlocked(true)
                            setIsBlocker(true)
                            toast({ 
                              title: "User blocked", 
                              description: "You can't message them in this chat, and you won't receive their messages." 
                            })
                          } else {
                            throw new Error(result.error || "Failed to block")
                          }
                        } catch (error: any) {
                          toast({ variant: "destructive", title: "Error", description: error.message })
                        } finally {
                          setBlockLoading(false)
                        }
                      }}
                      disabled={blockLoading}
                      className="p-2 rounded-lg transition-colors text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                      title="Block user"
                    >
                      <Ban className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}
            </div>
            {/* Presence Indicator */}
            <ChatPresence
              conversationId={activeChatId!}
              userId={userId}
              userName={session?.user?.name || null}
              userImage={session?.user?.image || null}
              otherParticipants={activeChat.participants
                .map((p) => p.user)
                .filter((u) => u.id !== userId)}
            />
          </>
        ) : (
          <div className="flex items-center gap-3 px-6 py-4 border-b border-white/10 bg-white/5 backdrop-blur-sm">
            <p className="text-white/60 text-sm">Select a conversation</p>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 custom-scrollbar">
          <div className="p-6 space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-full text-white/50 min-h-[400px]">
                <p className="text-sm mb-1">No messages yet</p>
                <p className="text-xs">Start the conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((m) => {
                  const isOwn = m.senderId === userId
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex w-full",
                        isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] px-4 py-2.5 rounded-xl text-sm",
                          isOwn
                            ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg"
                            : "bg-white/10 text-white border border-white/10"
                        )}
                      >
                        <p className="break-words leading-relaxed">{m.content}</p>
                        <div
                          className={cn(
                            "flex items-center gap-1.5 mt-1.5",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          <span className="text-[10px] opacity-70">
                            {format(m.createdAt, "h:mm a")}
                          </span>
                          {isOwn && (
                            <span className="text-[10px] opacity-70">
                              {m.seenBy.length > 1 ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {/* Typing Indicator */}
        {activeChat && activeChatId && (
          <TypingIndicator
            conversationId={activeChatId}
            userId={userId}
            userName={session?.user?.name || null}
          />
        )}

        {/* Input Bar */}
        {activeChat && activeChatId && (
          <>
            {isBlocked ? (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-white/10 bg-red-500/10 backdrop-blur-sm">
                <Ban className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-300">
                  {isBlocker 
                    ? "You can't message them in this chat, and you won't receive their messages."
                    : "You've been blocked. You can't message them in this chat."}
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm"
              >
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/10 text-white placeholder:text-white/40 border-none focus-visible:ring-1 focus-visible:ring-indigo-400 focus-visible:ring-offset-0"
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                />
                <div className="flex gap-1">
                  {/* Hidden file inputs */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="*/*"
                  />
                  <input
                    type="file"
                    ref={cameraInputRef}
                    onChange={handleCameraCapture}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                  />
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/*"
                  />
                  
                  {/* File Upload Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-[36px] w-[36px] p-0 bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 hover:scale-105 rounded-full transition-all duration-200 shadow-sm"
                    title="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  {/* Camera Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => cameraInputRef.current?.click()}
                    className="h-[36px] w-[36px] p-0 bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 hover:scale-105 rounded-full transition-all duration-200 shadow-sm"
                    title="Take photo"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  {/* Picture Upload Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => imageInputRef.current?.click()}
                    className="h-[36px] w-[36px] p-0 bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:border-white/30 hover:scale-105 rounded-full transition-all duration-200 shadow-sm"
                    title="Upload image"
                  >
                    <Image className="w-4 h-4" />
                  </Button>
                  {/* Send Button */}
                  <Button
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    className="rounded-full px-3 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}

