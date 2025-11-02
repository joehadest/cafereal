"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

type Table = {
  id: string
  table_number: number
  capacity: number
  status: string
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
    if (!confirm("Tem certeza que deseja deletar esta mesa?")) return

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

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-orange-900">Mesas</h1>
          <p className="text-orange-700">Gerencie as mesas do restaurante</p>
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
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Mesa
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-orange-200">
            <DialogHeader>
              <DialogTitle className="text-orange-900">{editingTable ? "Editar Mesa" : "Nova Mesa"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="table_number" className="text-orange-900">
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
                  className="border-orange-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-orange-900">
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
                  className="border-orange-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-orange-900">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="border-orange-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="available">Disponível</SelectItem>
                    <SelectItem value="occupied">Ocupada</SelectItem>
                    <SelectItem value="reserved">Reservada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
                {editingTable ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map((table) => (
          <Card key={table.id} className="border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-900 flex items-center justify-between">
                <span className="text-2xl">{table.table_number}</span>
                <div className="flex gap-1">
                  <Button
                    onClick={() => handleEdit(table)}
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-orange-600 hover:bg-orange-50"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(table.id)}
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-1 text-sm text-orange-700">
                <Users className="h-4 w-4" />
                {table.capacity} pessoas
              </div>
              <Badge
                variant={table.status === "available" ? "outline" : "default"}
                className={table.status === "available" ? "border-green-500 text-green-700" : "bg-orange-600"}
              >
                {table.status === "available" ? "Disponível" : table.status === "occupied" ? "Ocupada" : "Reservada"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
