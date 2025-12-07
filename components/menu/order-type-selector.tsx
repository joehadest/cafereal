"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bike, ArrowRight, Store } from "lucide-react"

type OrderTypeSelectorProps = {
  onSelectType: (type: "delivery" | "pickup") => void
}

export function OrderTypeSelector({ onSelectType }: OrderTypeSelectorProps) {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="text-center mb-10 sm:mb-12 animate-in fade-in slide-in-from-bottom duration-700">
        <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          Como você quer pedir?
        </h2>
        <p className="text-lg sm:text-xl text-slate-600">Escolha entre delivery ou retirada no local</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
        {/* Card Delivery */}
        <Card
          className="group relative p-6 sm:p-8 border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50/30 hover:border-slate-400 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden"
          onClick={() => onSelectType("delivery")}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative text-center space-y-5">
            <div className="bg-gradient-to-br from-slate-600 to-slate-700 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
              <Bike className="h-12 w-12 sm:h-14 sm:w-14 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">Delivery</h3>
              <p className="text-slate-600 text-sm sm:text-base">Receba em casa com entrega rápida</p>
            </div>
            <Button className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105">
              <span>Pedir Delivery</span>
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </Card>

        {/* Card Retirada no Local */}
        <Card
          className="group relative p-6 sm:p-8 border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50/30 hover:border-slate-400 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden"
          onClick={() => onSelectType("pickup")}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100/20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" />
          <div className="relative text-center space-y-5">
            <div className="bg-gradient-to-br from-slate-600 to-slate-700 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
              <Store className="h-12 w-12 sm:h-14 sm:w-14 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">Retirada no Local</h3>
              <p className="text-slate-600 text-sm sm:text-base">Retire seu pedido no restaurante</p>
            </div>
            <Button className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105">
              <span>Retirar no Local</span>
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
