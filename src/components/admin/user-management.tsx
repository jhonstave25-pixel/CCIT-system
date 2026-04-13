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
import { CreateUserButton } from "./create-user-button"
import { UserTable } from "./user-table"
import type { User, Profile } from "@prisma/client"

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
}: {
  users: UserWithProfile[]
  stats: {
    total: number
    alumni: number
    faculty: number
    pendingFaculty?: number
    admin: number
  }
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "ALL")

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
        {session?.user.role === "ADMIN" && <CreateUserButton />}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      </div>

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


