"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, Minus, Plus, ShoppingBag, Bike, MapPin, Phone, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ThermalPrintReceipt } from "@/components/orders/thermal-print-receipt"

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
  const [autoPrint, setAutoPrint] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<any>(null)
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

      const orderWithItems = {
        ...order,
        order_items: orderItems.map((item, index) => ({
          id: `temp-${index}`,
          product_name: item.product_name,
          quantity: item.quantity,
          notes: null,
        })),
      }

      if (autoPrint) {
        setCreatedOrder(orderWithItems)
        setTimeout(() => {
          window.print()
          setCreatedOrder(null)
        }, 500)
      }

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
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-orange-200 bg-orange-50">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-orange-900">Seu Pedido</h2>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" className="text-orange-900 hover:bg-orange-100">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-orange-700">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-orange-300" />
              <p className="text-lg">Seu carrinho está vazio</p>
            </div>
          ) : (
            <>
              {orderType === "delivery" && deliveryInfo && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 space-y-2">
                  <div className="flex items-center gap-2 text-orange-900 font-semibold mb-2">
                    <Bike className="h-5 w-5" />
                    <span>Informações de Entrega</span>
                  </div>
                  <div className="space-y-1 text-sm text-orange-800">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{deliveryInfo.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{deliveryInfo.customerPhone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5" />
                      <span>{deliveryInfo.deliveryAddress}</span>
                    </div>
                  </div>
                </div>
              )}

              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex-1">
                    <h3 className="font-semibold text-orange-900">{item.name}</h3>
                    <p className="text-sm text-orange-700">R$ {item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-orange-300"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold text-orange-900">{item.quantity}</span>
                    <Button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-orange-300"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => onRemoveItem(item.id)}
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="pt-4">
                <label className="block text-sm font-medium text-orange-900 mb-2">Observações (opcional)</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Sem cebola, ponto da carne, etc."
                  className="border-orange-200 focus:border-orange-400"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <input
                  type="checkbox"
                  id="autoPrint"
                  checked={autoPrint}
                  onChange={(e) => setAutoPrint(e.target.checked)}
                  className="h-4 w-4 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="autoPrint" className="text-sm text-orange-900 cursor-pointer">
                  Imprimir automaticamente após finalizar pedido
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-orange-200 p-6 space-y-4 bg-orange-50">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm text-orange-800">
                <span>Subtotal:</span>
                <span>R$ {totalPrice.toFixed(2)}</span>
              </div>
              {orderType === "delivery" && deliveryFee > 0 && (
                <div className="flex justify-between items-center text-sm text-orange-800">
                  <span className="flex items-center gap-1">
                    <Bike className="h-4 w-4" />
                    Taxa de entrega:
                  </span>
                  <span>R$ {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg pt-2 border-t border-orange-300">
                <span className="font-semibold text-orange-900">Total:</span>
                <span className="text-2xl font-bold text-orange-600">R$ {finalTotal.toFixed(2)}</span>
              </div>
            </div>
            <Button
              onClick={handleSubmitOrder}
              disabled={
                isSubmitting || (!tableNumber && orderType === "dinein") || (!deliveryInfo && orderType === "delivery")
              }
              className="w-full bg-orange-600 hover:bg-orange-700 text-lg py-6"
            >
              {isSubmitting ? "Enviando..." : "Finalizar Pedido"}
            </Button>
          </div>
        )}
      </div>

      {createdOrder && <ThermalPrintReceipt order={createdOrder} autoPrint={true} />}
    </>
  )
}
