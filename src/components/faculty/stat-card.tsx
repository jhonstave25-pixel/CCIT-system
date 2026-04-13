import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: number
  icon: LucideIcon
  description?: string
  badge?: number
}

export function StatCard({ title, value, icon: Icon, description, badge }: StatCardProps) {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-white/70">{title}</p>
            <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
            {description && (
              <p className="text-xs text-white/50">{description}</p>
            )}
          </div>
          <div className="relative">
            <div className="rounded-lg bg-primary/20 p-3">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            {badge !== undefined && badge > 0 && (
              <span className={cn(
                "absolute -top-2 -right-2 h-5 w-5 rounded-full bg-indigo-500 text-xs flex items-center justify-center text-white font-semibold",
                badge > 99 && "text-[10px] px-1"
              )}>
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



