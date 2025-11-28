"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type Category = {
  id: string
  name: string
  description: string | null
  display_order: number
  active: boolean
}

export function CategoriesClient({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    display_order: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    try {
      if (editingCategory) {
        const { error } = await supabase.from("categories").update(formData).eq("id", editingCategory.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("categories").insert(formData)
        if (error) throw error
      }

      setIsDialogOpen(false)
      setEditingCategory(null)
      setFormData({ name: "", description: "", display_order: 0 })
      router.refresh()
    } catch (error) {
      console.error("Error saving category:", error)
      alert("Erro ao salvar categoria")
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      display_order: category.display_order,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta categoria?")) return

    const supabase = createClient()
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error deleting category:", error)
      alert("Erro ao deletar categoria")
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-4 text-center animate-in slide-in-from-top duration-700">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 animate-in fade-in slide-in-from-bottom duration-500">Categorias</h1>
          <p className="text-sm sm:text-base text-slate-700 animate-in fade-in slide-in-from-bottom duration-700 delay-100">Gerencie as categorias do cardápio</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingCategory(null)
                setFormData({ name: "", description: "", display_order: 0 })
              }}
              className="bg-slate-600 hover:bg-slate-700 hover:scale-105 hover:shadow-lg transition-all duration-300 w-full sm:w-auto animate-in fade-in slide-in-from-right duration-500 delay-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200 w-[95vw] sm:w-full max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-900">
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {editingCategory ? "Edite os detalhes da categoria" : "Crie uma nova categoria para organizar os produtos"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-900">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-900">
                  Descrição
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order" className="text-slate-900">
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
                  className="border-slate-200"
                />
              </div>
              <Button type="submit" className="w-full bg-slate-600 hover:bg-slate-700">
                {editingCategory ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="border-slate-200 cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-slate-900 flex items-center justify-between gap-2 text-base sm:text-lg">
                <span className="flex-1 min-w-0 break-words">{category.name}</span>
                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                  <Button
                    onClick={() => handleEdit(category)}
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 sm:h-8 sm:w-8 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(category.id)}
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <p className="text-xs sm:text-sm text-slate-700 break-words">{category.description || "Sem descrição"}</p>
              <p className="text-xs text-slate-600 mt-2">Ordem: {category.display_order}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
