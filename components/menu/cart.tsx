"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, Minus, Plus, ShoppingBag, Bike, MapPin, Phone, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
}

type DeliveryInfo = {
  customerName: string
  customerPhone: string
  deliveryAddress: string
}

export function Cart({
  isOpen,
  onClose,
  cart,
  orderType,
  tableNumber,
  deliveryInfo,
  deliveryFee,
  onUpdateQuantity,
  onRemoveItem,
  totalPrice,
}: {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  orderType: "delivery" | "dinein" | null
  tableNumber: number | null
  deliveryInfo: DeliveryInfo | null
  deliveryFee: number
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  totalPrice: number
}) {
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const finalTotal = totalPrice + deliveryFee

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return
    if (orderType === "dinein" && !tableNumber) return
    if (orderType === "delivery" && !deliveryInfo) return

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const orderData: any = {
        order_type: orderType === "dinein" ? "dine-in" : "delivery",
        status: "pending",
        total: finalTotal,
        notes: notes || null,
      }

      if (orderType === "dinein") {
        orderData.table_number = tableNumber
      } else if (orderType === "delivery") {
        orderData.table_number = 0
        orderData.customer_name = deliveryInfo.customerName
        orderData.customer_phone = deliveryInfo.customerPhone
        orderData.delivery_address = deliveryInfo.deliveryAddress
        orderData.delivery_fee = deliveryFee
      }

      const { data: order, error: orderError } = await supabase.from("orders").insert(orderData).select().single()

      if (orderError) throw orderError

      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      const message =
        orderType === "delivery"
          ? "Pedido de delivery enviado com sucesso! Aguarde a confirmação."
          : "Pedido enviado com sucesso! Aguarde a confirmação."
      alert(message)
      onClose()
      router.refresh()
    } catch (error) {
      console.error("Error submitting order:", error)
      alert("Erro ao enviar pedido. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50 animate-in fade-in duration-300" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="relative flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-500 to-slate-600 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
          <div className="relative flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">Seu Pedido</h2>
              <p className="text-xs text-slate-100">
                {cart.length} {cart.length === 1 ? "item" : "itens"}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="relative text-white hover:bg-white/20 transition-all duration-200 hover:scale-110"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-700 animate-in fade-in duration-500">
              <div className="mb-4 inline-block p-6 bg-slate-100 rounded-full">
                <ShoppingBag className="h-16 w-16 text-slate-300" />
              </div>
              <p className="text-lg font-medium">Seu carrinho está vazio</p>
              <p className="text-sm text-slate-600 mt-2">Adicione itens do cardápio para começar</p>
            </div>
          ) : (
            <>
              {orderType === "delivery" && deliveryInfo && (
                <div className="bg-gradient-to-br from-stone-50 to-stone-100/50 p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-2 sm:space-y-3 animate-in slide-in-from-top duration-300">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm sm:text-base">
                    <div className="p-1.5 bg-slate-200 rounded-lg">
                      <Bike className="h-4 w-4" />
                    </div>
                    <span>Informações de Entrega</span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-800 pl-7 sm:pl-8">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />
                      <span className="font-medium truncate">{deliveryInfo.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />
                      <span>{deliveryInfo.customerPhone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 text-slate-600 flex-shrink-0" />
                      <span className="flex-1 break-words">{deliveryInfo.deliveryAddress}</span>
                    </div>
                  </div>
                </div>
              )}

              {cart.map((item, index) => (
                <div
                  key={item.id}
                  className="group flex gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-200 hover:border-slate-300 animate-in slide-in-from-right"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-slate-900 truncate group-hover:text-slate-600 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-slate-700 font-medium mt-1">R$ {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <Button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 sm:h-8 sm:w-8 border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 hover:scale-110"
                    >
                      <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
                    </Button>
                    <span className="w-6 sm:w-8 text-center font-bold text-sm sm:text-base text-slate-900">
                      {item.quantity}
                    </span>
                    <Button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 sm:h-8 sm:w-8 border-slate-300 hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 hover:scale-110"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
                    </Button>
                    <Button
                      onClick={() => onRemoveItem(item.id)}
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 hover:scale-110"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="pt-2 animate-in fade-in duration-500 delay-300">
                <label className="block text-sm font-semibold text-slate-900 mb-2">Observações (opcional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Sem cebola, ponto da carne, etc."
                  className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 rounded-xl resize-none transition-all duration-200 text-sm sm:text-base"
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-slate-200 p-4 sm:p-6 space-y-3 sm:space-y-4 bg-gradient-to-br from-stone-50 to-white shadow-lg">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center text-sm text-slate-800">
                <span className="font-medium">Subtotal:</span>
                <span className="font-semibold">R$ {totalPrice.toFixed(2)}</span>
              </div>
              {orderType === "delivery" && deliveryFee > 0 && (
                <div className="flex justify-between items-center text-sm text-slate-800">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Bike className="h-4 w-4" />
                    Taxa de entrega:
                  </span>
                  <span className="font-semibold">R$ {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 sm:pt-3 border-t-2 border-slate-300">
                <span className="text-base sm:text-lg font-bold text-slate-900">Total:</span>
                <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-600 to-slate-500 bg-clip-text text-transparent">
                  R$ {finalTotal.toFixed(2)}
                </span>
              </div>
            </div>
            <Button
              onClick={handleSubmitOrder}
              disabled={
                isSubmitting || (!tableNumber && orderType === "dinein") || (!deliveryInfo && orderType === "delivery")
              }
              className="w-full bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-700 hover:to-slate-600 text-white text-base sm:text-lg py-5 sm:py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-semibold"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </span>
              ) : (
                "Finalizar Pedido"
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
