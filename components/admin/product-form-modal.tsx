"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Upload, GripVertical, Package, Star, ListPlus } from 'lucide-react'
import { createClient } from "@/lib/supabase/client"
import { useRouter } from 'next/navigation'
import Image from "next/image"
import type { Product, ProductVariety, ProductExtra } from "@/types/product"

type Category = {
  id: string
  name: string
}

type ProductFormModalProps = {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  categories: Category[]
}

export function ProductFormModal({ isOpen, onClose, product, categories }: ProductFormModalProps) {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("details")

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    category_id: "",
    display_order: 0,
    image_url: "",
    active: true,
  })

  const [varieties, setVarieties] = useState<ProductVariety[]>([])
  const [extras, setExtras] = useState<ProductExtra[]>([])

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price,
        category_id: product.category_id || "",
        display_order: product.display_order,
        image_url: product.image_url || "",
        active: product.active,
      })
      setImagePreview(product.image_url || null)
      setVarieties(product.varieties || [])
      setExtras(product.extras || [])
    } else {
      resetForm()
    }
  }, [product])

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      category_id: "",
      display_order: 0,
      image_url: "",
      active: true,
    })
    setImageFile(null)
    setImagePreview(null)
    setVarieties([])
    setExtras([])
    setActiveTab("details")
  }

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
      // Validação básica
      if (!formData.name || formData.name.trim() === "") {
        alert("Por favor, preencha o nome do produto")
        setIsUploading(false)
        return
      }

      if (formData.price < 0 || isNaN(formData.price)) {
        alert("Por favor, insira um preço válido")
        setIsUploading(false)
        return
      }

      let imageUrl = formData.image_url
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile)
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      const productData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        price: Number(formData.price) || 0,
        category_id: formData.category_id || null,
        display_order: Number(formData.display_order) || 0,
        image_url: imageUrl || null,
        active: formData.active ?? true,
      }

      let productId = product?.id

      if (product) {
        const { error, data } = await supabase.from("products").update(productData).eq("id", product.id).select().single()
        if (error) {
          console.error("Error updating product:", error)
          throw new Error(error.message || "Erro ao atualizar produto")
        }
      } else {
        const { data, error } = await supabase.from("products").insert(productData).select().single()
        if (error) {
          console.error("Error creating product:", error)
          throw new Error(error.message || "Erro ao criar produto")
        }
        if (!data) {
          throw new Error("Produto criado mas nenhum dado retornado")
        }
        productId = data.id
      }

      // Salvar variedades usando upsert (update ou insert)
      if (productId) {
        // Verificar se a tabela de variedades existe antes de tentar usar
        try {
          // Buscar variedades existentes
          const { data: existingVarieties } = await supabase
            .from("product_varieties")
            .select("id")
            .eq("product_id", productId)

          // Preparar dados para upsert (se houver variedades na lista)
          if (varieties.length > 0) {
            const varietiesData = varieties
              .filter((v) => v.name && v.name.trim() !== "")
              .map((v, index) => ({
                ...(v.id && existingVarieties?.some(ev => ev.id === v.id) ? { id: v.id } : {}),
                product_id: productId,
                name: v.name.trim(),
                price: Number(v.price) || 0,
                display_order: index,
                active: v.active ?? true,
              }))
            
            if (varietiesData.length > 0) {
              // Usar upsert para atualizar existentes e inserir novas
              const { error: varietiesError } = await supabase
                .from("product_varieties")
                .upsert(varietiesData, { onConflict: "id" })

              if (varietiesError) {
                // Verificar se há uma mensagem de erro real
                const hasErrorMessage = varietiesError.message && varietiesError.message.trim() !== ""
                const hasErrorCode = varietiesError.code && varietiesError.code.trim() !== ""

                // Se o erro for porque a tabela não existe, apenas logar e continuar
                if (hasErrorMessage && (varietiesError.message.includes("schema cache") || varietiesError.message.includes("does not exist"))) {
                  console.warn("Tabela product_varieties não encontrada. Variedades não foram salvas.")
                } else if (hasErrorMessage || hasErrorCode) {
                  // Só lançar erro se houver uma mensagem ou código de erro real
                  console.error("Error upserting varieties:", varietiesError.message || varietiesError.code || varietiesError)
                  throw new Error(varietiesError.message || varietiesError.code || "Erro ao salvar variedades")
                }
              }
            }
          }

          // Deletar variedades que não estão mais na lista (sempre verificar, mesmo se a lista estiver vazia)
          if (existingVarieties && existingVarieties.length > 0) {
            // Filtrar apenas IDs reais (não temporários) que estão na lista atual
            const varietiesToKeep = varieties
              .filter((v) => {
                // Apenas considerar variedades com ID real (não temporário) e com nome válido
                return v.id && 
                       !v.id.startsWith("temp-") && 
                       v.name && 
                       v.name.trim() !== ""
              })
              .map((v) => v.id)
              .filter((id): id is string => id !== undefined && typeof id === "string")

            // Encontrar variedades que existem no banco mas não estão mais na lista
            const varietiesToDelete = existingVarieties
              .filter((ev) => !varietiesToKeep.includes(ev.id))
              .map((ev) => ev.id)

            if (varietiesToDelete.length > 0) {
              // Tentar deletar primeiro
              const { error: deleteError } = await supabase
                .from("product_varieties")
                .delete()
                .in("id", varietiesToDelete)

              if (deleteError) {
                // Se for erro de foreign key, marcar como inativa em vez de deletar
                const hasErrorMessage = deleteError.message && deleteError.message.trim() !== ""
                if (hasErrorMessage && deleteError.message.includes("foreign key constraint")) {
                  console.warn("Algumas variedades estão sendo usadas em pedidos. Marcando como inativas em vez de deletar.")
                  // Marcar como inativa
                  const { error: updateError } = await supabase
                    .from("product_varieties")
                    .update({ active: false })
                    .in("id", varietiesToDelete)
                  
                  if (updateError) {
                    console.warn("Erro ao marcar variedades como inativas:", updateError.message)
                  }
                } else if (hasErrorMessage && !deleteError.message.includes("schema cache") && !deleteError.message.includes("does not exist")) {
                  // Só logar se não for erro de tabela não encontrada
                  console.warn("Erro ao deletar variedades antigas:", deleteError.message)
                }
                // Não lançar erro - continuar o processo mesmo se não conseguir deletar
              }
            }
          }
        } catch (error) {
          // Se houver erro ao acessar a tabela, apenas logar e continuar
          if (error instanceof Error && (error.message.includes("schema cache") || error.message.includes("does not exist"))) {
            console.warn("Tabela product_varieties não encontrada. Variedades não foram salvas.")
          } else {
            // Só lançar erro se não for relacionado a foreign key
            if (error instanceof Error && error.message.includes("foreign key constraint")) {
              console.warn("Erro ao salvar variedades devido a restrições de chave estrangeira. Continuando...")
          } else {
            throw error
          }
          }
        }

        // Salvar extras usando upsert (update ou insert)
        try {
          // Buscar extras existentes
          const { data: existingExtras } = await supabase
            .from("product_extras")
            .select("id")
            .eq("product_id", productId)

          // Preparar dados para upsert (se houver extras na lista)
          if (extras.length > 0) {
            const extrasData = extras
              .filter((e) => e.name && e.name.trim() !== "")
              .map((e, index) => ({
                ...(e.id && existingExtras?.some(ee => ee.id === e.id) ? { id: e.id } : {}),
                product_id: productId,
                name: e.name.trim(),
                price: Number(e.price) || 0,
                display_order: index,
                max_quantity: Number(e.max_quantity) || 10,
                active: e.active ?? true,
              }))
            
            if (extrasData.length > 0) {
              // Usar upsert para atualizar existentes e inserir novos
              const { error: extrasError } = await supabase
                .from("product_extras")
                .upsert(extrasData, { onConflict: "id" })

              if (extrasError) {
                // Verificar se há uma mensagem de erro real
                const hasErrorMessage = extrasError.message && extrasError.message.trim() !== ""
                const hasErrorCode = extrasError.code && extrasError.code.trim() !== ""

                // Se o erro for porque a tabela não existe, apenas logar e continuar
                if (hasErrorMessage && (extrasError.message.includes("schema cache") || extrasError.message.includes("does not exist"))) {
                  console.warn("Tabela product_extras não encontrada. Extras não foram salvos.")
                } else if (hasErrorMessage || hasErrorCode) {
                  // Só lançar erro se houver uma mensagem ou código de erro real
                  console.error("Error upserting extras:", extrasError.message || extrasError.code || extrasError)
                  throw new Error(extrasError.message || extrasError.code || "Erro ao salvar extras")
                }
              }
            }
          }

          // Deletar extras que não estão mais na lista (sempre verificar, mesmo se a lista estiver vazia)
          if (existingExtras && existingExtras.length > 0) {
            // Filtrar apenas IDs reais (não temporários) que estão na lista atual
            const extrasToKeep = extras
              .filter((e) => {
                // Apenas considerar extras com ID real (não temporário) e com nome válido
                return e.id && 
                       !e.id.startsWith("temp-") && 
                       e.name && 
                       e.name.trim() !== ""
              })
              .map((e) => e.id)
              .filter((id): id is string => id !== undefined && typeof id === "string")

            // Encontrar extras que existem no banco mas não estão mais na lista
            const extrasToDelete = existingExtras
              .filter((ee) => !extrasToKeep.includes(ee.id))
              .map((ee) => ee.id)

            if (extrasToDelete.length > 0) {
              // Tentar deletar primeiro
              const { error: deleteError } = await supabase
                .from("product_extras")
                .delete()
                .in("id", extrasToDelete)

              if (deleteError) {
                // Se for erro de foreign key, marcar como inativo em vez de deletar
                const hasErrorMessage = deleteError.message && deleteError.message.trim() !== ""
                if (hasErrorMessage && deleteError.message.includes("foreign key constraint")) {
                  console.warn("Alguns extras estão sendo usados em pedidos. Marcando como inativos em vez de deletar.")
                  // Marcar como inativo
                  const { error: updateError } = await supabase
                    .from("product_extras")
                    .update({ active: false })
                    .in("id", extrasToDelete)
                  
                  if (updateError) {
                    console.warn("Erro ao marcar extras como inativos:", updateError.message)
                  }
                } else if (hasErrorMessage && !deleteError.message.includes("schema cache") && !deleteError.message.includes("does not exist")) {
                  // Só logar se não for erro de tabela não encontrada
                  console.warn("Erro ao deletar extras antigos:", deleteError.message)
                }
                // Não lançar erro - continuar o processo mesmo se não conseguir deletar
              }
            }
          }
        } catch (error) {
          // Se houver erro ao acessar a tabela, apenas logar e continuar
          if (error instanceof Error && (error.message.includes("schema cache") || error.message.includes("does not exist"))) {
            console.warn("Tabela product_extras não encontrada. Extras não foram salvos.")
          } else {
            // Só lançar erro se não for relacionado a foreign key
            if (error instanceof Error && error.message.includes("foreign key constraint")) {
              console.warn("Erro ao salvar extras devido a restrições de chave estrangeira. Continuando...")
          } else {
            throw error
            }
          }
        }
      }

      resetForm()
      onClose()
      router.refresh()
    } catch (error) {
      console.error("Error saving product:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao salvar produto"
      alert(`Erro ao salvar produto: ${errorMessage}`)
    } finally {
      setIsUploading(false)
    }
  }

  const addVariety = () => {
    setVarieties([
      ...varieties,
      {
        id: `temp-${Date.now()}`,
        product_id: product?.id || "",
        name: "",
        price: 0,
        display_order: varieties.length,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
  }

  const removeVariety = (index: number) => {
    setVarieties(varieties.filter((_, i) => i !== index))
  }

  const updateVariety = (index: number, field: keyof ProductVariety, value: string | number | boolean) => {
    const newVarieties = [...varieties]
    newVarieties[index] = { ...newVarieties[index], [field]: value }
    setVarieties(newVarieties)
  }

  const addExtra = () => {
    setExtras([
      ...extras,
      {
        id: `temp-${Date.now()}`,
        product_id: product?.id || "",
        name: "",
        price: 0,
        display_order: extras.length,
        active: true,
        max_quantity: 10,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
  }

  const removeExtra = (index: number) => {
    setExtras(extras.filter((_, i) => i !== index))
  }

  const updateExtra = (index: number, field: keyof ProductExtra, value: string | number | boolean) => {
    const newExtras = [...extras]
    newExtras[index] = { ...newExtras[index], [field]: value }
    setExtras(newExtras)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-slate-200 w-[95vw] sm:w-full max-w-3xl max-h-[95vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-600 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900">
                {product ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {product ? "Edite os detalhes do produto" : "Configure todos os detalhes, variedades e extras do novo produto"}
              </DialogDescription>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Configure todos os detalhes, variedades e extras
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-4 sm:px-6 pt-3 border-b border-slate-200 bg-slate-50 flex-shrink-0">
              <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200">
                <TabsTrigger value="details" className="text-xs sm:text-sm data-[state=active]:bg-slate-600 data-[state=active]:text-white">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Detalhes
                </TabsTrigger>
                <TabsTrigger value="varieties" className="text-xs sm:text-sm data-[state=active]:bg-slate-600 data-[state=active]:text-white">
                  <ListPlus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Variedades
                  {varieties.length > 0 && (
                    <Badge className="ml-1 sm:ml-2 bg-slate-600 text-white text-[10px] sm:text-xs px-1 sm:px-1.5">
                      {varieties.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="extras" className="text-xs sm:text-sm data-[state=active]:bg-slate-600 data-[state=active]:text-white">
                  <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Extras
                  {extras.length > 0 && (
                    <Badge className="ml-1 sm:ml-2 bg-slate-600 text-white text-[10px] sm:text-xs px-1 sm:px-1.5">
                      {extras.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 px-4 sm:px-6 min-h-0 overflow-y-auto">
              <TabsContent value="details" className="mt-0 py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image" className="text-slate-900 font-semibold">
                    Imagem do Produto
                  </Label>
                  <div className="flex flex-col gap-4">
                    {imagePreview && (
                      <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden border-2 border-slate-200 shadow-sm">
                        <Image src={imagePreview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Input
                        id="image"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleImageChange}
                        className="border-slate-200 text-xs sm:text-sm"
                      />
                      <Upload className="h-5 w-5 text-slate-600" />
                    </div>
                    <p className="text-xs text-slate-600">Formatos: PNG, JPEG, JPG, WebP</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name" className="text-slate-900 font-semibold">
                      Nome do Produto
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="border-slate-200 text-sm"
                      placeholder="Ex: X-Burger Especial"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description" className="text-slate-900 font-semibold">
                      Descrição
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="border-slate-200 text-sm min-h-[80px]"
                      placeholder="Descreva os ingredientes e características do produto..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-slate-900 font-semibold">
                      Preço Base (R$)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price === 0 ? 0 : formData.price || ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value) || 0
                        setFormData({ ...formData, price: value })
                      }}
                      required
                      className="border-slate-200 text-sm"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-slate-600">Preço base sem variedades</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-slate-900 font-semibold">
                      Categoria
                    </Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger className="border-slate-200 text-sm">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id} className="text-sm">
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_order" className="text-slate-900 font-semibold">
                      Ordem de Exibição
                    </Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={formData.display_order === 0 ? 0 : formData.display_order || ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value) || 0
                        setFormData({ ...formData, display_order: value })
                      }}
                      className="border-slate-200 text-sm"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="active" className="text-slate-900 font-semibold">
                      Status
                    </Label>
                    <div className="flex items-center gap-3 h-10 px-3 border border-slate-200 rounded-md">
                      <Switch
                        id="active"
                        checked={formData.active}
                        onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                      />
                      <span className="text-sm text-slate-700">{formData.active ? "Ativo" : "Inativo"}</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="varieties" className="mt-0 py-4 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-slate-700">
                    Variedades permitem oferecer o mesmo produto em diferentes tamanhos ou versões com preços
                    distintos (Ex: Pequeno, Médio, Grande).
                  </p>
                </div>

                <div className="space-y-3">
                  {varieties.map((variety, index) => (
                    <div
                      key={variety.id}
                      className="border border-slate-200 rounded-lg p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <GripVertical className="h-5 w-5 text-slate-400 mt-2 flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2 space-y-1.5">
                              <Label className="text-xs font-semibold text-slate-700">Nome da Variedade</Label>
                              <Input
                                value={variety.name}
                                onChange={(e) => updateVariety(index, "name", e.target.value)}
                                placeholder="Ex: Médio"
                                className="border-slate-200 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-slate-700">Preço (R$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={variety.price === 0 ? 0 : variety.price || ""}
                                onChange={(e) => {
                                  const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value) || 0
                                  updateVariety(index, "price", value)
                                }}
                                placeholder="0.00"
                                className="border-slate-200 text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={variety.active}
                              onCheckedChange={(checked) => updateVariety(index, "active", checked)}
                            />
                            <span className="text-xs text-slate-600">{variety.active ? "Ativo" : "Inativo"}</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeVariety(index)}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600 hover:bg-red-50 flex-shrink-0 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={addVariety}
                  variant="outline"
                  className="w-full border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Variedade
                </Button>
              </TabsContent>

              <TabsContent value="extras" className="mt-0 py-4 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-slate-700">
                    Extras são adicionais opcionais que os clientes podem incluir no produto (Ex: Bacon Extra, Queijo
                    Extra, Molho Especial).
                  </p>
                </div>

                <div className="space-y-3">
                  {extras.map((extra, index) => (
                    <div
                      key={extra.id}
                      className="border border-slate-200 rounded-lg p-3 sm:p-4 bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <GripVertical className="h-5 w-5 text-slate-400 mt-2 flex-shrink-0" />
                        <div className="flex-1 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2 space-y-1.5">
                              <Label className="text-xs font-semibold text-slate-700">Nome do Extra</Label>
                              <Input
                                value={extra.name}
                                onChange={(e) => updateExtra(index, "name", e.target.value)}
                                placeholder="Ex: Bacon Extra"
                                className="border-slate-200 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-slate-700">Preço (R$)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={extra.price === 0 ? 0 : extra.price || ""}
                                onChange={(e) => {
                                  const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value) || 0
                                  updateExtra(index, "price", value)
                                }}
                                placeholder="0.00"
                                className="border-slate-200 text-sm"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold text-slate-700">Quantidade Máxima</Label>
                              <Input
                                type="number"
                                value={extra.max_quantity === 0 ? 0 : extra.max_quantity || ""}
                                onChange={(e) => {
                                  const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value) || 0
                                  updateExtra(index, "max_quantity", value)
                                }}
                                placeholder="10"
                                className="border-slate-200 text-sm"
                              />
                            </div>
                            <div className="flex items-center gap-2 mt-6">
                              <Switch
                                checked={extra.active}
                                onCheckedChange={(checked) => updateExtra(index, "active", checked)}
                              />
                              <span className="text-xs text-slate-600">{extra.active ? "Ativo" : "Inativo"}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={() => removeExtra(index)}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600 hover:bg-red-50 flex-shrink-0 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={addExtra}
                  variant="outline"
                  className="w-full border-slate-300 hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Extra
                </Button>
              </TabsContent>
            </div>
          </Tabs>

          <div className="border-t border-slate-200 px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
            <Button
              type="button"
              onClick={() => {
                resetForm()
                onClose()
              }}
              variant="outline"
              className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white cursor-pointer"
              disabled={isUploading}
            >
              {isUploading ? "Salvando..." : product ? "Atualizar Produto" : "Criar Produto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
