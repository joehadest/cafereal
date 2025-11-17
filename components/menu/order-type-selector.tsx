"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bike, UtensilsCrossed } from "lucide-react"

type OrderTypeSelectorProps = {
  onSelectType: (type: "delivery" | "dinein") => void
}

export function OrderTypeSelector({ onSelectType }: OrderTypeSelectorProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Como você quer pedir?
        </h2>
        <p className="text-slate-700">Escolha entre delivery ou pedido na mesa</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card
          className="p-8 border-2 border-slate-200 hover:border-slate-400 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectType("delivery")}
        >
          <div className="text-center space-y-4">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <Bike className="h-10 w-10 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Delivery</h3>
            <p className="text-slate-700">Receba em casa com entrega rápida</p>
            <Button className="w-full bg-slate-600 hover:bg-slate-700">
              Pedir Delivery
            </Button>
          </div>
        </Card>

        <Card
          className="p-8 border-2 border-slate-200 hover:border-slate-400 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectType("dinein")}
        >
          <div className="text-center space-y-4">
            <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <UtensilsCrossed className="h-10 w-10 text-slate-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">Na Mesa</h3>
            <p className="text-slate-700">Peça direto da sua mesa no restaurante</p>
            <Button className="w-full bg-slate-600 hover:bg-slate-700">
              Pedir na Mesa
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
