import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { EditUserDialog } from "@/components/admin/edit-user-dialog"
import { ArrowLeft } from "lucide-react"

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      _count: {
        select: {
          eventsCreated: true,
          postsCreated: true,
          jobsPosted: true,
          connectionsInitiated: true,
          connectionsReceived: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const roleColors = {
    ADMIN: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
    FACULTY: "bg-blue-100 text-blue-800",
    ALUMNI: "bg-green-100 text-green-800",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">User Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{user.name || "No name"}</CardTitle>
                <CardDescription className="mt-1">{user.email}</CardDescription>
              </div>
              <EditUserDialog user={user} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Role</h3>
              <span
                className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                  roleColors[user.role] || "bg-gray-100 text-gray-800"
                }`}
              >
                {user.role.replace("_", " ")}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
              <span
                className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                  user.emailVerified
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                }`}
              >
                {user.emailVerified ? "Verified" : "Unverified"}
              </span>
            </div>

            {user.profile && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Profile Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Graduation Year</p>
                    <p className="font-medium">{user.profile.graduationYear}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Degree</p>
                    <p className="font-medium">{user.profile.degree}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Major</p>
                    <p className="font-medium">{user.profile.major}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Batch</p>
                    <p className="font-medium">{user.profile.batch}</p>
                  </div>
                  {user.profile.currentCompany && (
                    <div>
                      <p className="text-sm text-gray-500">Current Company</p>
                      <p className="font-medium">{user.profile.currentCompany}</p>
                    </div>
                  )}
                  {user.profile.currentPosition && (
                    <div>
                      <p className="text-sm text-gray-500">Current Position</p>
                      <p className="font-medium">{user.profile.currentPosition}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Events Created</p>
              <p className="text-2xl font-bold">{user._count.eventsCreated}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Posts Created</p>
              <p className="text-2xl font-bold">{user._count.postsCreated}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Jobs Posted</p>
              <p className="text-2xl font-bold">{user._count.jobsPosted}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Connections</p>
              <p className="text-2xl font-bold">
                {user._count.connectionsInitiated + user._count.connectionsReceived}
              </p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

