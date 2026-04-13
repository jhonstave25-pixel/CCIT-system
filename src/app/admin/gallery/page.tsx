import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { GalleryManagementClient } from "@/components/admin/gallery-management-client"

export default async function AdminGalleryPage() {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const galleries = await prisma.gallery.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      event: {
        select: {
          title: true,
        },
      },
    },
    take: 100,
  })

  return <GalleryManagementClient galleries={galleries} />
}
