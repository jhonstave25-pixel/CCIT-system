"use client"

import { useState, useEffect, useCallback } from "react"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAblyChannel } from "@/lib/ably/client"
import { ABLY_CHANNELS, ABLY_EVENTS } from "@/lib/ably/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
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
import { StatusBadge } from "@/components/StatusBadge"
import { Search, Download, Eye, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

interface Alumni {
  id: string
  name: string | null
  email: string
  userStatus: "UNVERIFIED" | "VERIFIED"
  profile: {
    batch: string
    degree: string
    currentCompany: string | null
    currentPosition: string | null
  } | null
  alumniProfile: {
    verified: boolean
  } | null
}

interface DirectoryTableProps {
  onVerifyChange?: () => void
}

export function DirectoryTable({ onVerifyChange }: DirectoryTableProps) {
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [program, setProgram] = useState("all")
  const [batch, setBatch] = useState("all")
  const [verified, setVerified] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()
  const [verifyingUserId, setVerifyingUserId] = useState<string | null>(null)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [userToVerify, setUserToVerify] = useState<Alumni | null>(null)
  const pageSize = 10

  // Debounce search input to reduce API calls
  const debouncedSearch = useDebounce(search, 300)

  const loadAlumni = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: debouncedSearch,
        program: program !== "all" ? program : "",
        batch: batch !== "all" ? batch : "",
        verified: verified !== "all" ? verified : "",
        page: page.toString(),
        pageSize: pageSize.toString(),
      })

      const res = await fetch(`/api/faculty/directory?${params}`)
      if (!res.ok) throw new Error("Failed to load alumni")
      const data = await res.json()
      setAlumni(data.alumni || [])
      setTotalPages(Math.ceil((data.total || 0) / pageSize))
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load alumni directory",
      })
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, program, batch, verified, page, toast])

  useEffect(() => {
    loadAlumni()
  }, [loadAlumni])

  // Subscribe to real-time user verification updates
  useAblyChannel(
    ABLY_CHANNELS.USERS_UPDATE,
    ABLY_EVENTS.USER_VERIFIED,
    (payload: { userId: string; userStatus: "VERIFIED" | "UNVERIFIED"; verifiedAt?: string; verifiedBy?: { id: string; name: string | null } }) => {
      setAlumni((prevAlumni) => {
        const updated = prevAlumni.map((alum) =>
          alum.id === payload.userId
            ? {
                ...alum,
                userStatus: payload.userStatus,
              }
            : alum
        )
        // Only reload if the user is in the current view
        const userInView = prevAlumni.some((alum) => alum.id === payload.userId)
        if (userInView) {
          // Use setTimeout to avoid calling loadAlumni during render
          setTimeout(() => {
            loadAlumni()
          }, 100)
        }
        return updated
      })
      // Notify parent component of the change
      onVerifyChange?.()
    }
  )

  // Subscribe to real-time user creation updates (only for ALUMNI)
  useAblyChannel(
    ABLY_CHANNELS.USERS_UPDATE,
    ABLY_EVENTS.USER_CREATED,
    (payload: { 
      userId: string
      name: string | null
      email: string
      role: string
      userStatus: "UNVERIFIED" | "VERIFIED"
      createdAt: string
      profile: {
        batch: string
        degree: string
        currentCompany: string | null
        currentPosition: string | null
      } | null
    }) => {
      // Only add if it's an ALUMNI user
      if (payload.role !== "ALUMNI") return

      setAlumni((prevAlumni) => {
        // Check if user already exists
        const userExists = prevAlumni.some((alum) => alum.id === payload.userId)
        if (userExists) {
          // User already exists, just update it
          return prevAlumni.map((alum) =>
            alum.id === payload.userId
              ? {
                  ...alum,
                  name: payload.name,
                  email: payload.email,
                  userStatus: payload.userStatus,
                  profile: payload.profile,
                }
              : alum
          )
        }
        // Add new alumni to the beginning of the list
        const newAlumni: Alumni = {
          id: payload.userId,
          name: payload.name,
          email: payload.email,
          userStatus: payload.userStatus,
          profile: payload.profile,
          alumniProfile: {
            verified: payload.userStatus === "VERIFIED",
          },
        }
        return [newAlumni, ...prevAlumni]
      })
      // Reload to ensure consistency
      setTimeout(() => {
        loadAlumni()
      }, 500)
      // Notify parent component
      onVerifyChange?.()
    }
  )


  const handleVerifyClick = (alum: Alumni) => {
    if (alum.userStatus === "VERIFIED") return
    setUserToVerify(alum)
    setVerifyDialogOpen(true)
  }

  const handleVerifyConfirm = async () => {
    if (!userToVerify) return

    setVerifyingUserId(userToVerify.id)
    // Optimistic update
    setAlumni((prev) =>
      prev.map((alum) =>
        alum.id === userToVerify.id
          ? { ...alum, userStatus: "VERIFIED" as const }
          : alum
      )
    )

    try {
      const res = await fetch(`/api/users/${userToVerify.id}/verify`, {
        method: "POST",
      })

      if (!res.ok) {
        // Revert optimistic update on error
        setAlumni((prev) =>
          prev.map((alum) =>
            alum.id === userToVerify.id
              ? { ...alum, userStatus: userToVerify.userStatus }
              : alum
          )
        )
        const error = await res.json()
        throw new Error(error.error || "Failed to verify user")
      }

      toast({
        title: "Success",
        description: "User verified successfully.",
      })

      setVerifyDialogOpen(false)
      setUserToVerify(null)
      loadAlumni()
      onVerifyChange?.()
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

  async function exportCSV() {
    try {
      const params = new URLSearchParams({
        q: search,
        program: program !== "all" ? program : "",
        batch: batch !== "all" ? batch : "",
        verified: verified !== "all" ? verified : "",
        export: "true",
      })

      const res = await fetch(`/api/faculty/directory?${params}`)
      if (!res.ok) throw new Error("Failed to export")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `alumni-directory-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "CSV exported successfully",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to export CSV",
      })
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Alumni Directory</CardTitle>
          <Button
            onClick={exportCSV}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
            />
          </div>
          <Select value={program} onValueChange={(v) => { setProgram(v); setPage(1) }}>
            <SelectTrigger className="w-full md:w-[180px] bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              <SelectItem value="BSIT">BSIT</SelectItem>
              <SelectItem value="BSCS">BSCS</SelectItem>
              <SelectItem value="BSIS">BSIS</SelectItem>
            </SelectContent>
          </Select>
          <Select value={batch} onValueChange={(v) => { setBatch(v); setPage(1) }}>
            <SelectTrigger className="w-full md:w-[180px] bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              <SelectItem value="2020">2020</SelectItem>
              <SelectItem value="2021">2021</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
          <Select value={verified} onValueChange={(v) => { setVerified(v); setPage(1) }}>
            <SelectTrigger className="w-full md:w-[180px] bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Verified</SelectItem>
              <SelectItem value="false">Unverified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 bg-indigo-900/40">
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-white">Email</TableHead>
                  <TableHead className="text-white">Batch</TableHead>
                  <TableHead className="text-white">Program</TableHead>
                  <TableHead className="text-white">Company</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="border-white/10 hover:bg-indigo-900/30">
                      <TableCell><Skeleton className="h-4 w-32 bg-white/10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40 bg-white/10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 bg-white/10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 bg-white/10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32 bg-white/10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 bg-white/10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 bg-white/10" /></TableCell>
                    </TableRow>
                  ))
                ) : alumni.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-white/60 py-8">
                      No alumni found
                    </TableCell>
                  </TableRow>
                ) : (
                  alumni.map((alum) => (
                    <TableRow key={alum.id} className="border-white/10 hover:bg-indigo-800/40 hover:backdrop-blur-sm">
                      <TableCell className="text-white font-medium transition-colors duration-200">
                        {alum.name || "N/A"}
                      </TableCell>
                      <TableCell className="text-white/80 transition-colors duration-200 group-hover:text-white">{alum.email}</TableCell>
                      <TableCell className="text-white/80 transition-colors duration-200">
                        {alum.profile?.batch || "N/A"}
                      </TableCell>
                      <TableCell className="text-white/80 transition-colors duration-200">
                        {alum.profile?.degree || "N/A"}
                      </TableCell>
                      <TableCell className="text-white/80 transition-colors duration-200">
                        {alum.profile?.currentCompany || "N/A"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={alum.userStatus || "UNVERIFIED"}
                          onVerify={() => handleVerifyClick(alum)}
                          loading={verifyingUserId === alum.id}
                          showVerifyButton={alum.userStatus !== "VERIFIED"}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link href={`/connections?userId=${alum.id}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-white hover:bg-white/20 hover:scale-110 transition-all duration-200"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-white/10 bg-white/5 p-4">
                <Skeleton className="h-4 w-32 bg-white/10 mb-2" />
                <Skeleton className="h-4 w-40 bg-white/10 mb-2" />
                <Skeleton className="h-4 w-24 bg-white/10" />
              </Card>
            ))
          ) : alumni.length === 0 ? (
            <div className="text-center text-white/60 py-8">
              No alumni found
            </div>
          ) : (
            alumni.map((alum) => (
              <Card key={alum.id} className="border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base truncate">
                      {alum.name || "N/A"}
                    </h3>
                    <p className="text-white/70 text-sm truncate mt-1">{alum.email}</p>
                  </div>
                  <StatusBadge
                    status={alum.userStatus || "UNVERIFIED"}
                    showVerifyButton={false}
                  />
                </div>
                <div className="space-y-2 text-sm text-white/80 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">Batch:</span>
                    <span>{alum.profile?.batch || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">Program:</span>
                    <span>{alum.profile?.degree || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/60">Company:</span>
                    <span className="truncate">{alum.profile?.currentCompany || "N/A"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/connections?userId=${alum.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-white/20 text-white hover:bg-white/10"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </Link>
                  {alum.userStatus !== "VERIFIED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyClick(alum)}
                      disabled={verifyingUserId === alum.id}
                      className="flex-1 border-white/20 text-white hover:bg-white/10"
                    >
                      {verifyingUserId === alum.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-white/60">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Next
              </Button>
            </div>
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
      </CardContent>
    </Card>
  )
}


