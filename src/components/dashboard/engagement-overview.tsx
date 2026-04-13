"use client"

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts"
import type { EngagementSeries } from "@/lib/types/dashboard"

export function EngagementOverview({
  eventsSeries,
}: {
  eventsSeries: EngagementSeries[]
}) {
  return (
    <div className="h-56 rounded-xl border border-white/10 p-3 bg-white/5">
      <p className="mb-2 text-sm font-medium text-white">Events Joined / Month</p>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={eventsSeries} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
          <XAxis dataKey="month" stroke="#9ca3af" />
          <YAxis allowDecimals={false} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(17, 24, 39, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <Line
            type="monotone"
            dataKey="eventsJoined"
            stroke="#818cf8"
            strokeWidth={2}
            dot={{ fill: "#818cf8", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}


