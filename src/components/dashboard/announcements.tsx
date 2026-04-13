import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function Announcements({
  items,
}: {
  items: { id: string; title: string; by: string; time: string }[]
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-white">Announcements</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 pt-0">
        {items.length === 0 ? (
          <p className="text-sm text-white/60">No announcements yet.</p>
        ) : (
          items.map((a) => (
            <div key={a.id} className="rounded-lg border border-white/10 p-2 text-sm bg-white/5">
              <p className="font-medium text-white">{a.title}</p>
              <p className="text-xs text-white/50">
                {a.by} • {a.time}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}


