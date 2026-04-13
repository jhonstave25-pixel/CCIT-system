import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminSettingsPage() {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const sections = [
    {
      title: "General Settings",
      hint: "Manage general system settings",
      body: "General settings coming soon…",
    },
    {
      title: "Email Settings",
      hint: "Configure email notifications and templates",
      body: "Email settings coming soon…",
    },
    {
      title: "Security Settings",
      hint: "Manage security and authentication settings",
      body: "Security settings coming soon…",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 text-white transition-colors">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-white/80 text-sm mt-1">Configure system settings and preferences</p>
        <div className="mt-6 space-y-5">
          {sections.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-white/15 dark:border-indigo-800/30 bg-white/10 dark:bg-indigo-950/30 backdrop-blur-xl p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white/95">{s.title}</h2>
                  <p className="text-xs text-white/70">{s.hint}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-white/80">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


