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
    // Buscar variedades e extras do produto
    const supabase = createClient()
    const { data: varieties } = await supabase
      .from("product_varieties")
      .select("*")
      .eq("product_id", product.id)
      .order("display_order")

    const { data: extras } = await supabase
      .from("product_extras")
      .select("*")
      .eq("product_id", product.id)
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-4 text-center animate-in slide-in-from-top duration-700">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 animate-in fade-in slide-in-from-bottom duration-500">Produtos</h1>
          <p className="text-sm sm:text-base text-slate-700 animate-in fade-in slide-in-from-bottom duration-700 delay-100">Gerencie os produtos do cardápio com variedades e extras</p>
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
            className="bg-slate-600 hover:bg-slate-700 hover:scale-105 hover:shadow-lg transition-all duration-300 w-full sm:w-auto animate-in fade-in slide-in-from-right duration-500 delay-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredProducts.map((product, index) => (
          <Card 
            key={product.id} 
            className="border-slate-200 overflow-hidden hover:shadow-xl hover:scale-[1.02] hover:border-slate-400 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom duration-500 cursor-pointer"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {product.image_url && (
              <div className="relative w-full h-48 overflow-hidden group">
                <Image 
                  src={product.image_url || "/placeholder.svg"} 
                  alt={product.name} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out" 
                />
              </div>
            )}
            {!product.image_url && (
              <div className="relative w-full h-48 bg-slate-50 flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-slate-300" />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-slate-900 flex items-center justify-between">
                <span className="text-balance">{product.name}</span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(product)}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(product.id)}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-slate-700 text-pretty line-clamp-2">
                {product.description || "Sem descrição"}
              </p>
              <p className="text-2xl font-bold text-slate-600">R$ {product.price.toFixed(2)}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {product.varieties && product.varieties.length > 0 && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    <ListPlus className="h-3 w-3 mr-1" />
                    {product.varieties.length} variedades
                  </Badge>
                )}
                {product.extras && product.extras.length > 0 && (
                  <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                    <Star className="h-3 w-3 mr-1" />
                    {product.extras.length} extras
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-600">Categoria: {product.categories?.name || "Sem categoria"}</p>
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
