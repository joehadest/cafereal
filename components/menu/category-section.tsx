"use client"

import { ProductCard } from "./product-card"

type Product = {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  active: boolean
}

type Category = {
  id: string
  name: string
  description: string
  products: Product[]
}

export function CategorySection({
  category,
  onAddToCart,
}: {
  category: Category
  onAddToCart: (product: Product) => void
}) {
  const activeProducts = category.products.filter((p) => p.active)

  if (activeProducts.length === 0) return null

  return (
    <section className="space-y-6">
      <div className="space-y-2 animate-in fade-in slide-in-from-left duration-500">
        <h2 className="text-3xl font-bold text-orange-900 hover:text-orange-600 transition-colors duration-300 inline-block">
          {category.name}
        </h2>
        {category.description && (
          <p className="text-orange-700 text-pretty animate-in fade-in duration-700">{category.description}</p>
        )}
        <div className="h-1 w-20 bg-gradient-to-r from-orange-600 to-transparent rounded-full animate-in slide-in-from-left duration-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeProducts.map((product, index) => (
          <div
            key={product.id}
            className="animate-in fade-in zoom-in duration-500"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <ProductCard product={product} onAddToCart={onAddToCart} />
          </div>
        ))}
      </div>
    </section>
  )
}
