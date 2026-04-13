import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function UserStats({
  stats,
}: {
  stats: {
    total: number
    alumni: number
    faculty: number
    admin: number
  }
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Users</CardDescription>
          <CardTitle className="text-3xl">{stats.total}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Alumni</CardDescription>
          <CardTitle className="text-3xl text-green-600">{stats.alumni}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Faculty</CardDescription>
          <CardTitle className="text-3xl text-blue-600">{stats.faculty}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Admins</CardDescription>
          <CardTitle className="text-3xl text-violet-600 dark:text-violet-400">{stats.admin}</CardTitle>
        </CardHeader>
      </Card>
    </div>
  )
}


