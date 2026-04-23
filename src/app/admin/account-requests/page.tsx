import { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AccountRequestsClient } from "./client"

export const metadata: Metadata = {
  title: "Account Requests | Admin",
  description: "Manage pending account requests",
}

export default async function AccountRequestsPage() {
  const session = await auth()

  // Check if user is admin
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    redirect("/login")
  }

  // Fetch all account requests with admin details
  const requests = await prisma.accountRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      admin: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  // Get statistics
  const stats = {
    pending: requests.filter((r) => r.status === "PENDING").length,
    approved: requests.filter((r) => r.status === "APPROVED").length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
    total: requests.length,
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <AccountRequestsClient 
        initialRequests={requests} 
        initialStats={stats}
        adminRole={session.user.role}
      />
    </div>
  )
}
