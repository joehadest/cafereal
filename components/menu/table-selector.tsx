"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ArrowLeft } from "lucide-react"

type Table = {
  id: string
  table_number: number
  capacity: number
  status: string
}

export function TableSelector({
  tables,
  onSelectTable,
  onBack,
}: {
  tables: Table[]
  onSelectTable: (tableNumber: number) => void
  onBack?: () => void
}) {
  const availableTables = tables.filter((t) => t.status === "available")

  return (
    <Card className="border-orange-200 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-bold text-orange-900">Bem-vindo!</CardTitle>
        <CardDescription className="text-lg text-orange-700">Selecione sua mesa para começar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {availableTables.map((table) => (
            <Button
              key={table.id}
              onClick={() => onSelectTable(table.table_number)}
              className="h-24 flex flex-col items-center justify-center gap-2 bg-white hover:bg-orange-50 text-orange-900 border-2 border-orange-300 hover:border-orange-500 transition-all"
              variant="outline"
            >
              <span className="text-2xl font-bold">{table.table_number}</span>
              <span className="text-xs flex items-center gap-1 text-orange-700">
                <Users className="h-3 w-3" />
                {table.capacity} pessoas
              </span>
            </Button>
          ))}
        </div>
        {onBack && (
          <Button onClick={onBack} variant="outline" className="w-full border-orange-300 bg-transparent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
