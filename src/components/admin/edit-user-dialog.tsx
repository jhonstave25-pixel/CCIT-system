"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateUserRole } from "@/actions/admin.actions"
import { Edit } from "lucide-react"
import type { User } from "@prisma/client"

export function EditUserDialog({ user }: { user: User }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [role, setRole] = useState(user.role)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    const result = await updateUserRole(user.id, role as any)

    if (result.success) {
      setSuccess("User role updated successfully!")
      setTimeout(() => {
        setOpen(false)
        router.refresh()
      }, 1500)
    } else {
      setError(result.error || "Failed to update user role")
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center w-full px-2 py-1.5 text-sm hover:bg-gray-100 rounded">
          <Edit className="mr-2 h-4 w-4" />
          Edit Role
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User Role</DialogTitle>
          <DialogDescription>
            Update the role for {user.name || user.email}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
              {success}
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-2 block">Current Email</label>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Role</label>
            <Select value={role} onValueChange={(value) => setRole(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALUMNI">Alumni</SelectItem>
                <SelectItem value="FACULTY">Faculty</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Role"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}


