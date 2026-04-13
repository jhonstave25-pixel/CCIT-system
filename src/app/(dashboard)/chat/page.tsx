import { listConversations } from "@/app/(dashboard)/messages/_actions"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import EnhancedChatLayout from "@/components/chat/enhanced-chat-layout"

export default async function ChatIndex() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const conversations = await listConversations(session.user.id)

  return <EnhancedChatLayout conversations={conversations} />
}

