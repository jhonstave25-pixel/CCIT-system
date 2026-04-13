import Sidebar from "@/components/chat/sidebar"

export default function MessagesIndex() {
  return (
    <>
      <Sidebar />
      <div className="hidden md:block md:col-span-8 lg:col-span-9 rounded-xl border border-white/20 bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md p-6 text-sm text-white/70 flex items-center justify-center">
        Select a conversation to start chatting.
      </div>
    </>
  )
}
