"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Trash2, ImageIcon, ListPlus, Star } from 'lucide-react'
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'
import Image from "next/image"
import { ProductFormModal } from "./product-form-modal"
import type { Product } from "@/types/product"
import { Badge } from "@/components/ui/badge"

type Category = {
  id: string
  name: string
}

export function ProductsClient({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const handleEdit = async (product: Product) => {
    // Buscar variedades e extras do produto (apenas os ativos)
    const supabase = createClient()
    const { data: varieties } = await supabase
      .from("product_varieties")
      .select("*")
      .eq("product_id", product.id)
      .eq("active", true)
      .order("display_order")

    const { data: extras } = await supabase
      .from("product_extras")
      .select("*")
      .eq("product_id", product.id)
      .eq("active", true)
      .order("display_order")

    setEditingProduct({
      ...product,
      varieties: varieties || [],
      extras: extras || [],
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este produto?")) return

    const supabase = createClient()
    try {
      const { error } = await supabase.from("products").delete().eq("id", id)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("Erro ao deletar produto")
    }
  }

  const filteredProducts = products.filter((p) => {
    if (categoryFilter === "all") return true
    if (categoryFilter === "_none") return !p.category_id
    return p.category_id === categoryFilter
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Produtos</h1>
          <p className="text-sm sm:text-base text-slate-700">Gerencie os produtos do cardápio com variedades e extras</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto items-center">
          <div className="w-full sm:w-64">
            <Label className="text-slate-900 text-xs sm:text-sm mb-1 block">Filtrar por categoria</Label>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
              <SelectTrigger className="border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="_none">Sem categoria</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => {
              setEditingProduct(null)
              setIsModalOpen(true)
            }}
            className="bg-slate-600 hover:bg-slate-700 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
        {filteredProducts.map((product) => (
          <Card 
            key={product.id} 
            className="border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-400 transition-shadow cursor-pointer"
          >
            {product.image_url && (
              <div className="relative w-full h-24 sm:h-32 overflow-hidden group">
                <Image 
                  src={product.image_url || "/placeholder.svg"} 
                  alt={product.name} 
                  fill 
                  className="object-cover" 
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                />
              </div>
            )}
            {!product.image_url && (
              <div className="relative w-full h-24 sm:h-32 bg-slate-50 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300" />
              </div>
            )}
            <CardHeader className="p-2 sm:p-3">
              <CardTitle className="text-slate-900 flex items-center justify-between text-xs sm:text-sm gap-2">
                <span className="text-balance line-clamp-2 flex-1 min-w-0">{product.name}</span>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    onClick={() => handleEdit(product)}
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 sm:h-7 sm:w-7 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(product.id)}
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 sm:h-7 sm:w-7 text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 pt-0 space-y-1">
              <p className="text-[10px] sm:text-xs text-slate-700 text-pretty line-clamp-2">
                {product.description || "Sem descrição"}
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-600">R$ {product.price.toFixed(2)}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {product.varieties && product.varieties.length > 0 && (
                  <Badge variant="secondary" className="text-[9px] sm:text-[10px] bg-blue-100 text-blue-700 px-1 py-0">
                    <ListPlus className="h-2 w-2 mr-0.5" />
                    {product.varieties.length}
                  </Badge>
                )}
                {product.extras && product.extras.length > 0 && (
                  <Badge variant="secondary" className="text-[9px] sm:text-[10px] bg-amber-100 text-amber-700 px-1 py-0">
                    <Star className="h-2 w-2 mr-0.5" />
                    {product.extras.length}
                  </Badge>
                )}
              </div>
              <p className="text-[9px] sm:text-[10px] text-slate-600 line-clamp-1">Cat: {product.categories?.name || "N/A"}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingProduct(null)
        }}
        product={editingProduct}
        categories={categories}
      />
    </div>
  )
}
