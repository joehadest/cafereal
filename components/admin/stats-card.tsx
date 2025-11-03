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
    <Card className="border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-purple-900">{title}</CardTitle>
        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
          {value}
        </div>
        {trend && <p className="text-xs text-purple-700 mt-1 sm:mt-2 flex items-center gap-1">{trend}</p>}
      </CardContent>
    </Card>
  )
}
