"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

type Product = {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
}

export function ProductCard({
  product,
  onAddToCart,
}: {
  product: Product
  onAddToCart: (product: Product) => void
}) {
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = () => {
    setIsAdding(true)
    onAddToCart(product)
    setTimeout(() => setIsAdding(false), 600)
  }

  return (
    <Card className="group h-full flex flex-col overflow-hidden border-slate-200 hover:shadow-2xl hover:scale-[1.02] hover:border-slate-400 transition-all duration-300 ease-out">
      <div className="h-32 sm:h-40 md:h-48 bg-gradient-to-br from-stone-100 via-stone-50 to-slate-50 relative overflow-hidden flex-shrink-0">
        {product.image_url ? (
          <Image
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <span className="text-2xl sm:text-4xl animate-bounce">🍽️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <CardContent className="p-2 sm:p-4 space-y-1 sm:space-y-2 flex-1 flex flex-col">
        <h3 className="font-bold text-sm sm:text-lg text-slate-900 text-balance group-hover:text-slate-600 transition-colors duration-300 line-clamp-2 min-h-[2.5rem] sm:min-h-[3.5rem]">
          {product.name}
        </h3>
        <p className="text-xs sm:text-sm text-slate-700 line-clamp-2 text-pretty hidden sm:block min-h-[2.5rem]">
          {product.description}
        </p>
        <p className="text-lg sm:text-2xl font-bold text-slate-600 group-hover:scale-105 transition-transform duration-300 inline-block mt-auto">
          R$ {product.price.toFixed(2)}
        </p>
      </CardContent>
      <CardFooter className="p-2 sm:p-4 sm:pt-0 flex-shrink-0">
        <Button
          onClick={handleAddToCart}
          disabled={isAdding}
          size="sm"
          className={`w-full bg-slate-600 hover:bg-slate-700 hover:shadow-lg transition-all duration-300 text-xs sm:text-sm ${
            isAdding ? "animate-pulse scale-95" : "hover:scale-105"
          }`}
        >
          <Plus className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isAdding ? "animate-spin" : ""}`} />
          {isAdding ? "Adicionado!" : "Adicionar"}
        </Button>
      </CardFooter>
    </Card>
  )
}
