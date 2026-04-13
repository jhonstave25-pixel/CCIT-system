"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Reply } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MessageThread {
  id: string
  otherUser: {
    id: string
    name: string | null
    image: string | null
  }
  lastMessage: {
    content: string
    createdAt: string
  } | null
  unreadCount: number
}

interface InboxProps {
  userId: string
}

export function Inbox({ userId }: InboxProps) {
  const [threads, setThreads] = useState<MessageThread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMessages()
  }, [userId])

  async function loadMessages() {
    setLoading(true)
    try {
      const res = await fetch("/api/faculty/messages")
      if (!res.ok) throw new Error("Failed to load messages")
      const data = await res.json()
      setThreads(data.threads || [])
    } catch (error) {
      console.error("Error loading messages:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Inbox</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full bg-white/10" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-12 text-white/60">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-white/30" />
              <p>No messages yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {threads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/chat/${thread.id}`}
                  className="block"
                >
                  <div className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white truncate">
                            {thread.otherUser.name || "Unknown User"}
                          </h3>
                          {thread.unreadCount > 0 && (
                            <span className="h-5 w-5 rounded-full bg-indigo-500 text-xs flex items-center justify-center text-white font-semibold shrink-0">
                              {thread.unreadCount > 99 ? "99+" : thread.unreadCount}
                            </span>
                          )}
                        </div>
                        {thread.lastMessage && (
                          <>
                            <p className="text-sm text-white/70 truncate mb-1">
                              {thread.lastMessage.content}
                            </p>
                            <p className="text-xs text-white/50">
                              {formatDistanceToNow(
                                new Date(thread.lastMessage.createdAt),
                                { addSuffix: true }
                              )}
                            </p>
                          </>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-4 shrink-0 text-white hover:bg-white/10"
                        onClick={(e) => {
                          e.preventDefault()
                          window.location.href = `/chat/${thread.id}`
                        }}
                      >
                        <Reply className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}



