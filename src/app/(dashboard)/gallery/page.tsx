import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Image from "next/image"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default async function GalleryPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const galleries = await prisma.gallery.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#2563eb] via-[#4f46e5] to-[#7c3aed] dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white pt-16 sm:pt-20 p-6 md:p-10 transition-colors">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-10">Alumni Gallery</h1>

        {galleries.length === 0 ? (
          <p className="text-white/70">No galleries posted yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {galleries.map((gallery) => (
              <Card
                key={gallery.id}
                className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white hover:bg-white/15 dark:hover:bg-indigo-950/40 transition-all duration-300 hover:shadow-xl"
              >
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">{gallery.title}</CardTitle>
                  {gallery.description && (
                    <p className="text-sm text-white/70 mt-2">{gallery.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  {(gallery.coverImage || gallery.images[0]) && (
                    <div className="relative w-full h-[250px] rounded-lg overflow-hidden">
                      <Image
                        src={gallery.coverImage || gallery.images[0]}
                        alt={gallery.title}
                        fill
                        className="rounded-lg object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
