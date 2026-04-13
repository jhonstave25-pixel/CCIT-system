"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"

interface StatusBadgeProps {
  status: "UNVERIFIED" | "VERIFIED"
  onVerify?: () => void
  loading?: boolean
  showVerifyButton?: boolean
}

export function StatusBadge({
  status,
  onVerify,
  loading = false,
  showVerifyButton = true,
}: StatusBadgeProps) {
  if (status === "VERIFIED") {
    return (
      <Badge className="bg-emerald-400/15 border-emerald-300/30 text-emerald-200">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Verified
      </Badge>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className="bg-yellow-400/15 border-yellow-300/30 text-yellow-200">
        Pending Verification
      </Badge>
      {showVerifyButton && onVerify && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onVerify}
          disabled={loading}
          className="h-7 px-2 text-yellow-200 hover:bg-yellow-400/10 hover:text-yellow-100"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3" />
          )}
        </Button>
      )}
    </div>
  )
}



