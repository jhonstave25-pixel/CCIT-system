"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ContentFormModal } from "@/components/admin/content-form-modal"
import { createPost, updatePost, deletePost } from "@/actions/post.actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Plus, Edit, Trash2 } from "lucide-react"
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

interface Post {
  id: string
  title: string
  category: string
  excerpt: string | null
  published: boolean
  featured: boolean
  createdAt: Date
  publishedAt: Date | null
  tags: string[]
}

interface NewsManagementClientProps {
  posts: Post[]
}

export function NewsManagementClient({ posts: initialPosts }: NewsManagementClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [deletePostId, setDeletePostId] = useState<string | null>(null)

  const postFields = [
    { name: "title", label: "Title", type: "text" as const, required: true, placeholder: "News article title" },
    { name: "category", label: "Category", type: "text" as const, required: true, placeholder: "e.g., Announcements, Updates" },
    { name: "excerpt", label: "Excerpt", type: "textarea" as const, placeholder: "Brief summary of the article..." },
    { name: "content", label: "Content", type: "textarea" as const, required: true, placeholder: "Full article content..." },
    { name: "sourceUrl", label: "Source URL (e.g., Facebook post link)", type: "text" as const, placeholder: "https://facebook.com/..." },
    { name: "tags", label: "Tags", type: "text" as const, placeholder: "tag1, tag2, tag3" },
    { name: "coverImage", label: "Cover Image URL", type: "text" as const, placeholder: "https://..." },
    { name: "published", label: "Published", type: "checkbox" as const, placeholder: "Publish this article" },
    { name: "featured", label: "Featured", type: "checkbox" as const, placeholder: "Feature this article" },
  ]

  const handleCreate = async (values: Record<string, any>) => {
    const result = await createPost(values)
    if (result.success) {
      router.refresh()
    }
    return result
  }

  const handleUpdate = async (values: Record<string, any>) => {
    if (!editingPost) return { success: false, error: "No post selected" }
    const result = await updatePost(editingPost.id, values)
    if (result.success) {
      router.refresh()
    }
    return result
  }

  const handleDelete = async () => {
    if (!deletePostId) return

    const result = await deletePost(deletePostId)
    if (result.success) {
      toast({
        title: "Success",
        description: "Post deleted successfully.",
      })
      setDeletePostId(null)
      router.refresh()
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error || "Failed to delete post",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Manage News</h1>
          <p className="text-white/70 mt-2">
            Create and manage news articles and announcements
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingPost(null)
            setOpen(true)
          }}
          className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Article
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
        {initialPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/60">No news articles yet. Click "New Article" to create your first post.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/10 border-b border-white/10">
                  <TableHead className="text-white/80">Title</TableHead>
                  <TableHead className="text-white/80">Category</TableHead>
                  <TableHead className="text-white/80">Status</TableHead>
                  <TableHead className="text-white/80">Created</TableHead>
                  <TableHead className="text-white/80">Tags</TableHead>
                  <TableHead className="text-right text-white/80">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialPosts.map((post) => (
                  <TableRow key={post.id} className="border-b border-white/10 hover:bg-white/5">
                    <TableCell className="font-medium text-white">
                      <div className="flex items-center gap-2">
                        {post.title}
                        {post.featured && (
                          <Badge className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white">Featured</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-white/90">{post.category}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          post.published
                            ? "bg-emerald-400/15 border-emerald-300/30 text-emerald-200"
                            : "bg-blue-400/15 border-blue-300/30 text-blue-200"
                        }
                      >
                        {post.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/80">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-white/80">
                      {post.tags?.slice(0, 2).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/80 hover:bg-white/10"
                          onClick={() => {
                            setEditingPost(post)
                            setOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-300 hover:bg-red-500/20"
                          onClick={() => setDeletePostId(post.id)}
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

      <ContentFormModal
        title={editingPost ? "Edit News Article" : "Create New News Article"}
        mode={editingPost ? "edit" : "create"}
        open={open}
        onOpenChange={setOpen}
        fields={postFields}
        defaultValues={editingPost ? { ...editingPost, tags: editingPost.tags?.join(", ") } : {}}
        onSubmit={editingPost ? handleUpdate : handleCreate}
        description={
          editingPost
            ? "Update the news article details below."
            : "Fill in the details to create a new news article."
        }
      />

      <AlertDialog open={!!deletePostId} onOpenChange={(open) => !open && setDeletePostId(null)}>
        <AlertDialogContent className="bg-gray-900 border border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              This action cannot be undone. This will permanently delete the news article.
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

