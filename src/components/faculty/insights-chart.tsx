"use client"

import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface InsightsChartProps {
  data: Array<{
    week: string
    connections: number
    events: number
  }>
}

export function InsightsChart({ data }: InsightsChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
            color: "#fff"
          }} 
        />
        <Legend 
          wrapperStyle={{ color: "rgba(255, 255, 255, 0.8)" }}
        />
        <Line 
          type="monotone" 
          dataKey="connections" 
          stroke="#818cf8" 
          strokeWidth={2} 
          dot={{ r: 4, fill: "#818cf8" }}
          name="Connections"
        />
        <Line 
          type="monotone" 
          dataKey="events" 
          stroke="#f472b6" 
          strokeWidth={2} 
          dot={{ r: 4, fill: "#f472b6" }}
          name="Events"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}


