import { ReactNode } from "react"

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white transition-colors">
      {/* Offset for fixed header (h-14 sm:h-16 = 56px mobile, 64px desktop) */}
      <div className="pt-14 sm:pt-16 px-4 md:px-6 pb-6">
        <div className="mx-auto w-full max-w-7xl h-full">
          {children}
        </div>
      </div>
    </div>
  )
}

