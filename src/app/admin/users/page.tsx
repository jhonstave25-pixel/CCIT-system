import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserManagement } from "@/components/admin/user-management"

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string }>
}) {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const resolvedSearchParams = await searchParams
  const search = resolvedSearchParams.search || ""
  const roleFilter = resolvedSearchParams.role || "ALL"

  const where: any = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }

  if (roleFilter !== "ALL") {
    where.role = roleFilter
  }

  const [users, accountRequests] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        profile: true,
        _count: {
          select: {
            eventsCreated: true,
            postsCreated: true,
            jobsPosted: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.accountRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const stats = {
    total: await prisma.user.count(),
    alumni: await prisma.user.count({ where: { role: "ALUMNI" } }),
    faculty: await prisma.user.count({ where: { role: "FACULTY" } }),
    pendingFaculty: await prisma.user.count({ where: { role: "FACULTY", status: "PENDING" } }),
    admin: await prisma.user.count({ where: { role: "ADMIN" } }),
    pendingAccountRequests: accountRequests.length,
  }

  return <UserManagement users={users} stats={stats} accountRequests={accountRequests} />
}
