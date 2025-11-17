"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, ChevronRight, Bike, MapPin, Phone, User, UtensilsCrossed, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Order } from "@/types/order"

type OrderItem = {
  id: string
  product_name: string
  quantity: number
  notes: string | null
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

export function OrderCard({
  order,
  restaurantInfo,
}: { order: Order; restaurantInfo?: { name: string; phone?: string; address?: string } }) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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
      const { error: itemsError } = await supabase.from("order_items").delete().eq("order_id", order.id)
      if (itemsError) throw itemsError

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

  const timeAgo = new Date(order.created_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const nextLabel = typeof config.nextLabel === "function" ? config.nextLabel(order.order_type) : config.nextLabel

  return (
    <>
      <Card className="border-orange-200 hover:shadow-md hover:border-orange-400 transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              {isDelivery ? (
                <div className="flex items-center gap-2">
                  <Bike className="h-5 w-5 text-orange-600" />
                  <span className="text-xl font-bold text-orange-900">Delivery</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-5 w-5 text-orange-600" />
                  <span className="text-xl font-bold text-orange-900">Mesa {order.table_number}</span>
                </div>
              )}
              <Badge className={`${config.color} text-white border-0`}>
                {config.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDeleteOrder}
                disabled={isDeleting}
                variant="outline"
                size="icon"
                className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                title="Excluir pedido"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 text-sm text-orange-700">
                <Clock className="h-4 w-4" />
                {timeAgo}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {isDelivery && (order.customer_name || order.customer_phone || order.delivery_address) && (
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 space-y-1 text-sm hover:bg-orange-100 transition-colors">
              {order.customer_name && (
                <div className="flex items-center gap-2 text-orange-900">
                  <User className="h-5 w-5" />
                  <span className="font-semibold">{order.customer_name}</span>
                </div>
              )}
              {order.customer_phone && (
                <div className="flex items-center gap-2 text-orange-800">
                  <Phone className="h-5 w-5" />
                  <span>{order.customer_phone}</span>
                </div>
              )}
              {order.delivery_address && (
                <div className="flex items-start gap-2 text-orange-800">
                  <MapPin className="h-5 w-5 mt-0.5" />
                  <span className="text-xs">{order.delivery_address}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            {order.order_items.map((item, index) => (
              <div
                key={item.id}
                className="flex flex-col gap-1 text-sm bg-orange-50 p-2 rounded hover:bg-orange-100 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <span className="text-orange-900 font-medium">
                    {item.quantity}x {item.product_name}
                  </span>
                </div>
                {item.variety_name && (
                  <div className="text-orange-700 text-xs ml-4">Tamanho: {item.variety_name}</div>
                )}
                {item.order_item_extras && item.order_item_extras.length > 0 && (
                  <div className="text-orange-700 text-xs ml-4">
                    {item.order_item_extras.map((extra) => (
                      <div key={extra.id}>
                        + {extra.extra_name} {extra.quantity > 1 && `(x${extra.quantity})`}
                      </div>
                    ))}
                  </div>
                )}
                {item.notes && <span className="text-orange-600 text-xs italic mt-1">{item.notes}</span>}
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
    </>
  )
}
