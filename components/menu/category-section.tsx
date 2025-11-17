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
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {category.name}
        </h2>
        {category.description && (
          <p className="text-sm sm:text-base text-slate-700 text-pretty">
            {category.description}
          </p>
        )}
        <div className="h-1 w-20 bg-slate-600 rounded-full" />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-3">
        {activeProducts.map((product) => (
          <div key={product.id} className="h-full">
            <ProductCard product={product} onAddToCart={onAddToCart} />
          </div>
        ))}
      </div>
    </section>
  )
}
