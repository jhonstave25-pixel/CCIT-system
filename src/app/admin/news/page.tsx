import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { NewsManagementClient } from "@/components/admin/news-management-client"

export default async function AdminNewsPage() {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const posts = await prisma.post.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  })

  return <NewsManagementClient posts={posts} />
}
