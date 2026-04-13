import Sidebar from "@/components/chat/sidebar"
import ChatWindow from "@/components/chat/chat-window"

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <>
      <Sidebar />
      <ChatWindow conversationId={id} />
    </>
  )
}




