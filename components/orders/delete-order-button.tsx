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
      // Primeiro, buscar os IDs dos itens do pedido para deletar os extras
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("id")
        .eq("order_id", orderId)

      // Deletar os extras dos itens (se houver)
      if (orderItems && orderItems.length > 0) {
        const itemIds = orderItems.map((item) => item.id)
        const { error: extrasError } = await supabase
          .from("order_item_extras")
          .delete()
          .in("order_item_id", itemIds)
        
        if (extrasError) {
          console.warn("Erro ao deletar extras (pode não existir):", extrasError)
          // Continuar mesmo se houver erro, pois pode não haver extras
        }
      }

      // Depois, deletar os itens do pedido
      const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", orderId)
      if (itemsError) {
        console.error("Erro ao deletar itens:", itemsError)
        throw itemsError
      }

      // Por fim, deletar o pedido
      const { error: orderError } = await supabase.from("orders").delete().eq("id", orderId)
      if (orderError) {
        console.error("Erro ao deletar pedido:", orderError)
        throw orderError
      }

      // Forçar atualização completa da página
      router.push("/admin/orders").catch((error) => {
        console.warn("Erro ao navegar após deletar:", error)
        // Fallback: tentar apenas refresh
        router.refresh().catch((err) => {
          console.warn("Erro ao atualizar após deletar:", err)
        })
      })
    } catch (e) {
      console.error("Erro completo ao excluir pedido:", e)
      const errorMessage = e instanceof Error ? e.message : "Erro desconhecido"
      alert(`Erro ao excluir pedido: ${errorMessage}`)
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
