"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Users, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

type Table = {
  id: string
  table_number: number
  capacity: number
  status: string
  active?: boolean
}

export function TablesClient({ tables }: { tables: Table[] }) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [formData, setFormData] = useState({
    table_number: 0,
    capacity: 4,
    status: "available",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()

    try {
      if (editingTable) {
        const { error } = await supabase.from("restaurant_tables").update(formData).eq("id", editingTable.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("restaurant_tables").insert(formData)
        if (error) throw error
      }

      setIsDialogOpen(false)
      setEditingTable(null)
      setFormData({ table_number: 0, capacity: 4, status: "available" })
      router.refresh()
    } catch (error) {
      console.error("Error saving table:", error)
      alert("Erro ao salvar mesa")
    }
  }

  const handleEdit = (table: Table) => {
    setEditingTable(table)
    setFormData({
      table_number: table.table_number,
      capacity: table.capacity,
      status: table.status,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta mesa permanentemente? Esta ação não pode ser desfeita.")) return

    const supabase = createClient()
    try {
      const { error } = await supabase.from("restaurant_tables").delete().eq("id", id)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error deleting table:", error)
      alert("Erro ao deletar mesa")
    }
  }

  const handleToggleActive = async (table: Table) => {
    const supabase = createClient()
    try {
      const newActiveStatus = !(table.active ?? true)
      const { error } = await supabase
        .from("restaurant_tables")
        .update({ active: newActiveStatus })
        .eq("id", table.id)
      
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error toggling table active status:", error)
      alert("Erro ao alterar status da mesa")
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-4 text-center animate-in slide-in-from-top duration-700">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 animate-in fade-in slide-in-from-bottom duration-500">Mesas</h1>
          <p className="text-sm sm:text-base text-slate-700 animate-in fade-in slide-in-from-bottom duration-700 delay-100">Gerencie as mesas do restaurante</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingTable(null)
                setFormData({
                  table_number: 0,
                  capacity: 4,
                  status: "available",
                })
              }}
              className="bg-slate-600 hover:bg-slate-700 hover:scale-105 hover:shadow-lg transition-all duration-300 w-full sm:w-auto animate-in fade-in slide-in-from-right duration-500 delay-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Mesa
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-slate-200 w-[95vw] sm:w-full max-w-md">
            <DialogHeader>
              <DialogTitle className="text-slate-900">{editingTable ? "Editar Mesa" : "Nova Mesa"}</DialogTitle>
              <DialogDescription className="sr-only">
                {editingTable ? "Edite os detalhes da mesa" : "Adicione uma nova mesa ao restaurante"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="table_number" className="text-slate-900">
                  Número da Mesa
                </Label>
                <Input
                  id="table_number"
                  type="number"
                  value={formData.table_number}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      table_number: Number.parseInt(e.target.value),
                    })
                  }
                  required
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-slate-900">
                  Capacidade
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: Number.parseInt(e.target.value),
                    })
                  }
                  required
                  className="border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-900">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="occupied">Ocupada</SelectItem>
                    <SelectItem value="reserved">Reservada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-slate-600 hover:bg-slate-700">
                {editingTable ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {/* Mesas Ativas */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-3">Mesas Ativas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {tables.filter((table) => table.active !== false).map((table) => (
              <Card key={table.id} className="border-slate-200 cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                  <CardTitle className="text-slate-900 flex items-center justify-between gap-2">
                    <span className="text-xl sm:text-2xl font-bold">{table.table_number}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        onClick={() => handleEdit(table)}
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 sm:h-7 sm:w-7 text-slate-600 hover:bg-slate-50 cursor-pointer"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => handleToggleActive(table)}
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 sm:h-7 sm:w-7 text-orange-600 hover:bg-orange-50 cursor-pointer"
                        title="Desativar mesa"
                      >
                        <EyeOff className="h-3 w-3" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(table.id)}
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 sm:h-7 sm:w-7 text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Deletar permanentemente"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-3 sm:p-6 pt-0">
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-700">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span>{table.capacity} {table.capacity === 1 ? 'pessoa' : 'pessoas'}</span>
                  </div>
                  <Badge
                    variant={table.status === "available" ? "outline" : "default"}
                    className={`text-xs ${table.status === "available" ? "border-green-500 text-green-700" : "bg-slate-600"}`}
                  >
                    {table.status === "available" ? "Disponível" : table.status === "occupied" ? "Ocupada" : "Reservada"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mesas Desativadas */}
        {tables.filter((table) => table.active === false).length > 0 && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-600 mb-3">Mesas Desativadas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {tables.filter((table) => table.active === false).map((table) => (
                <Card key={table.id} className="border-slate-200 opacity-60 cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <CardTitle className="text-slate-600 flex items-center justify-between gap-2">
                      <span className="text-xl sm:text-2xl font-bold line-through">{table.table_number}</span>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          onClick={() => handleEdit(table)}
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 sm:h-7 sm:w-7 text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => handleToggleActive(table)}
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 sm:h-7 sm:w-7 text-green-600 hover:bg-green-50 cursor-pointer"
                          title="Reativar mesa"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(table.id)}
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 sm:h-7 sm:w-7 text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Deletar permanentemente"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-3 sm:p-6 pt-0">
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-500">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{table.capacity} {table.capacity === 1 ? 'pessoa' : 'pessoas'}</span>
                    </div>
                    <Badge variant="outline" className="text-xs border-slate-400 text-slate-500">
                      Desativada
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
