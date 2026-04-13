import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AlumniDirectory } from "@/components/alumni/alumni-directory"

export default async function DirectoryPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0d2b] via-[#14163d] to-[#1c0f3e] text-white pt-16 sm:pt-20 pb-10 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Alumni Directory</h1>
          <p className="text-white/70">Search and connect with alumni</p>
        </div>
        <AlumniDirectory />
      </div>
    </div>
  )
}

