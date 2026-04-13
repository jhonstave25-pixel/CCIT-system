/**
 * Test page for Ably integration
 * Displays real-time messages received from Ably
 */

"use client"

import { useState, useCallback } from "react"
import { useAblyChannel, useAblyClient } from "@/lib/ably/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, Send, Radio } from "lucide-react"

type TestMessage = {
  message: string
  timestamp: string
  source: string
}

export default function TestAblyPage() {
  const [messages, setMessages] = useState<TestMessage[]>([])
  const [isPublishing, setIsPublishing] = useState(false)

  // Get Ably client and connection state
  const { connectionState } = useAblyClient()
  const isConnected = connectionState === "connected"

  // Subscribe to test channel
  const handleMessage = useCallback((message: any) => {
    console.log("Received:", message)
    // Handle both direct data and message.data formats
    const messageData = typeof message === 'object' && 'data' in message ? message.data : message
    setMessages((prev) => [messageData, ...prev].slice(0, 10)) // Keep last 10 messages
  }, [])

  useAblyChannel("ccit:test", "test:message", handleMessage)

  const publishTestMessage = async () => {
    setIsPublishing(true)
    try {
      const response = await fetch("/api/ably/test", {
        method: "POST",
      })

      const data = await response.json()
      if (data.success) {
        console.log("Message published successfully:", data.data)
      } else {
        console.error("Failed to publish message:", data.error)
        alert(`Failed to publish: ${data.error}`)
      }
    } catch (error: any) {
      console.error("Error publishing message:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            Ably Realtime Test
          </CardTitle>
          <CardDescription>
            Test real-time messaging with Ably. Click the button to publish a test message.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-gray-400"
                }`}
              />
              <span className="text-sm text-muted-foreground">
                {isConnected ? "Connected" : "Connecting..."}
              </span>
            </div>
            <Button onClick={publishTestMessage} disabled={isPublishing}>
              {isPublishing ? (
                "Publishing..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publish Test Message
                </>
              )}
            </Button>
          </div>

          {messages.length > 0 && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>
                Received: {messages[0].message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Recent Messages:</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No messages received yet. Click the button above to publish a test message.
                </p>
              ) : (
                messages.map((msg, index) => (
                  <Card key={index} className="p-3">
                    <div className="text-sm">
                      <p className="font-medium">{msg.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Expected Behavior:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Alert or console log showing &apos;Received: Hello from CCIT-Connect via Ably!&apos;</li>
              <li>Ably Debug Console shows messages arriving</li>
              <li>No errors in browser console regarding Ably initialization</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

