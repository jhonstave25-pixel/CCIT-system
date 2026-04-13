import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function NewsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">News & Announcements</h1>
      <p>Stay updated with the latest news from the alumni community</p>
    </div>
  )
}

