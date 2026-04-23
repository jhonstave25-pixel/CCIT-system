"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteUser } from "@/actions/admin.actions"
import { Trash2 } from "lucide-react"

export function DeleteUserDialog({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    const result = await deleteUser(userId)

    if (result.success) {
      setOpen(false)
      router.refresh()
    } else {
      alert(result.error || "Failed to delete user")
    }

    setIsLoading(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button className="flex items-center w-full px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete User
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-slate-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-300">
            This action cannot be undone. This will permanently delete the user account for{" "}
            <strong className="text-white">{userName}</strong> and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} className="bg-slate-800 text-white hover:bg-slate-700 border-slate-600">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}


