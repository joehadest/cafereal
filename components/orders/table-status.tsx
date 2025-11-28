"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

type Order = {
  id: string
  status: string
  total: number
}

type Table = {
  id: string
  table_number: number
  capacity: number
  status: string
}

export function TableStatus({
  table,
  orders,
}: {
  table: Table
  orders: Order[]
}) {
  const hasActiveOrders = orders.length > 0
  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0)

  return (
    <Card
      className={`border-2 transition-all ${
        hasActiveOrders ? "border-orange-500 bg-orange-50" : "border-orange-200 bg-white"
      }`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-orange-900">{table.table_number}</span>
          <Badge
            variant={hasActiveOrders ? "default" : "outline"}
            className={hasActiveOrders ? "bg-orange-600" : "border-orange-300 text-orange-700"}
          >
            {hasActiveOrders ? "Ocupada" : "Livre"}
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-sm text-orange-700">
          <Users className="h-4 w-4" />
          {table.capacity} pessoas
        </div>

        {hasActiveOrders && (
          <div className="pt-2 border-t border-orange-200 space-y-1">
            <p className="text-xs text-orange-700">{orders.length} pedido(s) ativo(s)</p>
            <p className="text-sm font-bold text-orange-900">R$ {totalAmount.toFixed(2)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
