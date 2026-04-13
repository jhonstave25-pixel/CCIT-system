# Ably Real-Time Messaging Layer

Unified real-time communication layer for CCIT-Connect using Ably.

## Architecture

### Channel Naming Convention

All channels use the `ccit:` prefix for namespacing:

- `ccit:chat:{conversationId}` - Direct & group messaging
- `ccit:feed:public` - Public alumni feed
- `ccit:feed:alumni:{batchYear}` - Batch-specific feed
- `ccit:jobs:active` - Active job postings
- `ccit:jobs:application:{userId}` - User-specific job application updates
- `ccit:events:{eventId}` - Event-specific updates
- `ccit:records:{userId}` - Registrar document updates
- `ccit:notifications:{userId}` - User-specific notifications

### Security

- **Token-based authentication**: Clients authenticate via `/api/ably/token` endpoint
- **Capability-based permissions**: Tokens only grant access to authorized channels
- **Server-side publishing**: Sensitive operations publish from server actions/API routes
- **Client-side subscriptions**: Clients subscribe to channels they have permission for

## Usage

### Server-Side Publishing

```typescript
import { publishToAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"

// Publish a chat message
await publishToAblyChannel({
  channelName: ABLY_CHANNELS.CHAT(conversationId),
  eventName: ABLY_EVENTS.CHAT_MESSAGE,
  data: {
    id: message.id,
    conversationId,
    senderId: message.senderId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    seenBy: message.seenBy,
    sender: message.sender,
  },
})

// Publish a notification
await publishToAblyChannel({
  channelName: ABLY_CHANNELS.NOTIFICATIONS(userId),
  eventName: ABLY_EVENTS.NOTIFICATION_NEW,
  data: {
    id: notification.id,
    userId,
    type: "chat",
    title: "New Message",
    message: "You have a new message",
    link: "/chat/123",
    timestamp: new Date().toISOString(),
  },
})
```

### Client-Side Subscription

```typescript
import { useAblyChannel, ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably"

// Subscribe to chat messages
useAblyChannel(
  ABLY_CHANNELS.CHAT(conversationId),
  ABLY_EVENTS.CHAT_MESSAGE,
  (message) => {
    // Handle new message
    setMessages((prev) => [...prev, message])
  }
)

// Subscribe to notifications
useAblyChannel(
  ABLY_CHANNELS.NOTIFICATIONS(userId),
  ABLY_EVENTS.NOTIFICATION_NEW,
  (notification) => {
    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
    })
  }
)
```

### Enhanced Hooks

```typescript
import {
  useChatChannel,
  useJobChannel,
  useEventChannel,
  useFeedChannel,
  useNotificationChannel,
} from "@/lib/ably"

// Subscribe to chat
useChatChannel(conversationId, (message) => {
  // Handle message
})

// Subscribe to job updates
useJobChannel(userId, (update) => {
  // Handle job update
})

// Subscribe to event updates
useEventChannel(eventId, (update) => {
  // Handle event update
})

// Subscribe to feed updates
useFeedChannel(batchYear, (update) => {
  // Handle feed update
})

// Subscribe to notifications
useNotificationChannel(userId, (notification) => {
  // Handle notification
})
```

### Typing Indicators

```typescript
import { useTypingIndicator } from "@/lib/ably"

const { startTyping, stopTyping } = useTypingIndicator(
  conversationId,
  userId,
  userName
)

// Call when user starts typing
<input
  onKeyDown={startTyping}
  onBlur={stopTyping}
/>
```

### Live Toast Component

```typescript
import { LiveToast } from "@/components/notifications/LiveToast"

// Add to your layout or root component
<LiveToast userId={session?.user?.id} enabled={true} />
```

## API Routes

### `/api/ably/token`

Generates short-lived tokens for client authentication. Automatically called by the Ably client.

**Method**: POST  
**Auth**: Required (session)  
**Response**: Token request object

### `/api/ably/publish`

Publish endpoint for testing or admin actions.

**Method**: POST  
**Body**:
```json
{
  "channelName": "ccit:test",
  "eventName": "test:message",
  "data": { ... }
}
```

## Environment Variables

```bash
ABLY_API_KEY="xxxxx:yyyyy"  # Server-side API key
NEXT_PUBLIC_SITE_URL="http://localhost:3000"  # Site URL for token endpoint
NEXT_PUBLIC_APP_NAME="CCIT Connect"  # App name (optional)
```

## Best Practices

1. **Always use channel constants**: Use `ABLY_CHANNELS` and `ABLY_EVENTS` constants instead of hardcoded strings
2. **Publish from server**: Sensitive operations should publish from server actions/API routes
3. **Minimal payloads**: Send only IDs and status flags, fetch full data from database
4. **Error handling**: Always wrap Ably operations in try-catch blocks
5. **Optimistic updates**: Update UI optimistically, then reconcile with Ably messages
6. **Cleanup**: Hooks automatically cleanup subscriptions on unmount

## Testing

Visit `/test-ably` to test the Ably connection and message publishing.





