import { listConversations } from "@/app/(dashboard)/messages/_actions"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

export default async function Sidebar() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const convos = await listConversations(session.user.id)

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <aside className="md:col-span-4 lg:col-span-3 space-y-3 rounded-xl border border-white/20 bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md p-4 h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
      <h3 className="text-lg font-semibold text-white mb-4">Conversations</h3>
      <ul className="space-y-2">
        {convos.length === 0 ? (
          <li className="text-sm text-white/60 text-center py-8">No conversations yet</li>
        ) : (
          convos.map((c) => {
            const others = c.participants
              .map((p) => p.user)
              .filter((u) => u.id !== session.user.id)

            const label = c.isGroup
              ? c.name || "Group Chat"
              : others.length > 0
                ? others.map((u) => u.name || "User").join(", ")
                : c.participants[0]?.user.name || "User"

            const avatarUrl = others.length > 0 ? others[0].image : c.participants[0]?.user.image
            const initials = getInitials(label)

            const lastMessage = c.messages[0]
            const lastMessageText = lastMessage
              ? lastMessage.content.length > 50
                ? lastMessage.content.substring(0, 50) + "..."
                : lastMessage.content
              : "No messages yet"

            const timeAgo = lastMessage
              ? formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })
              : ""

            return (
              <li key={c.id}>
                <Link
                  href={`/chat/${c.id}`}
                  className="flex items-center gap-3 rounded-lg p-3 hover:bg-white/10 transition-colors"
                >
                  {avatarUrl ? (
                    <Avatar className="h-10 w-10 shrink-0 border border-white/20">
                      <AvatarImage src={avatarUrl} alt={label} />
                      <AvatarFallback className="bg-indigo-500/40 text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-500/40 flex items-center justify-center text-white text-sm font-semibold border border-white/20">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="truncate text-sm font-medium text-white">{label}</p>
                      {timeAgo && (
                        <span className="text-xs text-white/50 shrink-0">{timeAgo}</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-white/60">{lastMessageText}</p>
                  </div>
                </Link>
              </li>
            )
          })
        )}
      </ul>
    </aside>
  )
}


