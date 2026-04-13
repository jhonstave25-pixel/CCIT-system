import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PublicProfileClient } from "@/components/alumni/public-profile-client"

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const { id } = await params

  // Get the user being viewed
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      profile: true,
    },
  })

  if (!user) {
    redirect("/connections")
  }

  // Check if current user has a connection with this user
  const connection = await prisma.connection.findFirst({
    where: {
      OR: [
        { requesterId: session.user.id, receiverId: id },
        { requesterId: id, receiverId: session.user.id },
      ],
    },
  })

  // Get connection status
  let connectionStatus: "NONE" | "PENDING" | "ACCEPTED" | "REJECTED" = "NONE"
  let connectionId: string | null = null
  let isReceiver = false

  if (connection) {
    connectionStatus = connection.status
    connectionId = connection.id
    isReceiver = connection.receiverId === session.user.id
  }

  return (
    <PublicProfileClient
      currentUserId={session.user.id}
      user={user}
      connectionStatus={connectionStatus}
      connectionId={connectionId}
      isReceiver={isReceiver}
    />
  )
}
