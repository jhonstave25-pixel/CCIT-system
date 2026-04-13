import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getPendingConnections } from "@/actions/connection.actions"
import { PendingConnectionsList } from "@/components/connections/pending-connections-list"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function PendingConnectionsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const connectionsResult = await getPendingConnections(session.user.id)
  
  if (!connectionsResult.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white pt-16 sm:pt-20 p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-12 text-center">
              <p className="text-lg text-white/80">Failed to load pending connections</p>
              <p className="text-sm text-white/60 mt-2">Please try again later</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const { receivedRequests = [], sentRequests = [] } = connectionsResult

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white pt-16 sm:pt-20 p-6 md:p-10 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/connections">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <UserPlus className="w-8 h-8 text-indigo-300" />
              <h1 className="text-4xl font-bold">Pending Connections</h1>
            </div>
            <p className="text-white/70 mt-1">Manage your connection requests</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Received Requests</p>
                <p className="text-3xl font-bold text-white">{receivedRequests.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Sent Requests</p>
                <p className="text-3xl font-bold text-white">{sentRequests.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-yellow-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Received Requests Section */}
        {receivedRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-300" />
              Received Requests
              <span className="text-sm font-normal text-white/60">
                ({receivedRequests.length} pending)
              </span>
            </h2>
            <PendingConnectionsList 
              requests={receivedRequests.map((req: any) => ({
                user: req.requester,
                connectionId: req.id,
                message: req.message,
                createdAt: req.createdAt,
                type: "received",
              }))}
              currentUserId={session.user.id}
            />
          </div>
        )}

        {/* Sent Requests Section */}
        {sentRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-yellow-300" />
              Sent Requests
              <span className="text-sm font-normal text-white/60">
                ({sentRequests.length} pending)
              </span>
            </h2>
            <PendingConnectionsList 
              requests={sentRequests.map((req: any) => ({
                user: req.receiver,
                connectionId: req.id,
                message: req.message,
                createdAt: req.createdAt,
                type: "sent",
              }))}
              currentUserId={session.user.id}
            />
          </div>
        )}

        {/* Empty State */}
        {receivedRequests.length === 0 && sentRequests.length === 0 && (
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-12 text-center">
              <UserPlus className="w-16 h-16 mx-auto mb-4 text-white/40" />
              <p className="text-lg text-white/80">No pending connection requests</p>
              <p className="text-sm text-white/60 mt-2 mb-6">
                Browse the alumni directory to send connection requests
              </p>
              <Link href="/connections">
                <Button className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white">
                  <Users className="w-4 h-4 mr-2" />
                  Browse Alumni
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
