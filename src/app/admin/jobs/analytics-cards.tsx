import { prisma } from "@/lib/prisma"

export default async function JobAnalyticsCards() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [active, drafts, expired, newToday, applicantsToday, total] = await Promise.all([
    prisma.job.count({ where: { status: "PUBLISHED", archived: false } }),
    prisma.job.count({ where: { status: "DRAFT", archived: false } }),
    prisma.job.count({ where: { status: "EXPIRED", archived: false } }),
    prisma.job.count({
      where: {
        createdAt: { gte: today },
        archived: false,
      },
    }),
    prisma.jobApplication.count({
      where: {
        createdAt: { gte: today },
      },
    }),
    prisma.job.count({ where: { archived: false } }),
  ])

  const cards = [
    { title: "Active", count: active, color: "from-emerald-500/80 to-green-600/80" },
    { title: "Drafts", count: drafts, color: "from-gray-500/80 to-slate-600/80" },
    { title: "Expired", count: expired, color: "from-red-500/80 to-rose-600/80" },
    { title: "New Today", count: newToday, color: "from-blue-500/80 to-indigo-600/80" },
    { title: "Applicants Today", count: applicantsToday, color: "from-violet-500/80 to-purple-600/80" },
    { title: "Total Jobs", count: total, color: "from-indigo-500/80 to-violet-600/80" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-2xl border border-white/15 dark:border-indigo-800/30 bg-white/10 dark:bg-indigo-950/30 backdrop-blur-xl p-4 shadow-sm hover:shadow-xl transition-shadow"
        >
          <div className="text-white/70 text-xs mb-1">{card.title}</div>
          <div className="text-3xl font-extrabold text-white">{card.count}</div>
          <div className={`mt-3 h-1 w-16 rounded-full bg-gradient-to-r ${card.color}`}></div>
        </div>
      ))}
    </div>
  )
}


