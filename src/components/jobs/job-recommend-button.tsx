"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { RecommendationModal } from "./recommendation-modal"
import { cn } from "@/lib/utils"

interface JobRecommendButtonProps {
  jobId: string
  jobTitle: string
  size?: "sm" | "default" | "lg"
  className?: string
}

export function JobRecommendButton({ 
  jobId, 
  jobTitle, 
  size = "sm",
  className 
}: JobRecommendButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size={size}
        variant="outline"
        className={cn(
          "border-white/20 text-white hover:bg-white/10",
          size === "sm" ? "w-full" : "",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <UserPlus className={cn("mr-1.5 flex-shrink-0", size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4")} />
        <span className="truncate">Recommend</span>
      </Button>
      <RecommendationModal
        open={open}
        onOpenChange={setOpen}
        jobId={jobId}
        jobTitle={jobTitle}
      />
    </>
  )
}

