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
    <Card className="border-slate-200/80 shadow-md hover:shadow-xl hover:scale-[1.02] hover:border-slate-300 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom duration-500 bg-gradient-to-br from-white to-slate-50/50 rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-xs sm:text-sm font-semibold text-slate-800">{title}</CardTitle>
        <div className="p-2 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl group-hover:from-slate-200 group-hover:to-slate-300 transition-all duration-300 shadow-sm">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700 group-hover:scale-110 transition-transform duration-300" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-clip-text text-transparent">
          {value}
        </div>
        {trend && <p className="text-xs text-slate-600 mt-2 flex items-center gap-1 font-medium">{trend}</p>}
      </CardContent>
    </Card>
  )
}
