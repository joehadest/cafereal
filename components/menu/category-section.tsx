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
    <section className="space-y-6" id={`category-${category.id}`}>
      <div className="space-y-2 animate-in fade-in slide-in-from-left duration-500">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 hover:text-slate-600 transition-colors duration-300 inline-block">
          {category.name}
        </h2>
        {category.description && (
          <p className="text-sm sm:text-base text-slate-700 text-pretty animate-in fade-in duration-700">
            {category.description}
          </p>
        )}
        <div className="h-1 w-20 bg-gradient-to-r from-slate-600 to-transparent rounded-full animate-in slide-in-from-left duration-500" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {activeProducts.map((product, index) => (
          <div
            key={product.id}
            className="animate-in fade-in zoom-in duration-500 h-full"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <ProductCard product={product} onAddToCart={onAddToCart} />
          </div>
        ))}
      </div>
    </section>
  )
}
