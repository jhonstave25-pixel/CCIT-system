"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"]

export function EngagementCharts() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    setLoading(true)
    try {
      const res = await fetch("/api/faculty/analytics")
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to load analytics: ${res.status} ${res.statusText}`)
      }
      const result = await res.json()
      setData(result)
    } catch (error: any) {
      console.error("Error loading analytics:", error)
      // Set empty data on error
      setData({
        activeUsersByMonth: [],
        employmentSectors: [],
        batchDistribution: [],
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <Skeleton className="h-6 w-48 bg-white/10" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full bg-white/10" />
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
          <CardHeader>
            <Skeleton className="h-6 w-48 bg-white/10" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full bg-white/10" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Active Users by Month */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">New Alumni Registrations (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.activeUsersByMonth || data.activeUsersByMonth.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-white/60">
              <p>No registration data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.activeUsersByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="month" stroke="#ffffff80" />
                <YAxis stroke="#ffffff80" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke="#6366f1"
                  strokeWidth={2}
                  name="New Alumni"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Employment Sectors */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Employment Sectors</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.employmentSectors || data.employmentSectors.length === 0 || 
           (data.employmentSectors.length === 1 && data.employmentSectors[0].name === "No data available") ? (
            <div className="flex items-center justify-center h-[300px] text-white/60">
              <p>No employment sector data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.employmentSectors}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.employmentSectors.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Batch Distribution */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm md:col-span-2">
        <CardHeader>
          <CardTitle className="text-white">Batch Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.batchDistribution || data.batchDistribution.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-white/60">
              <p>No batch data available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.batchDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="batch" stroke="#ffffff80" />
                <YAxis stroke="#ffffff80" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#6366f1" name="Alumni Count" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

