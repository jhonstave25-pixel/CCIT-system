import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CreateGalleryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  return <>{children}</>
}

