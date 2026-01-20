"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Bike, ArrowRight, Store } from "lucide-react"

type OrderTypeSelectorProps = {
  onSelectType: (type: "delivery" | "pickup") => void
}

export function OrderTypeSelector({ onSelectType }: OrderTypeSelectorProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <div className="text-center mb-12 sm:mb-16 animate-in fade-in slide-in-from-bottom duration-700">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
          Como você quer pedir?
        </h2>
        <p className="text-base sm:text-lg md:text-xl text-slate-600">Escolha a opção que melhor se adapta a você</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
        {/* Card Delivery */}
        <Card
          className="group relative p-8 sm:p-10 md:p-12 border-0 bg-gradient-to-br from-white via-slate-50/50 to-white shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 overflow-hidden"
          onClick={() => onSelectType("delivery")}
        >
          {/* Efeito de brilho animado */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/0 via-slate-100/0 to-slate-200/0 group-hover:from-slate-50/50 group-hover:via-slate-100/30 group-hover:to-slate-200/20 transition-all duration-500" />
          
          {/* Decoração de fundo */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-slate-100/30 to-transparent rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-slate-100/20 to-transparent rounded-full -ml-16 -mb-16 group-hover:scale-125 transition-transform duration-700" />
          
          <div className="relative text-center space-y-6">
            <div className="bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <Bike className="h-14 w-14 sm:h-16 sm:w-16 md:h-18 md:w-18 text-white" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors">Delivery</h3>
              <p className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed">Receba em casa com entrega rápida e segura</p>
            </div>
            <Button className="w-full h-12 sm:h-14 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 rounded-xl font-semibold text-base sm:text-lg">
              <span>Pedir Delivery</span>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
            </Button>
          </div>
        </Card>

        {/* Card Retirada no Local */}
        <Card
          className="group relative p-8 sm:p-10 md:p-12 border-0 bg-gradient-to-br from-white via-slate-50/50 to-white shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 overflow-hidden"
          onClick={() => onSelectType("pickup")}
        >
          {/* Efeito de brilho animado */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50/0 via-slate-100/0 to-slate-200/0 group-hover:from-slate-50/50 group-hover:via-slate-100/30 group-hover:to-slate-200/20 transition-all duration-500" />
          
          {/* Decoração de fundo */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-slate-100/30 to-transparent rounded-full -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-slate-100/20 to-transparent rounded-full -ml-16 -mb-16 group-hover:scale-125 transition-transform duration-700" />
          
          <div className="relative text-center space-y-6">
            <div className="bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-3xl flex items-center justify-center mx-auto shadow-xl group-hover:shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
              <Store className="h-14 w-14 sm:h-16 sm:w-16 md:h-18 md:w-18 text-white" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors">Retirada no Local</h3>
              <p className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed">Retire seu pedido no restaurante</p>
            </div>
            <Button className="w-full h-12 sm:h-14 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 rounded-xl font-semibold text-base sm:text-lg">
              <span>Retirar no Local</span>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform duration-300" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
