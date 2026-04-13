import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProfileClient } from "@/components/alumni/profile-client"

export default async function ProfilePage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      image: true,
    },
  })

  return (
    <ProfileClient
      userId={session.user.id}
      userName={user?.name || "User"}
      userEmail={user?.email || ""}
      userImage={user?.image || null}
      profile={profile}
    />
  )
}
