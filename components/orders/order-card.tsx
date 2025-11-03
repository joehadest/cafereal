"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, ChevronRight, Bike, MapPin, Phone, User, UtensilsCrossed, Printer, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ThermalPrintReceipt } from "./thermal-print-receipt"

type OrderItem = {
  id: string
  product_name: string
  quantity: number
  notes: string | null
}

type Order = {
  id: string
  order_type: string
  table_number: number
  status: string
  total: number
  notes: string | null
  customer_name?: string | null
  customer_phone?: string | null
  delivery_address?: string | null
  delivery_fee?: number
  created_at: string
  order_items: OrderItem[]
}

const statusConfig = {
  pending: {
    label: "Pendente",
    color: "bg-yellow-500",
    nextStatus: "preparing",
    nextLabel: "Iniciar Preparo",
  },
  preparing: {
    label: "Em Preparo",
    color: "bg-blue-500",
    nextStatus: "ready",
    nextLabel: "Marcar como Pronto",
  },
  ready: {
    label: "Pronto",
    color: "bg-green-500",
    nextStatus: (orderType: string) => (orderType === "delivery" ? "out_for_delivery" : "delivered"),
    nextLabel: (orderType: string) => (orderType === "delivery" ? "Saiu para Entrega" : "Marcar como Entregue"),
  },
  out_for_delivery: {
    label: "Saiu para Entrega",
    color: "bg-purple-500",
    nextStatus: "delivered",
    nextLabel: "Marcar como Entregue",
  },
}

export function OrderCard({ order }: { order: Order }) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const config = statusConfig[order.status as keyof typeof statusConfig]

  const isDelivery = order.order_type === "delivery"

  const handleUpdateStatus = async () => {
    setIsUpdating(true)
    const supabase = createClient()

    try {
      const nextStatus =
        typeof config.nextStatus === "function" ? config.nextStatus(order.order_type) : config.nextStatus

      const { error } = await supabase.from("orders").update({ status: nextStatus }).eq("id", order.id)

      if (error) throw error

      router.refresh()
    } catch (error) {
      console.error("Error updating order:", error)
      alert("Erro ao atualizar pedido")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteOrder = async () => {
    if (!confirm("Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.")) {
      return
    }

    setIsDeleting(true)
    const supabase = createClient()

    try {
      // Primeiro deletar os itens do pedido
      const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", order.id)
      if (itemsError) throw itemsError

      // Depois deletar o pedido
      const { error: orderError } = await supabase.from("orders").delete().eq("id", order.id)
      if (orderError) throw orderError

      router.refresh()
    } catch (error) {
      console.error("Error deleting order:", error)
      alert("Erro ao excluir pedido")
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePrint = () => {
    setShowPrint(true)
    setTimeout(() => {
      window.print()
      setShowPrint(false)
    }, 100)
  }

  const timeAgo = new Date(order.created_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const nextLabel = typeof config.nextLabel === "function" ? config.nextLabel(order.order_type) : config.nextLabel

  return (
    <>
      <Card className="border-orange-200 hover:shadow-2xl hover:scale-[1.02] hover:border-orange-400 transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {isDelivery ? (
                <div className="flex items-center gap-2 group">
                  <Bike className="h-5 w-5 text-orange-600 group-hover:animate-bounce" />
                  <span className="text-xl font-bold text-orange-900">Delivery</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <UtensilsCrossed className="h-5 w-5 text-orange-600 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="text-xl font-bold text-orange-900">Mesa {order.table_number}</span>
                </div>
              )}
              <Badge className={`${config.color} text-white border-0 animate-in zoom-in duration-300`}>
                {config.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrint}
                variant="outline"
                size="icon"
                className="border-orange-300 text-orange-900 hover:bg-orange-50 bg-transparent hover:scale-110 hover:rotate-12 transition-all duration-300"
                title="Imprimir pedido"
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                variant="outline"
                size="icon"
                className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent hover:scale-110 transition-all duration-300"
                title="Excluir pedido"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 text-sm text-orange-700">
                <Clock className="h-4 w-4 animate-pulse" />
                {timeAgo}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {isDelivery && (
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 space-y-1 text-sm animate-in slide-in-from-left duration-500 hover:bg-orange-100 transition-colors">
              <div className="flex items-center gap-2 text-orange-900">
                <User className="h-5 w-5" />
                <span className="font-semibold">{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2 text-orange-800">
                <Phone className="h-5 w-5" />
                <span>{order.customer_phone}</span>
              </div>
              <div className="flex items-start gap-2 text-orange-800">
                <MapPin className="h-5 w-5 mt-0.5" />
                <span className="text-xs">{order.delivery_address}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {order.order_items.map((item, index) => (
              <div
                key={item.id}
                className="flex justify-between text-sm bg-orange-50 p-2 rounded hover:bg-orange-100 transition-all duration-300 animate-in slide-in-from-right"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="text-orange-900">
                  {item.quantity}x {item.product_name}
                </span>
                {item.notes && <span className="text-orange-600 text-xs italic">{item.notes}</span>}
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="bg-amber-50 p-2 rounded border border-amber-200">
              <p className="text-xs font-semibold text-amber-900 mb-1">Observações:</p>
              <p className="text-sm text-amber-800">{order.notes}</p>
            </div>
          )}

          <div className="pt-2 border-t border-orange-200">
            {isDelivery && order.delivery_fee && order.delivery_fee > 0 && (
              <div className="flex justify-between items-center text-sm text-orange-700 mb-1">
                <span>Taxa de entrega:</span>
                <span>R$ {order.delivery_fee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-semibold text-orange-900">Total:</span>
              <span className="text-xl font-bold text-orange-600 hover:scale-110 transition-transform duration-300 inline-block">
                R$ {order.total.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleUpdateStatus}
            disabled={isUpdating}
            className={`w-full bg-orange-600 hover:bg-orange-700 hover:shadow-lg transition-all duration-300 ${
              isUpdating ? "animate-pulse" : "hover:scale-105"
            }`}
          >
            {isUpdating ? "Atualizando..." : nextLabel}
            <ChevronRight
              className={`h-4 w-4 ml-2 ${isUpdating ? "" : "group-hover:translate-x-1 transition-transform"}`}
            />
          </Button>
        </CardFooter>
      </Card>

      {showPrint && <ThermalPrintReceipt order={order} />}
    </>
  )
}
