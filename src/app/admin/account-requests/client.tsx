"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { 
  approveAccountRequest, 
  rejectAccountRequest,
  getAccountRequests 
} from "@/actions/account-request.actions"

type AccountRequest = {
  id: string
  firstName: string
  lastName: string
  email: string
  contactNumber: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: Date
  updatedAt: Date
  processedAt: Date | null
  processedBy: string | null
  notes: string | null
  admin: {
    name: string | null
    email: string | null
  } | null
}

type RequestStats = {
  pending: number
  approved: number
  rejected: number
  total: number
}

export function AccountRequestsClient({
  initialRequests,
  initialStats,
  adminRole,
}: {
  initialRequests: AccountRequest[]
  initialStats: RequestStats
  adminRole: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [requests, setRequests] = useState<AccountRequest[]>(initialRequests)
  const [stats, setStats] = useState<RequestStats>(initialStats)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // Approval dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<AccountRequest | null>(null)
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [role, setRole] = useState<"ALUMNI" | "FACULTY">("ALUMNI")
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectNotes, setRejectNotes] = useState("")

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = 
      request.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.contactNumber.includes(searchTerm)
    
    const matchesStatus = statusFilter === "ALL" || request.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGeneratedPassword(password)
  }

  const handleApproveClick = (request: AccountRequest) => {
    setSelectedRequest(request)
    generatePassword()
    setRole("ALUMNI")
    setNotes("")
    setApproveDialogOpen(true)
  }

  const handleRejectClick = (request: AccountRequest) => {
    setSelectedRequest(request)
    setRejectNotes("")
    setRejectDialogOpen(true)
  }

  const handleApprove = async () => {
    if (!selectedRequest || !generatedPassword) return
    
    setIsProcessing(true)
    
    try {
      const result = await approveAccountRequest(selectedRequest.id, {
        generatedPassword,
        role,
        notes,
      })
      
      if (result.success) {
        toast({
          title: "Account Created",
          description: `Account for ${selectedRequest.firstName} ${selectedRequest.lastName} has been created successfully.`,
        })
        
        // Refresh the requests list
        const refreshResult = await getAccountRequests()
        if (refreshResult.success && refreshResult.requests) {
          setRequests(refreshResult.requests as AccountRequest[])
          const newStats = {
            pending: refreshResult.requests.filter((r) => r.status === "PENDING").length,
            approved: refreshResult.requests.filter((r) => r.status === "APPROVED").length,
            rejected: refreshResult.requests.filter((r) => r.status === "REJECTED").length,
            total: refreshResult.requests.length,
          }
          setStats(newStats)
        }
        
        setApproveDialogOpen(false)
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

  const handleReject = async () => {
    if (!selectedRequest) return
    
    setIsProcessing(true)
    
    try {
      const result = await rejectAccountRequest(selectedRequest.id, rejectNotes)
      
      if (result.success) {
        toast({
          title: "Request Rejected",
          description: `Request from ${selectedRequest.firstName} ${selectedRequest.lastName} has been rejected.`,
        })
        
        // Refresh the requests list
        const refreshResult = await getAccountRequests()
        if (refreshResult.success && refreshResult.requests) {
          setRequests(refreshResult.requests as AccountRequest[])
          const newStats = {
            pending: refreshResult.requests.filter((r) => r.status === "PENDING").length,
            approved: refreshResult.requests.filter((r) => r.status === "APPROVED").length,
            rejected: refreshResult.requests.filter((r) => r.status === "REJECTED").length,
            total: refreshResult.requests.length,
          }
          setStats(newStats)
        }
        
        setRejectDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to reject request",
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "APPROVED":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "REJECTED":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Account Requests</h1>
          <p className="text-muted-foreground">
            Review and manage account creation requests from users
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.refresh()}
          className="w-full sm:w-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "ALL"
                  ? "No requests match your search criteria"
                  : "No account requests yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div 
                  className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <User className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {request.firstName} {request.lastName}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-muted-foreground">
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
                    <div className="flex items-center gap-3">
                      {getStatusBadge(request.status)}
                      {request.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-300 text-green-700 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApproveClick(request)
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRejectClick(request)
                            }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {expandedId === request.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedId === request.id && (
                  <div className="px-4 pb-4 pt-2 border-t bg-muted/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Submitted:</span>
                        <p className="font-medium">
                          {format(new Date(request.createdAt), "PPP 'at' p")}
                        </p>
                      </div>
                      {request.processedAt && (
                        <div>
                          <span className="text-muted-foreground">Processed:</span>
                          <p className="font-medium">
                            {format(new Date(request.processedAt), "PPP 'at' p")}
                          </p>
                        </div>
                      )}
                      {request.admin && (
                        <div>
                          <span className="text-muted-foreground">Processed By:</span>
                          <p className="font-medium">
                            {request.admin.name || request.admin.email}
                          </p>
                        </div>
                      )}
                      {request.notes && (
                        <div className="col-span-full">
                          <span className="text-muted-foreground">Notes:</span>
                          <p className="font-medium">{request.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Account Request</DialogTitle>
            <DialogDescription>
              Create an account for {selectedRequest?.firstName} {selectedRequest?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Generated Password</label>
              <div className="flex gap-2">
                <Input
                  value={generatedPassword}
                  onChange={(e) => setGeneratedPassword(e.target.value)}
                  type="text"
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                >
                  Regenerate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This password will be sent to the user&apos;s email
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={role} onValueChange={(v) => setRole(v as "ALUMNI" | "FACULTY")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALUMNI">Alumni</SelectItem>
                  <SelectItem value="FACULTY">Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={isProcessing || !generatedPassword}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Account Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject the request from {selectedRequest?.firstName} {selectedRequest?.lastName}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Add a reason for rejection..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={isProcessing}
              variant="destructive"
            >
              {isProcessing ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
