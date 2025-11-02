"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Upload, ImageIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"

type Product = {
  id: string
  name: string
  description: string | null
  price: number
  category_id: string | null
  display_order: number
  active: boolean
  categories?: { name: string }
  image_url?: string
}

type Category = {
  id: string
  name: string
}

export function ProductsClient({
  products,
  categories,
}: {
  products: Product[]
  categories: Category[]
}) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    category_id: "",
    display_order: 0,
    image_url: "",
  })

  const uploadImage = async (file: File): Promise<string | null> => {
    const supabase = createClient()
    const fileExt = file.name.split(".").pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    try {
      const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from("product-images").getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error("Error uploading image:", error)
      return null
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsUploading(true)

    try {
      let imageUrl = formData.image_url
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      const productData = {
        ...formData,
        image_url: imageUrl,
      }

      if (editingProduct) {
        const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("products").insert(productData)
        if (error) throw error
      }

      setIsDialogOpen(false)
      setEditingProduct(null)
      setImageFile(null)
      setImagePreview(null)
      setFormData({
        name: "",
        description: "",
        price: 0,
        category_id: "",
        display_order: 0,
        image_url: "",
      })
      router.refresh()
    } catch (error) {
      console.error("Error saving product:", error)
      alert("Erro ao salvar produto")
    } finally {
      setIsUploading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price,
      category_id: product.category_id || "",
      display_order: product.display_order,
      image_url: product.image_url || "",
    })
    setImagePreview(product.image_url || null)
    setIsDialogOpen(true)
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

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-purple-900">Produtos</h1>
          <p className="text-purple-700">Gerencie os produtos do cardápio</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingProduct(null)
                setImageFile(null)
                setImagePreview(null)
                setFormData({
                  name: "",
                  description: "",
                  price: 0,
                  category_id: "",
                  display_order: 0,
                  image_url: "",
                })
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-purple-200 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-purple-900">
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image" className="text-purple-900">
                  Imagem do Produto
                </Label>
                <div className="flex flex-col gap-4">
                  {imagePreview && (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-purple-200">
                      <Image src={imagePreview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                      id="image"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleImageChange}
                      className="border-purple-200"
                    />
                    <Upload className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-xs text-purple-600">Formatos aceitos: PNG, JPEG, JPG</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-purple-900">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="border-purple-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-purple-900">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="border-purple-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-purple-900">
                  Preço
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: Number.parseFloat(e.target.value),
                    })
                  }
                  required
                  className="border-purple-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-purple-900">
                  Categoria
                </Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger className="border-purple-200">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order" className="text-purple-900">
                  Ordem de Exibição
                </Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      display_order: Number.parseInt(e.target.value),
                    })
                  }
                  className="border-purple-200"
                />
              </div>
              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isUploading}>
                {isUploading ? "Salvando..." : editingProduct ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="border-purple-200 overflow-hidden">
            {product.image_url && (
              <div className="relative w-full h-48">
                <Image src={product.image_url || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
              </div>
            )}
            {!product.image_url && (
              <div className="relative w-full h-48 bg-purple-50 flex items-center justify-center">
                <ImageIcon className="h-16 w-16 text-purple-300" />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-purple-900 flex items-center justify-between">
                <span className="text-balance">{product.name}</span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(product)}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-purple-600 hover:bg-purple-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(product.id)}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-purple-700 text-pretty">{product.description || "Sem descrição"}</p>
              <p className="text-2xl font-bold text-purple-600">R$ {product.price.toFixed(2)}</p>
              <p className="text-xs text-purple-600">Categoria: {product.categories?.name || "Sem categoria"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
