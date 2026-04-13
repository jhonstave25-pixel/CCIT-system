"use client"

import { useState } from "react"
import { createGallery } from "@/actions/gallery.actions"
import { uploadFiles } from "@/actions/upload.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Image from "next/image"
import { X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface CreateGalleryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateGalleryModal({ open, onOpenChange }: CreateGalleryModalProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [media, setMedia] = useState<File[]>([])
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!title || media.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Title and media are required.",
      })
      return
    }

    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create a gallery.",
      })
      return
    }

    setLoading(true)

    try {
      // Upload images/videos using the existing uploadFiles action
      const formData = new FormData()
      media.forEach((file) => formData.append("files", file))
      const uploaded = await uploadFiles(formData)

      if (uploaded.length === 0) {
        throw new Error("Failed to upload files")
      }

      const uploadedUrls = uploaded.map((u) => u.url)
      // Use selected cover index or default to first image
      const coverIndex = selectedCoverIndex !== null ? selectedCoverIndex : 0
      const coverUrl = uploadedUrls[coverIndex] || uploadedUrls[0]

      await createGallery({
        title,
        description,
        mediaUrls: uploadedUrls,
        coverUrl,
        isPublic,
        createdBy: session.user.id,
      })

      toast({
        title: "Success",
        description: "Gallery created successfully! It will now appear on the Alumni Gallery page.",
      })

      // Reset form
      setTitle("")
      setDescription("")
      setMedia([])
      setSelectedCoverIndex(null)
      setIsPublic(false)
      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      console.error("Error creating gallery:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create gallery. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMedia = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index)
    setMedia(newMedia)
    // If removed media was the cover, reset cover selection
    if (selectedCoverIndex === index) {
      setSelectedCoverIndex(null)
    } else if (selectedCoverIndex !== null && selectedCoverIndex > index) {
      // Adjust cover index if a file before it was removed
      setSelectedCoverIndex(selectedCoverIndex - 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gray-900 border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Create New Gallery
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Upload photos or videos to share with the alumni community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="title" className="text-white">
              Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Gallery title"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 mt-1"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-white">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Gallery description..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 mt-1 min-h-[100px] resize-none"
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="media" className="text-white">
              Media *
            </Label>
            <input
              id="media"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                setMedia((prev) => [...prev, ...files])
              }}
              className="block w-full text-sm text-white bg-white/10 border border-white/20 rounded-md p-2 mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              disabled={loading}
            />
            {media.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {media.map((file, idx) => {
                  const fileUrl = URL.createObjectURL(file)
                  const isImage = file.type.startsWith("image/")
                  const isCover = selectedCoverIndex === idx

                  return (
                    <div
                      key={idx}
                      className={`relative w-28 h-28 border-2 rounded-md overflow-hidden cursor-pointer transition-all ${
                        isCover
                          ? "border-indigo-400 ring-2 ring-indigo-300"
                          : "border-white/20 hover:border-white/40"
                      }`}
                      onClick={() => setSelectedCoverIndex(idx)}
                    >
                      {isImage ? (
                        <Image src={fileUrl} alt="" fill className="object-cover" />
                      ) : (
                        <video src={fileUrl} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-center justify-center">
                        {isCover && (
                          <span className="bg-indigo-600/80 text-white px-2 py-1 rounded text-xs">
                            Cover
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveMedia(idx)
                          }}
                          className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 rounded-full p-1 transition-colors"
                          disabled={loading}
                        >
                          <X size={14} className="text-white" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {media.length > 0 && (
              <p className="text-xs text-white/60 mt-2">
                Click on an image to set it as the cover. If not selected, the first image will be used.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="isPublic" className="text-white">
              Public
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Switch
                id="isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
                disabled={loading}
              />
              <span className="text-sm text-white/80">Make gallery publicly visible</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            disabled={loading || !title || media.length === 0}
            onClick={handleSubmit}
            className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

