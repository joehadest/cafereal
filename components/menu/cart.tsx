"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { X, Minus, Plus, ShoppingBag, Bike, MapPin, Phone, User, CheckCircle, Sparkles, MessageCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { openWhatsApp } from "@/lib/utils"
import type { ProductVariety, ProductExtra } from "@/types/product"

type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  finalPrice: number
  selectedVariety?: ProductVariety | null
  selectedExtras?: { extra: ProductExtra; quantity: number }[]
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
  whatsapp,
  restaurantInfo,
}: {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  orderType: "delivery" | "dinein" | null
  tableNumber: number | null
  deliveryInfo: DeliveryInfo | null
  deliveryFee: number
  onUpdateQuantity: (itemKey: string, quantity: number) => void
  onRemoveItem: (itemKey: string) => void
  totalPrice: number
  whatsapp?: string | null
  restaurantInfo?: {
    name?: string
    phone?: string | null
    address?: string | null
    pix_key?: string | null
  } | null
}) {
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [orderTypeMessage, setOrderTypeMessage] = useState<"delivery" | "dinein" | null>(null)
  const [manualDeliveryInfo, setManualDeliveryInfo] = useState<DeliveryInfo | null>(null)
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)
  const router = useRouter()

  // Debug: verificar se whatsapp está sendo recebido
  useEffect(() => {
    if (showSuccessModal) {
      console.log("WhatsApp disponível:", whatsapp, "Tipo:", typeof whatsapp, "Válido:", whatsapp && whatsapp.trim() !== "")
    }
  }, [showSuccessModal, whatsapp])

  const finalTotal = totalPrice + deliveryFee

  // Usar deliveryInfo se existir (usuário logado), senão usar manualDeliveryInfo
  // IMPORTANTE: Se manualDeliveryInfo foi preenchido, ele tem prioridade sobre deliveryInfo
  // para evitar duplicação quando o usuário preenche manualmente sem login
  const effectiveDeliveryInfo = manualDeliveryInfo && (manualDeliveryInfo.customerName || manualDeliveryInfo.customerPhone || manualDeliveryInfo.deliveryAddress)
    ? manualDeliveryInfo
    : deliveryInfo || manualDeliveryInfo
  // Só mostrar modo leitura se vier do deliveryInfo (usuário logado) e não houver dados manuais
  const shouldShowReadOnly = deliveryInfo !== null && (!manualDeliveryInfo || (!manualDeliveryInfo.customerName && !manualDeliveryInfo.customerPhone && !manualDeliveryInfo.deliveryAddress))

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return
    if (orderType === "dinein" && !tableNumber) return
    if (orderType === "delivery" && !effectiveDeliveryInfo) {
      alert("Por favor, preencha todas as informações de entrega")
      return
    }

    // Validação adicional para delivery
    if (orderType === "delivery" && effectiveDeliveryInfo) {
      if (!effectiveDeliveryInfo.customerName?.trim()) {
        alert("Por favor, preencha o nome completo")
        return
      }
      if (!effectiveDeliveryInfo.customerPhone?.trim()) {
        alert("Por favor, preencha o telefone")
        return
      }
      if (!effectiveDeliveryInfo.deliveryAddress?.trim()) {
        alert("Por favor, preencha o endereço completo")
        return
      }
    }

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
      } else if (orderType === "delivery" && effectiveDeliveryInfo) {
        orderData.table_number = 0
        // Garantir que os dados sejam salvos corretamente
        // Se manualDeliveryInfo foi preenchido, usar apenas ele para evitar duplicação
        const infoToSave = manualDeliveryInfo && (manualDeliveryInfo.customerName || manualDeliveryInfo.customerPhone || manualDeliveryInfo.deliveryAddress)
          ? manualDeliveryInfo
          : effectiveDeliveryInfo
        orderData.customer_name = infoToSave.customerName.trim()
        orderData.customer_phone = infoToSave.customerPhone.trim()
        // Remover quebras de linha e espaços extras do endereço
        orderData.delivery_address = infoToSave.deliveryAddress.trim().replace(/\n/g, ' ').replace(/\s+/g, ' ')
        orderData.delivery_fee = deliveryFee || 0
      }

      const { data: order, error: orderError } = await supabase.from("orders").insert(orderData).select().single()

      if (orderError) {
        console.error("Erro ao criar pedido:", orderError)
        throw orderError
      }

      // Inserir itens do pedido com variedades
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_price: item.selectedVariety ? item.selectedVariety.price : item.price,
        quantity: item.quantity,
        subtotal: item.finalPrice * item.quantity,
        variety_id: item.selectedVariety?.id || null,
        variety_name: item.selectedVariety?.name || null,
        variety_price: item.selectedVariety?.price || null,
      }))

      const { data: insertedItems, error: itemsError } = await supabase.from("order_items").insert(orderItems).select()

      if (itemsError) throw itemsError

      // Inserir extras de cada item
      if (insertedItems) {
        const extrasToInsert: any[] = []
        cart.forEach((item, cartIndex) => {
          const orderItem = insertedItems[cartIndex]
          if (item.selectedExtras && item.selectedExtras.length > 0 && orderItem) {
            item.selectedExtras.forEach((extraItem) => {
              extrasToInsert.push({
                order_item_id: orderItem.id,
                extra_id: extraItem.extra.id,
                extra_name: extraItem.extra.name,
                extra_price: extraItem.extra.price,
                quantity: extraItem.quantity,
              })
            })
          }
        })

        if (extrasToInsert.length > 0) {
          const { error: extrasError } = await supabase.from("order_item_extras").insert(extrasToInsert)
          if (extrasError) throw extrasError
        }
      }

      // Salvar ID do pedido para usar no WhatsApp
      setLastOrderId(order.id)
      
      // Mostrar modal de sucesso (não fechar o carrinho ainda)
      setOrderTypeMessage(orderType)
      setShowSuccessModal(true)
      // Não chamar onClose() aqui - deixar o modal controlar
      router.refresh()
    } catch (error) {
      console.error("Error submitting order:", error)
      alert("Erro ao enviar pedido. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendToWhatsApp = async () => {
    if (!whatsapp || !lastOrderId) {
      console.log("WhatsApp não disponível:", { whatsapp, lastOrderId })
      return
    }

    try {
      const supabase = createClient()
      
      // Buscar dados completos do pedido
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            order_item_extras (*)
          )
        `)
        .eq("id", lastOrderId)
        .single()

      if (orderError || !order) {
        console.error("Erro ao buscar pedido:", orderError)
        alert("Erro ao buscar dados do pedido")
        return
      }

      // Formatar mensagem do pedido completa e com autoridade
      const restaurantName = (restaurantInfo?.name || "Restaurante").trim()
      const restaurantPhone = (restaurantInfo?.phone || "").trim()
      const restaurantAddress = (restaurantInfo?.address || "").trim()
      const pixKey = (restaurantInfo?.pix_key || "").trim()
      
      let message = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      message += `*${restaurantName.toUpperCase()}*\n`
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      
      if (restaurantAddress) {
        message += ` *Endereço:*\n${restaurantAddress}\n\n`
      }
      if (restaurantPhone) {
        message += ` *Telefone:* ${restaurantPhone}\n\n`
      }
      
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      message += `*COMPROVANTE DE PEDIDO*\n`
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      
      if (order.order_type === "delivery") {
        message += `*TIPO:* DELIVERY\n\n`
        message += `*DADOS DO CLIENTE:*\n`
        message += `Nome: ${(order.customer_name || "N/A").trim()}\n`
        message += `Telefone: ${(order.customer_phone || "N/A").trim()}\n`
        message += `Endereço: ${(order.delivery_address || "N/A").trim()}\n\n`
      } else {
        message += `*TIPO:* MESA ${order.table_number}\n\n`
      }
      
      const orderDate = new Date(order.created_at).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      message += `*Data/Hora:* ${orderDate}\n\n`
      
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      message += `*ITENS DO PEDIDO:*\n`
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      
      order.order_items?.forEach((item: any, index: number) => {
        const productName = (item.product_name || "").trim()
        message += `${index + 1}. ${item.quantity}x ${productName}`
        if (item.variety_name) {
          message += ` (${item.variety_name.trim()})`
        }
        message += `\n   R$ ${(item.product_price * item.quantity).toFixed(2)}\n`
        
        if (item.order_item_extras && item.order_item_extras.length > 0) {
          message += `   Extras:\n`
          item.order_item_extras.forEach((extra: any) => {
            const extraName = (extra.extra_name || "").trim()
            message += `   • ${extraName}${extra.quantity > 1 ? ` (x${extra.quantity})` : ""} - R$ ${(extra.extra_price * extra.quantity).toFixed(2)}\n`
          })
        }
        message += `\n`
      })
      
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      message += `*RESUMO FINANCEIRO:*\n`
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      
      const subtotal = order.total - (order.delivery_fee || 0)
      message += `Subtotal: R$ ${subtotal.toFixed(2)}\n`
      if (order.delivery_fee && order.delivery_fee > 0) {
        message += `Taxa de entrega: R$ ${order.delivery_fee.toFixed(2)}\n`
      }
      message += `\n*TOTAL: R$ ${order.total.toFixed(2)}*\n\n`
      
      if (pixKey) {
        message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
        message += `*FORMA DE PAGAMENTO:*\n`
        message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
        message += `*PIX*\n`
        message += `Chave PIX: ${pixKey}\n`
        message += `Valor: R$ ${order.total.toFixed(2)}\n\n`
      }
      
      if (order.notes) {
        message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
        message += `*OBSERVAÇÕES:*\n`
        message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
        message += `${(order.notes || "").trim()}\n\n`
      }
      
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      message += `Obrigado pela preferência!\n`
      message += `*${restaurantName}*\n`
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      
      // Usar a função utilitária para abrir WhatsApp de forma otimizada para todos os dispositivos
      openWhatsApp(whatsapp, message, {
        openInNewTab: false, // Em mobile, abre diretamente no app; em desktop, abre na mesma aba
        fallbackToWeb: true // Se falhar, tenta abrir WhatsApp Web
      })
    } catch (error) {
      console.error("Erro ao enviar para WhatsApp:", error)
      alert("Erro ao abrir WhatsApp. Tente novamente.")
    }
  }

  // Se o modal de sucesso estiver aberto, não renderizar o carrinho
  if (showSuccessModal) {
    return (
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-white border-slate-200 w-[95vw] sm:w-full max-w-md p-0 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
          <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-6 sm:p-8 text-center relative overflow-hidden">
            {/* Efeito de brilho animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_3s_infinite] -skew-x-12" />
            
            <div className="relative z-10">
              {/* Ícone de sucesso animado */}
              <div className="mx-auto mb-4 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-500">
                <CheckCircle className="h-12 w-12 sm:h-14 sm:w-14 text-white animate-in scale-in duration-700 delay-200" />
              </div>
              
              {/* Ícones decorativos */}
              <div className="absolute top-4 right-4 opacity-20">
                <Sparkles className="h-8 w-8 text-green-600 animate-pulse" />
              </div>
              <div className="absolute bottom-4 left-4 opacity-20">
                <Sparkles className="h-6 w-6 text-emerald-600 animate-pulse delay-300" />
              </div>

              <DialogTitle className="text-2xl sm:text-3xl font-bold text-green-900 mb-2 animate-in slide-in-from-bottom duration-500 delay-100">
                Pedido Enviado!
              </DialogTitle>
              <div className="text-base sm:text-lg text-green-800 animate-in slide-in-from-bottom duration-500 delay-200">
                {orderTypeMessage === "delivery" ? (
                  <>
                    <div className="font-semibold mb-2">🍕 Seu pedido de delivery foi enviado com sucesso!</div>
                    <div className="text-sm text-green-700">
                      Aguarde a confirmação. Entraremos em contato em breve!
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold mb-2">🍽️ Seu pedido foi enviado com sucesso!</div>
                    <div className="text-sm text-green-700">
                      Aguarde a confirmação. Seu pedido será preparado em breve!
                    </div>
                  </>
                )}
              </div>
              <DialogDescription className="sr-only">
                Pedido enviado com sucesso. Aguarde a confirmação.
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-4 bg-white">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-700 text-center">
                <span className="font-semibold text-slate-900">Obrigado pela preferência!</span>
                <br />
                <span className="text-slate-600">Seu pedido está sendo processado.</span>
              </p>
            </div>

            {whatsapp && whatsapp.trim() !== "" && (
              <Button
                onClick={handleSendToWhatsApp}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold py-6 text-base sm:text-lg flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Enviar para WhatsApp
              </Button>
            )}

            <Button
              onClick={() => {
                setShowSuccessModal(false)
                onClose() // Fechar o carrinho também
                // Navegar sem recarregar a página
                router.push("/")
              }}
              className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold py-6 text-base sm:text-lg"
            >
              Continuar Navegando
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
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
              {orderType === "delivery" && (
                <div className="bg-gradient-to-br from-stone-50 to-stone-100/50 p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 sm:space-y-4 animate-in slide-in-from-top duration-300">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm sm:text-base">
                    <div className="p-1.5 bg-slate-200 rounded-lg">
                      <Bike className="h-4 w-4" />
                    </div>
                    <span>Informações de Entrega</span>
                  </div>
                  
                  {shouldShowReadOnly && effectiveDeliveryInfo ? (
                    <div className="space-y-2 text-sm text-slate-800 pl-7 sm:pl-8">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />
                        <span className="font-medium truncate">{effectiveDeliveryInfo.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />
                        <span>{effectiveDeliveryInfo.customerPhone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 text-slate-600 flex-shrink-0" />
                        <span className="flex-1 break-words">{effectiveDeliveryInfo.deliveryAddress}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="cart-customer-name" className="text-slate-900 flex items-center gap-2 text-sm font-medium">
                          <User className="h-4 w-4" />
                          Nome Completo
                        </Label>
                        <Input
                          id="cart-customer-name"
                          type="text"
                          placeholder="Seu nome completo"
                          value={manualDeliveryInfo?.customerName || ""}
                          onChange={(e) => {
                            const newValue = e.target.value
                            setManualDeliveryInfo((prev) => ({
                              customerName: newValue,
                              customerPhone: prev?.customerPhone || "",
                              deliveryAddress: prev?.deliveryAddress || "",
                            }))
                          }}
                          className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 text-sm sm:text-base"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cart-customer-phone" className="text-slate-900 flex items-center gap-2 text-sm font-medium">
                          <Phone className="h-4 w-4" />
                          Telefone
                        </Label>
                        <Input
                          id="cart-customer-phone"
                          type="tel"
                          placeholder="(00) 00000-0000"
                          value={manualDeliveryInfo?.customerPhone || ""}
                          onChange={(e) => {
                            const newValue = e.target.value
                            setManualDeliveryInfo((prev) => ({
                              customerName: prev?.customerName || "",
                              customerPhone: newValue,
                              deliveryAddress: prev?.deliveryAddress || "",
                            }))
                          }}
                          className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 text-sm sm:text-base"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cart-delivery-address" className="text-slate-900 flex items-center gap-2 text-sm font-medium">
                          <MapPin className="h-4 w-4" />
                          Endereço Completo
                        </Label>
                        <Textarea
                          id="cart-delivery-address"
                          placeholder="Rua, número, bairro, cidade, CEP"
                          value={manualDeliveryInfo?.deliveryAddress || ""}
                          onChange={(e) => {
                            const newValue = e.target.value
                            setManualDeliveryInfo((prev) => ({
                              customerName: prev?.customerName || "",
                              customerPhone: prev?.customerPhone || "",
                              deliveryAddress: newValue,
                            }))
                          }}
                          className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 text-sm sm:text-base resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {cart.map((item, index) => {
                const itemKey = `${item.id}-${item.selectedVariety?.id || 'base'}-${item.selectedExtras?.map(e => `${e.extra.id}:${e.quantity}`).join(',') || 'no-extras'}`
                return (
                <div
                  key={itemKey}
                  className="group flex gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-lg hover:scale-[1.01] transition-all duration-300 hover:border-slate-400 animate-in fade-in slide-in-from-right duration-500"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-slate-900 truncate group-hover:text-slate-600 transition-colors">
                      {item.name}
                    </h3>
                    {item.selectedVariety && (
                      <p className="text-xs text-slate-600 mt-0.5">Tamanho: {item.selectedVariety.name}</p>
                    )}
                    {item.selectedExtras && item.selectedExtras.length > 0 && (
                      <div className="text-xs text-slate-600 mt-0.5 space-y-0.5">
                        {item.selectedExtras.map((extraItem) => (
                          <p key={extraItem.extra.id}>
                            {extraItem.extra.name} {extraItem.quantity > 1 && `(x${extraItem.quantity})`}
                          </p>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-slate-700 font-medium mt-1">R$ {item.finalPrice.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    <Button
                      onClick={() => onUpdateQuantity(itemKey, item.quantity - 1)}
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 sm:h-8 sm:w-8 border-slate-300 hover:bg-red-50 hover:border-red-300 transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                      <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
                    </Button>
                    <span className="w-6 sm:w-8 text-center font-bold text-sm sm:text-base text-slate-900">
                      {item.quantity}
                    </span>
                    <Button
                      onClick={() => onUpdateQuantity(itemKey, item.quantity + 1)}
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 sm:h-8 sm:w-8 border-slate-300 hover:bg-green-50 hover:border-green-300 transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
                    </Button>
                    <Button
                      onClick={() => onRemoveItem(itemKey)}
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              )})}

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
                Boolean(isSubmitting || 
                (!tableNumber && orderType === "dinein") || 
                (!effectiveDeliveryInfo && orderType === "delivery") ||
                (orderType === "delivery" && effectiveDeliveryInfo && (!effectiveDeliveryInfo.customerName || !effectiveDeliveryInfo.customerPhone || !effectiveDeliveryInfo.deliveryAddress)))
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
