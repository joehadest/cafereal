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
    <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-in fade-in slide-in-from-bottom">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium text-slate-900">{title}</CardTitle>
        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
          {value}
        </div>
        {trend && <p className="text-xs text-slate-700 mt-1 sm:mt-2 flex items-center gap-1">{trend}</p>}
      </CardContent>
    </Card>
  )
}
