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
  product_class?: string | null
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
    <Card className="h-full flex flex-col overflow-hidden border-slate-200 hover:shadow-md hover:border-slate-400 transition-shadow">
      <div className="h-24 sm:h-28 md:h-32 bg-slate-50 relative overflow-hidden flex-shrink-0">
        {product.image_url ? (
          <Image
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xl sm:text-2xl">🍽️</span>
          </div>
        )}
      </div>
      <CardContent className="p-2 space-y-1 flex-1 flex flex-col">
        <h3 className="font-bold text-xs sm:text-sm text-slate-900 text-balance line-clamp-2 min-h-[2rem]">
          {product.name}
        </h3>
        <p className="text-xs text-slate-700 line-clamp-1 text-pretty hidden sm:block">
          {product.description}
        </p>
        <p className="text-sm sm:text-base font-bold text-slate-600 inline-block mt-auto">
          R$ {product.price.toFixed(2)}
        </p>
      </CardContent>
      <CardFooter className="p-2 pt-0 flex-shrink-0">
        <Button
          onClick={handleAddToCart}
          disabled={isAdding}
          size="sm"
          className={`w-full bg-slate-600 hover:bg-slate-700 text-[10px] sm:text-xs h-7 px-1 sm:px-2 justify-center ${
            isAdding ? "opacity-75" : ""
          }`}
        >
          <Plus className="h-3 w-3 sm:mr-1" />
          <span className="hidden sm:inline">
            {isAdding ? "Adicionado!" : "Adicionar"}
          </span>
        </Button>
      </CardFooter>
    </Card>
  )
}
