"use client"

import { ProductCard } from "./product-card"

type Product = {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  active: boolean
  product_class?: string | null
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
  onAddToCart: (product: Product, categoryName: string) => void
}) {
  // Filtrar produtos ativos e ordenar por display_order
  const activeProducts = category.products
    .filter((p) => p.active)
    .sort((a: any, b: any) => {
      // Ordenar por display_order, e se for igual, por ID para garantir ordem consistente
      if (a.display_order !== b.display_order) {
        return (a.display_order || 0) - (b.display_order || 0)
      }
      return a.id.localeCompare(b.id)
    })

  if (activeProducts.length === 0) return null

  return (
    <section className="space-y-6 sm:space-y-8" id={`category-${category.id}`}>
      <div className="space-y-3 animate-in fade-in slide-in-from-bottom duration-500">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900">
            {category.name}
          </h2>
          <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent" />
        </div>
        {category.description && (
          <p className="text-sm sm:text-base text-slate-600 text-pretty max-w-3xl">
            {category.description}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {activeProducts.map((product, index) => (
          <div 
            key={product.id} 
            className="h-full animate-in fade-in slide-in-from-bottom duration-500"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ProductCard product={product} onAddToCart={(p) => onAddToCart(p, category.name)} />
          </div>
        ))}
      </div>
    </section>
  )
}
