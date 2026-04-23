import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-white dark:bg-gray-900 px-3 py-2 text-base text-slate-900 dark:text-white ring-offset-background placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:border-indigo-300 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
