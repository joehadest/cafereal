"use client"

import React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Bike, UtensilsCrossed, MapPin, Phone, User, Package, CheckCircle, XCircle } from "lucide-react"
import type { Order } from "@/types/order"

const statusConfig = {
  pending: {
    label: "Pendente",
    color: "bg-yellow-500",
    icon: Clock,
  },
  preparing: {
    label: "Em Preparo",
    color: "bg-blue-500",
    icon: Package,
  },
  ready: {
    label: "Pronto",
    color: "bg-green-500",
    icon: CheckCircle,
  },
  out_for_delivery: {
    label: "Saiu para Entrega",
    color: "bg-purple-500",
    icon: Bike,
  },
  delivered: {
    label: "Entregue",
    color: "bg-emerald-500",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-500",
    icon: XCircle,
  },
}

export function CustomerOrderCard({ order }: { order: Order }) {
  const config = statusConfig[order.status as keyof typeof statusConfig] || {
    label: order.status,
    color: "bg-gray-500",
    icon: Package,
  }

  const StatusIcon = config.icon
  const isDelivery = order.order_type === "delivery"

  const timeAgo = new Date(order.created_at).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <Card className="border-slate-200 hover:shadow-md hover:border-slate-400 transition-shadow">
      <CardHeader className="pb-3 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {isDelivery ? (
              <div className="flex items-center gap-2">
                <Bike className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                <span className="text-lg sm:text-xl font-bold text-slate-900">Delivery</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                <span className="text-lg sm:text-xl font-bold text-slate-900">Mesa {order.table_number}</span>
              </div>
            )}
            <Badge className={`${config.color} text-white border-0 text-xs flex items-center gap-1`}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{timeAgo}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 p-4 sm:p-6">
        {isDelivery && (order.customer_name || order.customer_phone || order.delivery_address) && (
          <div className="bg-slate-50 p-2 sm:p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs sm:text-sm">
            {order.customer_name && (
              <div className="flex items-center gap-2 text-slate-900">
                <User className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="font-semibold break-words">{order.customer_name}</span>
              </div>
            )}
            {order.customer_phone && (
              <div className="flex items-center gap-2 text-slate-800">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="break-all">{order.customer_phone}</span>
              </div>
            )}
            {order.delivery_address && (
              <div className="flex items-start gap-2 text-slate-800">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" />
                <span className="text-xs break-words">{order.delivery_address}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          {order.order_items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-1 text-xs sm:text-sm bg-slate-50 p-2 sm:p-3 rounded hover:bg-slate-100 transition-colors"
            >
              <div className="flex justify-between items-start">
                <span className="text-slate-900 font-medium break-words flex-1">
                  {item.quantity}x {item.product_name}
                </span>
              </div>
              {item.variety_name && (
                <div className="text-slate-700 text-xs ml-2 sm:ml-4">Tamanho: {item.variety_name}</div>
              )}
              {item.order_item_extras && item.order_item_extras.length > 0 && (
                <div className="text-slate-700 text-xs ml-2 sm:ml-4">
                  {item.order_item_extras.map((extra) => (
                    <div key={extra.id}>
                      + {extra.extra_name} {extra.quantity > 1 && `(x${extra.quantity})`}
                    </div>
                  ))}
                </div>
              )}
              {item.notes && <span className="text-slate-600 text-xs italic mt-1 break-words">{item.notes}</span>}
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="bg-amber-50 p-2 sm:p-3 rounded border border-amber-200">
            <p className="text-xs font-semibold text-amber-900 mb-1">Observações:</p>
            <p className="text-xs sm:text-sm text-amber-800 break-words">{order.notes}</p>
          </div>
        )}

        <div className="pt-2 border-t border-slate-200">
          {isDelivery && order.delivery_fee && order.delivery_fee > 0 && (
            <div className="flex justify-between items-center text-xs sm:text-sm text-slate-700 mb-1">
              <span>Taxa de entrega:</span>
              <span>R$ {order.delivery_fee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="font-semibold text-sm sm:text-base text-slate-900">Total:</span>
            <span className="text-lg sm:text-xl font-bold text-slate-600">
              R$ {order.total.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

