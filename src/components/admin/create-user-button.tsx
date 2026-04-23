"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createUser } from "@/actions/admin.actions"

interface CreateUserButtonProps {
  prefilledData?: {
    name?: string
    email?: string
    role?: "ALUMNI" | "FACULTY" | "ADMIN"
  }
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateUserButton({ 
  prefilledData, 
  open: controlledOpen, 
  onOpenChange 
}: CreateUserButtonProps = {}) {
  const { data: session } = useSession()
  const [internalOpen, setInternalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  
  // Only show for ADMIN
  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await createUser({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as "ALUMNI" | "FACULTY" | "ADMIN",
    })

    if (result.success) {
      setSuccess("User created successfully!")
      setTimeout(() => {
        setOpen(false)
        window.location.reload()
      }, 1500)
    } else {
      setError(result.error || "Failed to create user")
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white">
          Create User
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Create New User</DialogTitle>
          <DialogDescription className="text-slate-300">
            Create a new user account. They will need to verify their email with OTP.
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
            <Label htmlFor="name" className="text-white">Full Name</Label>
            <Input 
              id="name" 
              name="name" 
              defaultValue={prefilledData?.name || ""}
              required 
              className="bg-slate-900 text-white border-slate-600 placeholder-slate-400"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              defaultValue={prefilledData?.email || ""}
              required 
              className="bg-slate-900 text-white border-slate-600 placeholder-slate-400"
            />
          </div>
          <div>
            <Label htmlFor="role" className="text-white">Role</Label>
            <Select name="role" defaultValue={prefilledData?.role || "ALUMNI"}>
              <SelectTrigger className="bg-slate-900 text-white border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALUMNI">Alumni</SelectItem>
                <SelectItem value="FACULTY">Faculty</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

