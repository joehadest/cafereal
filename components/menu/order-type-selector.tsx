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
      <div className="text-center mb-8 animate-in fade-in slide-in-from-top duration-700">
        <h2 className="text-3xl font-bold text-purple-900 mb-2 bg-gradient-to-r from-purple-900 via-purple-700 to-purple-900 bg-clip-text text-transparent">
          Como você quer pedir?
        </h2>
        <p className="text-purple-700">Escolha entre delivery ou pedido na mesa</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card
          className="p-8 border-2 border-purple-200 hover:border-purple-500 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-left duration-700 bg-gradient-to-br from-white to-purple-50/30"
          onClick={() => onSelectType("delivery")}
        >
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl group-hover:scale-110">
              <Bike className="h-10 w-10 text-purple-600 group-hover:animate-bounce" />
            </div>
            <h3 className="text-2xl font-bold text-purple-900 group-hover:text-purple-600 transition-colors">
              Delivery
            </h3>
            <p className="text-purple-700">Receba em casa com entrega rápida</p>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              Pedir Delivery
            </Button>
          </div>
        </Card>

        <Card
          className="p-8 border-2 border-purple-200 hover:border-purple-500 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group animate-in fade-in slide-in-from-right duration-700 bg-gradient-to-br from-white to-purple-50/30"
          onClick={() => onSelectType("dinein")}
        >
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl group-hover:scale-110">
              <UtensilsCrossed className="h-10 w-10 text-purple-600 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <h3 className="text-2xl font-bold text-purple-900 group-hover:text-purple-600 transition-colors">
              Na Mesa
            </h3>
            <p className="text-purple-700">Peça direto da sua mesa no restaurante</p>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
              Pedir na Mesa
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
