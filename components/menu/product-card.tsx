"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Check } from "lucide-react"
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
    setTimeout(() => setIsAdding(false), 800)
  }

  return (
    <Card className="group h-full flex flex-col overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-white rounded-2xl transform hover:-translate-y-1">
      {/* Imagem do produto com overlay sutil */}
      <div className="relative h-32 sm:h-36 md:h-40 bg-gradient-to-br from-slate-100 to-slate-50 overflow-hidden flex-shrink-0">
        {product.image_url ? (
          <>
            <Image
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <span className="text-3xl sm:text-4xl opacity-60">🍽️</span>
          </div>
        )}
        {/* Badge de preço flutuante */}
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-lg">
          <span className="text-xs font-bold text-slate-900">
            R$ {product.price.toFixed(2)}
          </span>
        </div>
      </div>
      
      <CardContent className="p-3 sm:p-4 space-y-2 flex-1 flex flex-col">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 text-balance line-clamp-2 leading-tight group-hover:text-slate-700 transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-slate-600 line-clamp-2 text-pretty leading-relaxed hidden sm:block">
            {product.description}
          </p>
        )}
      </CardContent>
      
      <CardFooter className="p-3 sm:p-4 pt-0 flex-shrink-0">
        <Button
          onClick={handleAddToCart}
          disabled={isAdding}
          size="sm"
          className={`w-full h-9 sm:h-10 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 ${
            isAdding
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-md hover:shadow-lg hover:scale-105"
          }`}
        >
          {isAdding ? (
            <>
              <Check className="h-4 w-4 mr-1.5" />
              <span>Adicionado!</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Adicionar</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
