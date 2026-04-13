"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ContentFormModal } from "@/components/admin/content-form-modal"
import { CreateGalleryModal } from "@/components/admin/create-gallery-modal"
import { createGallery, updateGallery, deleteGallery } from "@/actions/gallery.actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Plus, Edit, Trash2, Image as ImageIcon, Eye } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

interface Gallery {
  id: string
  title: string
  description: string | null
  images: string[]
  coverImage: string | null
  isPublic: boolean
  createdAt: Date
  event: {
    title: string
  } | null
}

interface GalleryManagementClientProps {
  galleries: Gallery[]
}

export function GalleryManagementClient({
  galleries: initialGalleries,
}: GalleryManagementClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [editingGallery, setEditingGallery] = useState<Gallery | null>(null)
  const [deleteGalleryId, setDeleteGalleryId] = useState<string | null>(null)

  const galleryFields = [
    { name: "title", label: "Title", type: "text" as const, required: true, placeholder: "Gallery title" },
    { name: "description", label: "Description", type: "textarea" as const, placeholder: "Gallery description..." },
    {
      name: "media",
      label: "Media",
      type: "fileupload" as const,
      required: true,
      accept: "image/*,video/*",
      multiple: true,
      maxFiles: 30,
      maxSizeMB: 50,
      note: "Images/Videos up to 50MB each",
      placeholder: "Select Files",
    },
    { name: "isPublic", label: "Public", type: "checkbox" as const, placeholder: "Make gallery publicly visible" },
  ]

  const handleCreate = async (values: Record<string, any>) => {
    // Handle file uploads
    const mediaFiles = values._files_media as File[] | undefined
    let mediaUrls: string[] = []
    let coverUrl: string | undefined = undefined

    if (!mediaFiles || mediaFiles.length === 0) {
      return { success: false, error: "Please upload at least one image or video" }
    }

    try {
      const fd = new FormData()
      mediaFiles.forEach((f) => fd.append("files", f))
      const uploaded = await uploadFiles(fd)
      
      if (uploaded.length === 0) {
        return { success: false, error: "Failed to upload files. Please try again." }
      }

      mediaUrls = uploaded.map((u) => u.url)
      // Use selected cover URL or first image
      const coverIndex = values._coverIndex !== undefined ? parseInt(values._coverIndex) : 0
      coverUrl = mediaUrls[coverIndex] || mediaUrls[0] || undefined

      if (!session?.user?.id) {
        return { success: false, error: "You must be logged in to create a gallery" }
      }

      await createGallery({
        title: values.title || "",
        description: values.description || "",
        mediaUrls,
        coverUrl,
        isPublic: values.isPublic ?? true,
        createdBy: session.user.id, // Required by interface, but server action will use session for security
      })

      // The revalidatePath in the server action will automatically update
      // the Alumni Gallery page when they visit it next
      router.refresh()
      return { success: true }
    } catch (error: any) {
      console.error("Error in handleCreate:", error)
      return { success: false, error: error.message || "Failed to create gallery" }
    }
  }

  const handleUpdate = async (values: Record<string, any>) => {
    if (!editingGallery) return { success: false, error: "No gallery selected" }

    try {
      // Handle file uploads if new files are provided
      const mediaFiles = values._files_media as File[] | undefined
      let imageUrls: string[] = editingGallery.images
      let coverImage: string | undefined = editingGallery.coverImage || undefined

      if (mediaFiles && mediaFiles.length > 0) {
        const fd = new FormData()
        mediaFiles.forEach((f) => fd.append("files", f))
        const uploaded = await uploadFiles(fd)
        
        if (uploaded.length === 0) {
          return { success: false, error: "Failed to upload files. Please try again." }
        }

        imageUrls = uploaded.map((u) => u.url)
        // Use selected cover index or first image, or keep existing
        const coverIndex = values._coverIndex !== undefined ? parseInt(values._coverIndex) : 0
        coverImage = imageUrls[coverIndex] || imageUrls[0] || coverImage
      }

      const result = await updateGallery(editingGallery.id, {
        title: values.title || "",
        description: values.description || "",
        images: imageUrls.join(", "),
        coverImage,
        isPublic: values.isPublic ?? true,
      })

      if (result.success) {
        router.refresh()
      }
      return result
    } catch (error: any) {
      console.error("Error in handleUpdate:", error)
      return { success: false, error: error.message || "Failed to update gallery" }
    }
  }

  const handleDelete = async () => {
    if (!deleteGalleryId) return

    const result = await deleteGallery(deleteGalleryId)
    if (result.success) {
      toast({
        title: "Success",
        description: "Gallery deleted successfully.",
      })
      setDeleteGalleryId(null)
      router.refresh()
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to delete gallery",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Manage Gallery</h1>
          <p className="text-white/70 mt-2">
            Create and manage photo galleries
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingGallery(null)
            setOpen(true)
          }}
          className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Gallery
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
        {initialGalleries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60">No galleries yet. Click &quot;New Gallery&quot; to create your first gallery.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/10 border-b border-white/10">
                  <TableHead className="text-white/80">Title</TableHead>
                  <TableHead className="text-white/80">Cover Image</TableHead>
                  <TableHead className="text-white/80">Images</TableHead>
                  <TableHead className="text-white/80">Event</TableHead>
                  <TableHead className="text-white/80">Status</TableHead>
                  <TableHead className="text-white/80">Created</TableHead>
                  <TableHead className="text-right text-white/80">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialGalleries.map((gallery) => (
                  <TableRow key={gallery.id} className="border-b border-white/10 hover:bg-white/5">
                    <TableCell className="font-medium text-white">{gallery.title}</TableCell>
                    <TableCell>
                      {gallery.coverImage ? (
                        <div className="relative h-12 w-12 rounded overflow-hidden">
                          <Image
                            src={gallery.coverImage}
                            alt={gallery.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 rounded bg-white/10 flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-white/60" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-white/60" />
                        <span className="text-sm text-white/90">{gallery.images.length} images</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {gallery.event ? (
                        <span className="text-sm text-white/90">{gallery.event.title}</span>
                      ) : (
                        <span className="text-sm text-white/60">Standalone</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          gallery.isPublic
                            ? "bg-emerald-400/15 border-emerald-300/30 text-emerald-200"
                            : "bg-gray-400/15 border-gray-300/30 text-gray-200"
                        }
                      >
                        {gallery.isPublic ? "Public" : "Private"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-white/80">
                      {new Date(gallery.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/80 hover:bg-white/10"
                          onClick={() => {
                            setEditingGallery(gallery)
                            setOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-300 hover:bg-red-500/20"
                          onClick={() => setDeleteGalleryId(gallery.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {editingGallery ? (
        <ContentFormModal
          title="Edit Gallery"
          mode="edit"
          open={open}
          onOpenChange={setOpen}
          fields={galleryFields}
          defaultValues={{
            ...editingGallery,
            images: editingGallery.images.join(", "),
          }}
          onSubmit={handleUpdate}
          description="Update the gallery details below."
        />
      ) : (
        <CreateGalleryModal open={open} onOpenChange={setOpen} />
      )}

      <AlertDialog
        open={!!deleteGalleryId}
        onOpenChange={(open) => !open && setDeleteGalleryId(null)}
      >
        <AlertDialogContent className="bg-gray-900 border border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This action cannot be undone. This will permanently delete the gallery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


