import { prisma } from "@/lib/prisma"
import AdminFeedbackList from "@/components/admin/admin-feedback-list"

export async function FeedbackSection() {
  // Get feedback from Prisma database
  let feedbacks: any[] = []

  try {
    if (prisma.feedback) {
      feedbacks = await prisma.feedback.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      })
    } else {
      console.warn("Feedback model not available in Prisma client. Please run: npx prisma generate")
    }
  } catch (error: any) {
    console.error("Error fetching feedback from database:", error)
    // Return empty array if there's an error
    feedbacks = []
  }

  // Get user info for feedbacks with userId
  const userIds = feedbacks.filter((f) => f.userId).map((f) => f.userId!)
  const users = userIds.length > 0 
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      })
    : []

  const userMap = new Map(users.map((u) => [u.id, { name: u.name, email: u.email }]))

  return <AdminFeedbackList feedbacks={feedbacks} users={userMap} />
}

