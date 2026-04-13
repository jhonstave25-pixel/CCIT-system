"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAblyChannel } from "@/lib/ably/client"
import { ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { EditUserDialog } from "./edit-user-dialog"
import { DeleteUserDialog } from "./delete-user-dialog"
import { StatusBadge } from "@/components/StatusBadge"
import { useToast } from "@/hooks/use-toast"
import type { User, Profile, FacultyStatus, UserStatus } from "@prisma/client"
import { MoreVertical, Eye, CheckCircle, XCircle } from "lucide-react"

type UserWithProfile = User & {
  profile: Profile | null
  userStatus: UserStatus
  _count: {
    eventsCreated: number
    postsCreated: number
    jobsPosted: number
  }
}

const roleColors = {
  ADMIN: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  FACULTY: "bg-blue-100 text-blue-800",
  ALUMNI: "bg-green-100 text-green-800",
}

const statusColors = {
  PENDING: "bg-yellow-400/15 border-yellow-300/30 text-yellow-200",
  APPROVED: "bg-emerald-400/15 border-emerald-300/30 text-emerald-200",
  REJECTED: "bg-red-400/15 border-red-300/30 text-red-200",
}

export function UserTable({ users: initialUsers }: { users: UserWithProfile[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [processing, setProcessing] = useState<string | null>(null)
  const [verifyingUserId, setVerifyingUserId] = useState<string | null>(null)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [userToVerify, setUserToVerify] = useState<UserWithProfile | null>(null)
  const [users, setUsers] = useState<UserWithProfile[]>(initialUsers)

  // Update users when initialUsers prop changes
  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  // Subscribe to real-time user verification updates
  useAblyChannel(
    ABLY_CHANNELS.USERS_UPDATE,
    ABLY_EVENTS.USER_VERIFIED,
    (payload: { userId: string; userStatus: "VERIFIED" | "UNVERIFIED"; verifiedAt?: string; verifiedBy?: { id: string; name: string | null } }) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === payload.userId
            ? {
                ...user,
                userStatus: payload.userStatus as UserStatus,
                verifiedAt: payload.verifiedAt ? new Date(payload.verifiedAt) : null,
              }
            : user
        )
      )
      // Refresh the page data to ensure consistency
      router.refresh()
    }
  )

  // Subscribe to real-time user creation updates
  useAblyChannel(
    ABLY_CHANNELS.USERS_UPDATE,
    ABLY_EVENTS.USER_CREATED,
    (payload: { 
      userId: string
      name: string | null
      email: string
      role: string
      userStatus: "UNVERIFIED" | "VERIFIED"
      status: string | null
      createdAt: string
      profile: Profile | null
    }) => {
      // Check if user already exists in the list
      setUsers((prevUsers) => {
        const userExists = prevUsers.some((u) => u.id === payload.userId)
        if (userExists) {
          // User already exists, just update it
          return prevUsers.map((user) =>
            user.id === payload.userId
              ? {
                  ...user,
                  name: payload.name,
                  email: payload.email,
                  role: payload.role as any,
                  userStatus: payload.userStatus as UserStatus,
                  status: payload.status as any,
                }
              : user
          )
        }
        // Add new user to the beginning of the list
        const newUser: UserWithProfile = {
          id: payload.userId,
          name: payload.name,
          email: payload.email,
          role: payload.role as any,
          userStatus: payload.userStatus as UserStatus,
          status: payload.status as any,
          createdAt: new Date(payload.createdAt),
          updatedAt: new Date(),
          profile: payload.profile,
          _count: {
            eventsCreated: 0,
            postsCreated: 0,
            jobsPosted: 0,
          },
        } as UserWithProfile
        return [newUser, ...prevUsers]
      })
      // Refresh to get full data
      setTimeout(() => router.refresh(), 500)
    }
  )

  const handleStatusUpdate = async (userId: string, status: FacultyStatus) => {
    setProcessing(userId)
    try {
      const res = await fetch("/api/faculty/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update status")
      }

      toast({
        title: "Success",
        description: `Faculty status updated to ${status}`,
      })

      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update status",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleVerifyClick = (user: UserWithProfile) => {
    setUserToVerify(user)
    setVerifyDialogOpen(true)
  }

  const handleVerifyConfirm = async () => {
    if (!userToVerify) return

    setVerifyingUserId(userToVerify.id)
    try {
      const res = await fetch(`/api/users/${userToVerify.id}/verify`, {
        method: "POST",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to verify user")
      }

      toast({
        title: "Success",
        description: "User verified successfully.",
      })

      setVerifyDialogOpen(false)
      setUserToVerify(null)
      router.refresh()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to verify user",
      })
    } finally {
      setVerifyingUserId(null)
    }
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-white/10 text-white/80">
          <tr>
            <th className="text-left px-5 py-3 font-medium">User</th>
            <th className="text-left px-5 py-3 font-medium">Email</th>
            <th className="text-left px-5 py-3 font-medium">Role</th>
            <th className="text-left px-5 py-3 font-medium">Status</th>
            <th className="text-left px-5 py-3 font-medium">Joined</th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-white/10 hover:bg-white/5 transition-colors">
              <td className="px-5 py-4 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-violet-500/80 grid place-items-center text-white text-xs font-bold">
                  {(user.name || user.email)[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-white">{user.name || "No name"}</div>
                </div>
              </td>
              <td className="px-5 py-4 text-white/90">{user.email}</td>
              <td className="px-5 py-4">
                <span className="px-2 py-1 text-xs rounded-md bg-white/10 border border-white/20 text-white/90">
                  {user.role.replace("_", " ")}
                </span>
              </td>
              <td className="px-5 py-4">
                {user.role === "FACULTY" && user.status ? (
                  <span
                    className={`px-2 py-1 text-xs rounded-md border ${
                      statusColors[user.status] || statusColors.PENDING
                    }`}
                  >
                    {user.status}
                  </span>
                ) : (
                  <StatusBadge
                    status={user.userStatus || "UNVERIFIED"}
                    onVerify={() => handleVerifyClick(user)}
                    loading={verifyingUserId === user.id}
                    showVerifyButton={user.userStatus !== "VERIFIED"}
                  />
                )}
              </td>
              <td className="px-5 py-4 text-white/80">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-5 py-4 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-white/80 hover:bg-white/10">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/users/${user.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <EditUserDialog user={user} />
                    </DropdownMenuItem>
                    {user.role === "FACULTY" && user.status === "PENDING" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(user.id, "APPROVED")}
                          disabled={processing === user.id}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve Faculty
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(user.id, "REJECTED")}
                          disabled={processing === user.id}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject Faculty
                        </DropdownMenuItem>
                      </>
                    )}
                    {user.role === "FACULTY" && user.status === "REJECTED" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleStatusUpdate(user.id, "APPROVED")}
                          disabled={processing === user.id}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve Faculty
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <DeleteUserDialog userId={user.id} userName={user.name || user.email} />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/60">No users found</p>
        </div>
      )}

      <AlertDialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to verify {userToVerify?.name || userToVerify?.email}? 
              This action will mark the user as verified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVerifyConfirm}
              disabled={verifyingUserId !== null}
            >
              {verifyingUserId ? "Verifying..." : "Verify"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


