"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export function DeleteOrderButton({ orderId, variant = "icon" }: { orderId: string; variant?: "icon" | "text" }) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.")) return
    setIsDeleting(true)
    const supabase = createClient()
    try {
      const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", orderId)
      if (itemsError) throw itemsError

      const { error: orderError } = await supabase.from("orders").delete().eq("id", orderId)
      if (orderError) throw orderError

      router.refresh()
    } catch (e) {
      console.error(e)
      alert("Erro ao excluir pedido")
    } finally {
      setIsDeleting(false)
    }
  }

  if (variant === "text") {
    return (
      <Button onClick={handleDelete} variant="outline" size="sm" disabled={isDeleting} className="text-red-600 cursor-pointer">
        <Trash2 className="h-4 w-4 mr-2" />
        {isDeleting ? "Excluindo..." : "Excluir"}
      </Button>
    )
  }

  return (
    <Button
      onClick={handleDelete}
      variant="outline"
      size="icon"
      disabled={isDeleting}
      className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent cursor-pointer"
      title="Excluir pedido"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
