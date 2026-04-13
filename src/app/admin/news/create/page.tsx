"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { createPost } from "@/actions/post.actions"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const newsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  category: z.string().min(2, "Category is required"),
  excerpt: z.string().optional(),
  content: z.string().min(10, "Content must be at least 10 characters"),
  sourceUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  tags: z.string().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
})

type NewsFormData = z.infer<typeof newsSchema>

export default function CreateNewsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const form = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      published: false,
      featured: false,
    },
  })

  const handleCoverDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      setCoverImage(file)
    }
    setIsDragging(false)
  }

  const handleCoverDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleCoverDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const onSubmit = (data: NewsFormData) => {
    startTransition(async () => {
      // Convert file to URL (in production, upload to storage first)
      const coverImageUrl = coverImage ? URL.createObjectURL(coverImage) : ""

      const result = await createPost({
        ...data,
        coverImage: coverImageUrl || undefined,
        published: data.published || false,
        featured: data.featured || false,
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "News article created successfully!",
        })
        router.push("/admin/news")
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to create news article",
        })
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white py-12 px-6 transition-colors">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin/news"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to News
        </Link>

        <Card className="w-full bg-white/10 dark:bg-indigo-950/30 border border-white/20 dark:border-indigo-800/30 backdrop-blur-xl text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Create News Article</CardTitle>
            <p className="text-white/70 text-sm">Write a new article for the alumni community.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label className="text-white">Title *</Label>
                <Input
                  {...form.register("title")}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Enter headline..."
                />
                {form.formState.errors.title && (
                  <p className="text-red-300 text-xs mt-1">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <Label className="text-white">Category *</Label>
                <Input
                  {...form.register("category")}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="e.g., Announcements, Updates"
                />
                {form.formState.errors.category && (
                  <p className="text-red-300 text-xs mt-1">{form.formState.errors.category.message}</p>
                )}
              </div>

              <div>
                <Label className="text-white">Summary (Excerpt)</Label>
                <Textarea
                  {...form.register("excerpt")}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[80px]"
                  placeholder="Short summary..."
                />
              </div>

              <div>
                <Label className="text-white">Content *</Label>
                <Textarea
                  {...form.register("content")}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[200px]"
                  placeholder="Write your article here..."
                />
                {form.formState.errors.content && (
                  <p className="text-red-300 text-xs mt-1">{form.formState.errors.content.message}</p>
                )}
              </div>

              <div>
                <Label className="text-white">Source URL (Optional)</Label>
                <Input
                  {...form.register("sourceUrl")}
                  type="url"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="https://facebook.com/posts/... or any source link"
                />
                {form.formState.errors.sourceUrl && (
                  <p className="text-red-300 text-xs mt-1">{form.formState.errors.sourceUrl.message}</p>
                )}
              </div>

              <div>
                <Label className="text-white">Tags</Label>
                <Input
                  {...form.register("tags")}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              {/* Cover Image Upload */}
              <div>
                <Label className="text-white">Cover Image (Optional)</Label>
                <div
                  onDrop={handleCoverDrop}
                  onDragOver={handleCoverDragOver}
                  onDragLeave={handleCoverDragLeave}
                  className={`mt-2 border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                    isDragging
                      ? "border-indigo-300 bg-indigo-500/20"
                      : "border-white/30 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {coverImage ? (
                    <div className="space-y-3">
                      <div className="relative w-full max-w-md mx-auto aspect-video rounded-lg overflow-hidden bg-white/10 border border-white/20">
                        <img
                          src={URL.createObjectURL(coverImage)}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-white/90 text-sm">{coverImage.name}</span>
                        <span className="text-white/60 text-xs">
                          {(coverImage.size / 1024).toFixed(1)} KB
                        </span>
                        <button
                          type="button"
                          onClick={() => setCoverImage(null)}
                          className="text-red-300 hover:text-red-400 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-white/80 text-sm mb-3">
                        Drag & drop cover image here, or click below to upload
                      </p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                        className="hidden"
                        id="coverImageUpload"
                      />
                      <label
                        htmlFor="coverImageUpload"
                        className="inline-block bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-5 py-2 rounded-lg text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        Select Cover Image
                      </label>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:from-indigo-600 hover:to-violet-700"
                >
                  {isPending ? "Publishing..." : "Publish Article"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

