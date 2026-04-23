"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreateUserButton } from "./create-user-button"
import { UserTable } from "./user-table"
import { approveAccountRequest } from "@/actions/account-request.actions"
import type { User, Profile, AccountRequest } from "@prisma/client"
import { UserPlus, CheckCircle, XCircle, Phone, Mail, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type UserWithProfile = User & {
  profile: Profile | null
  _count: {
    eventsCreated: number
    postsCreated: number
    jobsPosted: number
  }
}

export function UserManagement({
  users,
  stats,
  accountRequests,
}: {
  users: UserWithProfile[]
  stats: {
    total: number
    alumni: number
    faculty: number
    pendingFaculty?: number
    admin: number
    pendingAccountRequests: number
  }
  accountRequests: AccountRequest[]
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "ALL")
  const [selectedRequest, setSelectedRequest] = useState<AccountRequest | null>(null)
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleApproveRequest = async (request: AccountRequest) => {
    setIsProcessing(true)
    try {
      const result = await approveAccountRequest(request.id)
      if (result.success) {
        toast({
          title: "Request Approved",
          description: `Approved request from ${request.firstName} ${request.lastName}. Opening Create User dialog...`,
        })
        // Store the request data and open the Create User dialog
        setSelectedRequest(request)
        setCreateUserOpen(true)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to approve request",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (roleFilter !== "ALL") params.set("role", roleFilter)
    router.push(`/admin/users?${params.toString()}`)
  }

  const handleFilterChange = (value: string) => {
    setRoleFilter(value)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (value !== "ALL") params.set("role", value)
    router.push(`/admin/users?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">User Management</h1>
        {session?.user.role === "ADMIN" && (
          <CreateUserButton 
            prefilledData={selectedRequest ? {
              name: `${selectedRequest.firstName} ${selectedRequest.lastName}`,
              email: selectedRequest.email,
              role: "ALUMNI"
            } : undefined}
            open={createUserOpen}
            onOpenChange={(open) => {
              setCreateUserOpen(open)
              if (!open) setSelectedRequest(null)
            }}
          />
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4">
          <div className="text-sm text-white/70">Total Users</div>
          <div className="mt-1 text-3xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4">
          <div className="text-sm text-white/70">Alumni</div>
          <div className="mt-1 text-3xl font-bold text-white">{stats.alumni}</div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4">
          <div className="text-sm text-white/70">Faculty</div>
          <div className="mt-1 text-3xl font-bold text-white">{stats.faculty}</div>
          {stats.pendingFaculty !== undefined && stats.pendingFaculty > 0 && (
            <div className="mt-1 text-xs text-yellow-300">
              {stats.pendingFaculty} pending approval
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4">
          <div className="text-sm text-white/70">Admins</div>
          <div className="mt-1 text-3xl font-bold text-white">{stats.admin}</div>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4">
          <div className="text-sm text-white/70">Account Requests</div>
          <div className="mt-1 text-3xl font-bold text-white">{stats.pendingAccountRequests}</div>
          {stats.pendingAccountRequests > 0 && (
            <div className="mt-1 text-xs text-yellow-300">
              {stats.pendingAccountRequests} pending
            </div>
          )}
        </div>
      </div>

      {/* Account Requests Section */}
      {accountRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Pending Account Requests
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {accountRequests.map((request) => (
              <Card key={request.id} className="bg-white/5 border-white/15">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <User className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          {request.firstName} {request.lastName}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-white/70">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {request.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {request.contactNumber}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        Pending
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-green-500 text-green-700 hover:bg-green-600 hover:text-yellow-300"
                        onClick={() => handleApproveRequest(request)}
                        disabled={isProcessing}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve & Create
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Search / Filters */}
      <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_120px] gap-3">
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-lg px-3 bg-white/10 border border-white/20 placeholder:text-white/60 text-white"
          />
          <Select value={roleFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="h-10 rounded-lg px-3 bg-white/10 border border-white/20 text-white">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="ALUMNI">Alumni</SelectItem>
              <SelectItem value="FACULTY">Faculty</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="submit"
            onClick={handleSearch}
            className="h-10 bg-gradient-to-r from-indigo-500 to-violet-600 text-white"
          >
            Search
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5">
        <UserTable users={users} />
      </div>
    </div>
  )
}


