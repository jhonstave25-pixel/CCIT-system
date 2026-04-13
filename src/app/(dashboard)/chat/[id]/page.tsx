import { listConversations } from "@/app/(dashboard)/messages/_actions"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import EnhancedChatLayout from "@/components/chat/enhanced-chat-layout"

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const { id } = await params
  const conversations = await listConversations(session.user.id)

  return <EnhancedChatLayout conversations={conversations} initialConversationId={id} />
}

