import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, User, ExternalLink } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { FacebookEmbed, isFacebookUrl } from "@/components/news/facebook-embed"

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const { id } = await params

  // Try to find by id first, then by slug
  const post = await prisma.post.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!post) {
    notFound()
  }

  // Only show published posts to non-admins
  if (!post.published && session.user.role !== "ADMIN") {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white pt-16 sm:pt-20 p-6 md:p-10 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Link href="/dashboard/news">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to News
          </Button>
        </Link>

        {/* News Article Card */}
        <Card className="bg-white/10 dark:bg-indigo-950/30 backdrop-blur-md border-white/20 dark:border-indigo-800/30 text-white">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-3xl font-bold">{post.title}</CardTitle>
                  {post.featured && (
                    <Badge className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0">
                      Featured
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/80 mt-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{post.author.name || "Admin"}</span>
                  </div>
                  {post.publishedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(post.publishedAt), "PPP")}</span>
                    </div>
                  )}
                  <Badge className="bg-indigo-500/20 border-indigo-300/30 text-indigo-200">
                    {post.category}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Cover Image */}
            {post.coverImage && (
              <div className="mb-6 rounded-lg overflow-hidden">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {/* Excerpt */}
            {post.excerpt && (
              <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-lg text-white/90 italic">{post.excerpt}</p>
              </div>
            )}

            {/* Content */}
            <div className="prose prose-invert max-w-none mb-6">
              <div
                className="text-white/90 whitespace-pre-wrap leading-relaxed"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>

            {/* Facebook Embed */}
            {post.sourceUrl && isFacebookUrl(post.sourceUrl) && (
              <div className="my-8">
                <FacebookEmbed url={post.sourceUrl} />
              </div>
            )}

            {/* Source URL (non-Facebook) */}
            {post.sourceUrl && !isFacebookUrl(post.sourceUrl) && (
              <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                <a
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Source</span>
                </a>
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-white/5 border-white/20 text-white/80"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

