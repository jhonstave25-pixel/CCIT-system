import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Users, UserPlus, UserCheck } from "lucide-react"
import { ConnectionsList } from "@/components/connections/connections-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ConnectionsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Get all alumni users with their profiles (excluding current user)
  const alumni = await prisma.user.findMany({
    where: {
      role: "ALUMNI",
      id: {
        not: session.user.id,
      },
      profile: {
        isPublic: true,
      },
    },
    include: {
      profile: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  })

  // Get connection status for each alumni
  const alumniWithConnections = await Promise.all(
    alumni.map(async (alumnus) => {
      const connection = await prisma.connection.findFirst({
        where: {
          OR: [
            { requesterId: session.user.id, receiverId: alumnus.id },
            { requesterId: alumnus.id, receiverId: session.user.id },
          ],
        },
      })

      return {
        ...alumnus,
        connectionStatus: connection?.status || null,
        connectionId: connection?.id || null,
        isReceiver: connection?.receiverId === session.user.id,
      }
    })
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-slate-900 dark:text-white pt-16 sm:pt-20 p-6 md:p-10 transition-colors">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Alumni Connections</h1>
            </div>
            <p className="text-slate-600 dark:text-white/70">Connect with fellow graduates and expand your network</p>
          </div>
          <div className="flex gap-3">
            <Link href="/connections/my-connections">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <UserCheck className="w-4 h-4 mr-2" />
                My Connections
              </Button>
            </Link>
            <Link href="/connections/pending">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <UserPlus className="w-4 h-4 mr-2" />
                Pending Requests
              </Button>
            </Link>
          </div>
        </div>

        <ConnectionsList 
          users={alumniWithConnections} 
          currentUserId={session.user.id}
          showAll={true}
        />
      </div>
    </div>
  )
}

