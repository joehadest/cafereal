import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string
  value: string
  icon: LucideIcon
  trend?: string
}) {
  return (
    <Card className="border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-orange-900">{title}</CardTitle>
        <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg">
          <Icon className="h-5 w-5 text-orange-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-800 bg-clip-text text-transparent">
          {value}
        </div>
        {trend && <p className="text-xs text-orange-700 mt-2 flex items-center gap-1">{trend}</p>}
      </CardContent>
    </Card>
  )
}
