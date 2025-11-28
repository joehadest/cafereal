"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ArrowLeft, UtensilsCrossed } from "lucide-react"

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

  if (availableTables.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="border-slate-200 shadow-xl max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <UtensilsCrossed className="h-8 w-8 text-slate-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900">Nenhuma Mesa Disponível</CardTitle>
            <CardDescription className="text-lg text-slate-700 mt-2">
              Todas as mesas estão ocupadas no momento. Por favor, tente novamente mais tarde.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {onBack && (
              <Button onClick={onBack} variant="outline" className="w-full border-slate-300 bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <Card className="border-slate-200 shadow-2xl max-w-4xl mx-auto bg-gradient-to-br from-white to-slate-50/30">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center shadow-lg">
            <UtensilsCrossed className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-4xl sm:text-5xl font-bold text-slate-900 mb-2">
            Selecione sua Mesa
          </CardTitle>
          <CardDescription className="text-xl sm:text-2xl text-slate-700 font-medium">
            Escolha a mesa onde você está sentado para acessar o cardápio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {availableTables.map((table) => (
              <Button
                key={table.id}
                onClick={() => onSelectTable(table.table_number)}
                className="h-28 sm:h-32 flex flex-col items-center justify-center gap-2 bg-white hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100 text-slate-900 border-2 border-slate-300 hover:border-slate-500 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                variant="outline"
              >
                <span className="text-3xl sm:text-4xl font-bold">{table.table_number}</span>
                <span className="text-xs sm:text-sm flex items-center gap-1 text-slate-700 font-medium">
                  <Users className="h-4 w-4" />
                  {table.capacity} {table.capacity === 1 ? 'pessoa' : 'pessoas'}
                </span>
              </Button>
            ))}
          </div>
          {onBack && (
            <div className="pt-4 border-t border-slate-200">
              <Button 
                onClick={onBack} 
                variant="outline" 
                className="w-full border-slate-300 bg-transparent hover:bg-slate-50 text-slate-700 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para escolher tipo de pedido
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
