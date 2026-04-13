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
import { createGallery } from "@/actions/gallery.actions"
import { uploadFiles } from "@/actions/upload.actions"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Uploader } from "@/components/shared/uploader"

const gallerySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
})

type GalleryFormData = z.infer<typeof gallerySchema>

export default function CreateGalleryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()
  const [media, setMedia] = useState<File[]>([])
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number | null>(null)

  const form = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      isPublic: true,
    },
  })

  const onSubmit = (data: GalleryFormData) => {
    if (media.length === 0) {
      toast({
        variant: "destructive",
        title: "Media Required",
        description: "Please upload at least one image or video.",
      })
      return
    }

    startTransition(async () => {
      try {
        // Upload media files first
        let uploaded = [] as Awaited<ReturnType<typeof uploadFiles>>

        if (media.length > 0) {
          const fd = new FormData()
          media.forEach((f) => fd.append("files", f))
          uploaded = await uploadFiles(fd)
        }

        if (uploaded.length === 0) {
          toast({
            variant: "destructive",
            title: "Upload Failed",
            description: "Failed to upload media files. Please try again.",
          })
          return
        }

        const urls = uploaded.map((u) => u.url)
        // Use selected cover index or default to first image
        const coverIndex = selectedCoverIndex !== null ? selectedCoverIndex : 0
        const cover = urls[coverIndex] || urls[0] || ""

        if (!session?.user?.id) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "You must be logged in to create a gallery",
          })
          return
        }

        await createGallery({
          title: data.title,
          description: data.description || "",
          mediaUrls: urls,
          coverUrl: cover || undefined,
          isPublic: data.isPublic ?? true,
          createdBy: session.user.id,
        })

        // If we get here, the gallery was created successfully
        toast({
          title: "Success",
          description: "Gallery created successfully! It will now appear on the Alumni Gallery page.",
        })
        router.push("/admin/gallery")
      } catch (error: any) {
        console.error("Error creating gallery:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "An unexpected error occurred. Please try again.",
        })
      }
    })
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white py-12 px-6 transition-colors">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin/gallery"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Gallery
        </Link>

        <Card className="w-full bg-white/10 dark:bg-indigo-950/30 border border-white/20 dark:border-indigo-800/30 backdrop-blur-xl text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Create Gallery Post</CardTitle>
            <p className="text-white/70 text-sm">Upload photos or videos to share with the alumni community.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label className="text-white">Title *</Label>
                <Input
                  {...form.register("title")}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Event or Album Title"
                />
                {form.formState.errors.title && (
                  <p className="text-red-300 text-xs mt-1">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div>
                <Label className="text-white">Description</Label>
                <Textarea
                  {...form.register("description")}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                  placeholder="Describe this gallery..."
                />
              </div>

              {/* Media Upload */}
              <div>
                <Label className="text-white">Media *</Label>
                <Uploader
                  accept="image/*,video/*"
                  multiple
                  maxFiles={30}
                  maxSizeMB={50}
                  note="Images/Videos up to 50MB each"
                  onChange={setMedia}
                  cta="Select Files"
                />
              </div>

              {/* Cover selector appears after upload */}
              {media.length > 0 && (
                <div>
                  <Label className="text-white">Choose Cover (optional)</Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {media.map((f, i) => {
                      const url = URL.createObjectURL(f)
                      const isImage = f.type.startsWith("image/")
                      const isSelected = selectedCoverIndex === i
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedCoverIndex(i)}
                          className={`rounded-lg overflow-hidden border transition-all ${
                            isSelected
                              ? "border-indigo-400 ring-2 ring-indigo-300"
                              : "border-white/20 hover:border-white/40"
                          }`}
                        >
                          {isImage ? (
                            <img src={url} alt={f.name} className="w-24 h-16 object-cover" />
                          ) : (
                            <video src={url} className="w-24 h-16 object-cover" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-white/70 mt-2">
                    If not selected, the first uploaded media will be used as the cover.
                  </p>
                </div>
              )}

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
                  disabled={isPending || media.length === 0}
                  className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50"
                >
                  {isPending ? "Uploading..." : "Create Gallery"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

