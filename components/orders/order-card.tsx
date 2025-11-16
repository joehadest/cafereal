"use client"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Clock, ChevronRight, Bike, MapPin, Phone, User, UtensilsCrossed, Printer, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Order } from "@/types/order"
import { PrintOrderReceipt } from "./print-order-receipt"
import { PrintKitchenTicket } from "./print-kitchen-ticket"

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
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [printType, setPrintType] = useState<"receipt" | "kitchen">("kitchen")
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

  const handlePrint = (type: "receipt" | "kitchen") => {
    setPrintType(type)
    setShowPrintDialog(false)
    setTimeout(() => {
      window.print()
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
                onClick={() => setShowPrintDialog(true)}
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
                className="flex flex-col gap-1 text-sm bg-orange-50 p-2 rounded hover:bg-orange-100 transition-all duration-300 animate-in slide-in-from-right"
                style={{ animationDelay: `${index * 100}ms` }}
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

      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-600 rounded-lg">
                <Printer className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Escolher Formato</h2>
            </div>
            <p className="text-sm text-slate-600 ml-14">Selecione o tipo de impressão para este pedido</p>
          </div>

          <div className="p-6 space-y-3">
            <button
              onClick={() => handlePrint("kitchen")}
              className="group w-full p-5 flex items-start gap-4 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-600 hover:bg-slate-50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                <UtensilsCrossed className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-slate-700">Comanda de Cozinha</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Formato grande com foco nos itens e observações para a equipe da cozinha
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 mt-2 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
            </button>

            <button
              onClick={() => handlePrint("receipt")}
              className="group w-full p-5 flex items-start gap-4 bg-white border-2 border-slate-200 rounded-xl hover:border-slate-600 hover:bg-slate-50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                <Printer className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-slate-700">Recibo Completo</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Com valores detalhados, informações do cliente e dados de entrega
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 mt-2 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="hidden print:block">
        {printType === "kitchen" ? (
          <PrintKitchenTicket order={order} restaurantName={restaurantInfo?.name} />
        ) : (
          <PrintOrderReceipt order={order} restaurantInfo={restaurantInfo} />
        )}
      </div>
    </>
  )
}
