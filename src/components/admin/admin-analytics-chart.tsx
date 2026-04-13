"use client"

import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface AdminAnalyticsChartProps {
  data: Array<{
    week: string
    users: number
    events: number
  }>
}

export function AdminAnalyticsChart({ data }: AdminAnalyticsChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
        <XAxis
          dataKey="week"
          stroke="rgba(255, 255, 255, 0.6)"
          fontSize={12}
          tick={{ fill: "rgba(255, 255, 255, 0.6)" }}
        />
        <YAxis
          stroke="rgba(255, 255, 255, 0.6)"
          fontSize={12}
          tick={{ fill: "rgba(255, 255, 255, 0.6)" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(30, 27, 75, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "8px",
            color: "#fff",
          }}
        />
        <Legend wrapperStyle={{ color: "rgba(255, 255, 255, 0.8)" }} />
        <Bar dataKey="users" fill="#818cf8" radius={[6, 6, 0, 0]} name="Users" />
        <Bar dataKey="events" fill="#f472b6" radius={[6, 6, 0, 0]} name="Events" />
      </BarChart>
    </ResponsiveContainer>
  )
}


