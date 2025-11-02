"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"

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
    <Card className="group overflow-hidden border-orange-200 hover:shadow-2xl hover:scale-[1.02] hover:border-orange-400 transition-all duration-300 ease-out">
      <div className="aspect-video bg-gradient-to-br from-orange-100 via-amber-100 to-orange-50 relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <span className="text-4xl animate-bounce">🍽️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <CardContent className="p-4 space-y-2">
        <h3 className="font-bold text-lg text-orange-900 text-balance group-hover:text-orange-600 transition-colors duration-300">
          {product.name}
        </h3>
        <p className="text-sm text-orange-700 line-clamp-2 text-pretty">{product.description}</p>
        <p className="text-2xl font-bold text-orange-600 group-hover:scale-105 transition-transform duration-300 inline-block">
          R$ {product.price.toFixed(2)}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={isAdding}
          className={`w-full bg-orange-600 hover:bg-orange-700 hover:shadow-lg transition-all duration-300 ${
            isAdding ? "animate-pulse scale-95" : "hover:scale-105"
          }`}
        >
          <Plus className={`h-4 w-4 mr-2 ${isAdding ? "animate-spin" : ""}`} />
          {isAdding ? "Adicionado!" : "Adicionar"}
        </Button>
      </CardFooter>
    </Card>
  )
}
