
"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Minus, Plus, ShoppingBag, Bike, MapPin, Phone, User, CheckCircle, Sparkles, MessageCircle, CreditCard, Wallet, Smartphone, Store, UtensilsCrossed, Edit } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { openWhatsApp } from "@/lib/utils"
import { isRestaurantOpen } from "@/lib/utils/opening-hours"
import type { ProductVariety, ProductExtra } from "@/types/product"

type CartItem = {
  id: string
  name: string
  description?: string | null
  categoryName?: string
  price: number
  quantity: number
  finalPrice: number
  selectedVariety?: ProductVariety | null
  selectedExtras?: { extra: ProductExtra; quantity: number }[]
}

type DeliveryInfo = {
  customerName: string
  customerPhone: string
  deliveryAddress: string // Mantido para compatibilidade com endereços salvos
  // Campos separados para formulário
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zipCode?: string
  referencePoint?: string
}

type DeliveryZone = {
  id: string
  name: string
  fee: number
  active: boolean
  display_order: number
}

export function Cart({
  isOpen,
  onClose,
  cart,
  orderType,
  deliveryInfo,
  deliveryFee,
  deliveryZones = [],
  tableNumber,
  onUpdateQuantity,
  onRemoveItem,
  onEditItem,
  totalPrice,
  whatsapp,
  restaurantInfo,
}: {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  orderType: "delivery" | "pickup" | "dine-in" | null
  tableNumber?: number | null
  deliveryInfo: DeliveryInfo | null
  deliveryFee: number
  deliveryZones?: DeliveryZone[]
  onUpdateQuantity: (itemKey: string, quantity: number) => void
  onRemoveItem: (itemKey: string) => void
  onEditItem?: (itemKey: string) => void
  totalPrice: number
  whatsapp?: string | null
  restaurantInfo?: {
    name?: string
    phone?: string | null
    address?: string | null
    pix_key?: string | null
    logoUrl?: string | null
    email?: string | null
    opening_hours?: string | null
    instagram?: string | null
    facebook?: string | null
    whatsapp?: string | null
    delivery_fee?: number | null
    min_order_value?: number | null
    accepts_delivery?: boolean | null
    accepts_pickup?: boolean | null
    accepts_dine_in?: boolean | null
  } | null
}) {
  const [notes, setNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [orderTypeMessage, setOrderTypeMessage] = useState<"delivery" | "pickup" | "dine-in" | null>(null)
  const [manualDeliveryInfo, setManualDeliveryInfo] = useState<DeliveryInfo | null>(null)
  const [pickupCustomerName, setPickupCustomerName] = useState("")
  const [pickupCustomerPhone, setPickupCustomerPhone] = useState("")
  const [selectedDeliveryZoneId, setSelectedDeliveryZoneId] = useState<string>("")
  const [lastOrderId, setLastOrderId] = useState<string | null>(null)
  const router = useRouter()

  // Selecionar primeira zona por padrão quando houver zonas disponíveis
  useEffect(() => {
    if (deliveryZones.length > 0 && !selectedDeliveryZoneId) {
      setSelectedDeliveryZoneId(deliveryZones[0].id)
    }
  }, [deliveryZones, selectedDeliveryZoneId])

  // Calcular taxa de entrega baseada na zona selecionada
  const calculatedDeliveryFee = useMemo(() => {
    if (orderType !== "delivery") return 0
    if (deliveryZones.length > 0 && selectedDeliveryZoneId) {
      const selectedZone = deliveryZones.find(z => z.id === selectedDeliveryZoneId)
      return selectedZone ? selectedZone.fee : deliveryFee
    }
    return deliveryFee
  }, [orderType, deliveryZones, selectedDeliveryZoneId, deliveryFee])

  // Debug: verificar se whatsapp está sendo recebido
  useEffect(() => {
    if (showSuccessModal) {
      console.log("WhatsApp disponível:", whatsapp, "Tipo:", typeof whatsapp, "Válido:", whatsapp && whatsapp.trim() !== "")
    }
  }, [showSuccessModal, whatsapp])

  const finalTotal = totalPrice + calculatedDeliveryFee

  // Função auxiliar para montar endereço completo a partir dos campos separados
  const buildFullAddress = (info: DeliveryInfo | null): string => {
    if (!info) return ""
    
    // Se já tem deliveryAddress (endereço salvo), usar ele
    if (info.deliveryAddress?.trim()) {
      return info.deliveryAddress.trim()
    }
    
    // Caso contrário, montar a partir dos campos separados (sem cidade, estado e CEP)
    const parts: string[] = []
    if (info.street?.trim()) parts.push(info.street.trim())
    if (info.number?.trim()) parts.push(info.number.trim())
    if (info.complement?.trim()) parts.push(`- ${info.complement.trim()}`)
    if (info.neighborhood?.trim()) parts.push(info.neighborhood.trim())
    
    return parts.join(", ")
  }

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
    
    // Verificar se o estabelecimento está aberto
    if (!isRestaurantOpen(restaurantInfo?.opening_hours)) {
      alert("Desculpe, o estabelecimento está fechado no momento. Por favor, tente novamente durante o horário de funcionamento.")
      return
    }
    
    // Validação para forma de pagamento
    if (!paymentMethod || !paymentMethod.trim()) {
      alert("Por favor, selecione a forma de pagamento")
      return
    }
    
    if (orderType === "pickup") {
      // Validação para retirada no local
      if (!pickupCustomerName?.trim()) {
        alert("Por favor, preencha o nome completo")
        return
      }
      if (!pickupCustomerPhone?.trim()) {
        alert("Por favor, preencha o telefone")
        return
      }
    }

    if (orderType === "dine-in") {
      // Validação para pedido na mesa
      if (!tableNumber || tableNumber === 0) {
        alert("Número da mesa não encontrado")
        return
      }
    }

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
      
      // Validar endereço: se tem deliveryAddress (endereço salvo) ou se tem campos separados preenchidos
      const hasSavedAddress = effectiveDeliveryInfo.deliveryAddress?.trim()
      const hasSeparateFields = effectiveDeliveryInfo.street?.trim() && 
                                effectiveDeliveryInfo.number?.trim() && 
                                effectiveDeliveryInfo.neighborhood?.trim()
      
      if (!hasSavedAddress && !hasSeparateFields) {
        alert("Por favor, preencha todos os campos do endereço (rua, número e bairro)")
        return
      }
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const orderData: any = {
        order_type: orderType === "delivery" ? "delivery" : orderType === "pickup" ? "pickup" : "dine-in",
        status: "pending",
        total: finalTotal,
        notes: notes?.trim() || null,
        payment_method: paymentMethod?.trim() || null,
        table_number: orderType === "dine-in" && tableNumber ? tableNumber : 0,
      }

      if (orderType === "pickup") {
        // Pedido de retirada - precisa de nome e telefone
        if (pickupCustomerName.trim()) {
          orderData.customer_name = pickupCustomerName.trim()
        }
        if (pickupCustomerPhone.trim()) {
          orderData.customer_phone = pickupCustomerPhone.trim()
        }
        // Retirada no local sempre usa table_number 0 (não precisa de mesa)
        orderData.table_number = 0
      } else if (orderType === "dine-in") {
        // Pedido na mesa
        if (tableNumber) {
          orderData.table_number = tableNumber
        }
      } else if (orderType === "delivery") {
        // Sempre definir table_number como 0 para delivery
        orderData.table_number = 0
        if (effectiveDeliveryInfo) {
          // Garantir que os dados sejam salvos corretamente
          // Se manualDeliveryInfo foi preenchido, usar apenas ele para evitar duplicação
          const infoToSave = manualDeliveryInfo && (manualDeliveryInfo.customerName || manualDeliveryInfo.customerPhone || manualDeliveryInfo.deliveryAddress)
            ? manualDeliveryInfo
            : effectiveDeliveryInfo
          orderData.customer_name = infoToSave.customerName.trim()
          orderData.customer_phone = infoToSave.customerPhone.trim()
          // Montar endereço completo (a partir de campos separados ou usar deliveryAddress se existir)
          const fullAddress = buildFullAddress(infoToSave)
          // Remover quebras de linha e espaços extras do endereço
          orderData.delivery_address = fullAddress.replace(/\n/g, ' ').replace(/\s+/g, ' ')
          orderData.reference_point = infoToSave.referencePoint?.trim() || null
          orderData.delivery_fee = calculatedDeliveryFee || 0
          // Adicionar zone_id se uma zona foi selecionada
          if (selectedDeliveryZoneId) {
            orderData.delivery_zone_id = selectedDeliveryZoneId
          }
        }
      }

      // Inserir o pedido
      const { data: order, error: orderError } = await supabase.from("orders").insert(orderData).select().single()

      if (orderError) {
        console.error("Erro ao criar pedido:", {
          message: orderError.message,
          details: orderError.details,
          hint: orderError.hint,
          code: orderError.code,
          error: orderError
        })
        console.error("Dados do pedido:", JSON.stringify(orderData, null, 2))
        
        // Mensagens de erro mais amigáveis
        let userMessage = "Erro ao criar pedido"
        if (orderError.message?.includes("network") || orderError.message?.includes("fetch")) {
          userMessage = "Erro de conexão. Verifique sua internet e tente novamente."
        } else if (orderError.code === "PGRST301" || orderError.code === "23505") {
          userMessage = "Erro ao processar pedido. Tente novamente."
        } else if (orderError.message) {
          userMessage = orderError.message
        }
        
        alert(`${userMessage}. Tente novamente.`)
        throw orderError
      }

      // Inserir itens do pedido com variedades
      const orderItems = cart.map((item) => {
        // Incluir descrição do produto junto com o nome se existir
        const productNameWithDescription = item.description 
          ? `${item.name} - ${item.description}`
          : item.name
        
        return {
          order_id: order.id,
          product_id: item.id,
          product_name: productNameWithDescription,
          category_name: item.categoryName || null,
          product_price: item.selectedVariety ? item.selectedVariety.price : item.price,
          quantity: item.quantity,
          subtotal: item.finalPrice * item.quantity,
          variety_id: item.selectedVariety?.id || null,
          variety_name: item.selectedVariety?.name || null,
          variety_price: item.selectedVariety?.price || null,
        }
      })

      // Inserir itens do pedido
      const { data: insertedItems, error: itemsError } = await supabase.from("order_items").insert(orderItems).select()

      if (itemsError) {
        console.error("Erro ao inserir itens:", itemsError)
        throw new Error(itemsError.message || "Erro ao salvar itens do pedido")
      }

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
          // Inserir extras do pedido
          const { error: extrasError } = await supabase.from("order_item_extras").insert(extrasToInsert)
          
          if (extrasError) {
            console.error("Erro ao inserir extras:", extrasError)
            throw new Error(extrasError.message || "Erro ao salvar extras do pedido")
          }
        }
      }

      // Salvar ID do pedido para usar no WhatsApp
      setLastOrderId(order.id)
      
      // Mostrar modal de sucesso (não fechar o carrinho ainda)
      setOrderTypeMessage(orderType)
      setShowSuccessModal(true)
      // Não chamar onClose() aqui - deixar o modal controlar
      router.refresh()
    } catch (error: any) {
      console.error("Error submitting order:", error)
      
      // Detectar tipo de erro e fornecer mensagem apropriada
      let errorMessage = "Erro desconhecido ao enviar pedido"
      
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.details) {
        errorMessage = error.details
      } else if (error?.hint) {
        errorMessage = error.hint
      } else if (error instanceof TypeError && error.message?.includes("Load failed")) {
        errorMessage = "Erro de conexão. Verifique sua internet e tente novamente."
      } else if (error instanceof TypeError && error.message?.includes("fetch")) {
        errorMessage = "Erro de conexão com o servidor. Tente novamente."
      } else if (error?.code) {
        // Códigos de erro comuns do Supabase
        switch (error.code) {
          case "PGRST301":
            errorMessage = "Erro ao processar pedido. Tente novamente."
            break
          case "23505":
            errorMessage = "Erro ao processar pedido. Tente novamente."
            break
          case "PGRST116":
            errorMessage = "Dados não encontrados. Tente novamente."
            break
          default:
            errorMessage = error.message || `Erro ${error.code}`
        }
      }
      
      console.error("Detalhes do erro:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        name: error?.name,
        stack: error?.stack,
        error: error
      })
      
      alert(`Erro ao enviar pedido: ${errorMessage}. Tente novamente.`)
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
      const restaurantName = (restaurantInfo?.name || "Restaurante")?.trim() || "Restaurante"
      const restaurantPhone = (restaurantInfo?.phone || "")?.trim() || ""
      const restaurantAddress = (restaurantInfo?.address || "")?.trim() || ""
      const pixKey = (restaurantInfo?.pix_key || "")?.trim() || ""
      
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
        message += `Endereço: ${(order.delivery_address || "N/A").trim()}\n`
        if (order.reference_point) {
          message += `Ponto de Referência: ${order.reference_point.trim()}\n`
        }
        message += `\n`
      } else if (order.order_type === "pickup") {
        message += `*TIPO:* RETIRADA NO LOCAL\n\n`
        message += `*DADOS DO CLIENTE:*\n`
        message += `Nome: ${(order.customer_name || "N/A").trim()}\n`
        message += `Telefone: ${(order.customer_phone || "N/A").trim()}\n`
        message += `\n`
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
      
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
      message += `*FORMA DE PAGAMENTO:*\n`
      message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
      message += `*${order.payment_method || "Não informado"}*\n\n`
      
      if (order.payment_method === "PIX" && pixKey) {
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
        <div className="relative flex items-center justify-between p-5 sm:p-6 border-b border-slate-200/80 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 via-transparent to-slate-900/10" />
          <div className="relative flex items-center gap-3 sm:gap-4">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
              <ShoppingBag className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Seu Pedido</h2>
              <p className="text-xs sm:text-sm text-slate-200 mt-0.5">
                {cart.length} {cart.length === 1 ? "item" : "itens"}
              </p>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="relative text-white hover:bg-white/20 transition-all duration-200 hover:scale-110 rounded-lg"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {cart.length === 0 ? (
            <div className="text-center py-16 sm:py-20 text-slate-700 animate-in fade-in duration-500">
              <div className="mb-6 inline-block p-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-sm">
                <ShoppingBag className="h-16 w-16 text-slate-400" />
              </div>
              <p className="text-xl sm:text-2xl font-semibold text-slate-800 mb-2">Seu carrinho está vazio</p>
              <p className="text-sm sm:text-base text-slate-600">Adicione itens do cardápio para começar</p>
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

                  {deliveryZones.length > 1 && (
                    <div className="space-y-2">
                      <Label htmlFor="delivery-zone" className="text-slate-900 flex items-center gap-2 text-sm font-medium">
                        <MapPin className="h-4 w-4" />
                        Zona de Entrega
                      </Label>
                      <Select value={selectedDeliveryZoneId} onValueChange={setSelectedDeliveryZoneId}>
                        <SelectTrigger id="delivery-zone" className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 text-sm sm:text-base">
                          <SelectValue placeholder="Selecione a zona" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryZones.map((zone) => (
                            <SelectItem key={zone.id} value={zone.id}>
                              {zone.name} - R$ {zone.fee.toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
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
                        <span className="flex-1 break-words">{buildFullAddress(effectiveDeliveryInfo)}</span>
                      </div>
                      {effectiveDeliveryInfo.referencePoint && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 mt-0.5 text-slate-600 flex-shrink-0" />
                          <span className="flex-1 break-words">
                            <span className="font-medium">Ponto de Referência: </span>
                            {effectiveDeliveryInfo.referencePoint}
                          </span>
                        </div>
                      )}
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
                              referencePoint: prev?.referencePoint || "",
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
                              referencePoint: prev?.referencePoint || "",
                            }))
                          }}
                          className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 text-sm sm:text-base"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="text-slate-900 flex items-center gap-2 text-sm font-medium">
                          <MapPin className="h-4 w-4" />
                          Endereço de Entrega
                        </Label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          <div className="sm:col-span-2">
                            <Label htmlFor="cart-street" className="text-xs text-slate-700">
                              Rua <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="cart-street"
                              type="text"
                              placeholder="Nome da rua"
                              value={manualDeliveryInfo?.street || ""}
                              onChange={(e) => {
                                setManualDeliveryInfo((prev) => ({
                                  customerName: prev?.customerName || "",
                                  customerPhone: prev?.customerPhone || "",
                                  deliveryAddress: prev?.deliveryAddress || "",
                                  street: e.target.value,
                                  number: prev?.number || "",
                                  complement: prev?.complement || "",
                                  neighborhood: prev?.neighborhood || "",
                                  referencePoint: prev?.referencePoint || "",
                                }))
                              }}
                              className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 text-sm sm:text-base"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="cart-number" className="text-xs text-slate-700">
                              Número <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="cart-number"
                              type="text"
                              placeholder="123"
                              value={manualDeliveryInfo?.number || ""}
                              onChange={(e) => {
                                setManualDeliveryInfo((prev) => ({
                                  customerName: prev?.customerName || "",
                                  customerPhone: prev?.customerPhone || "",
                                  deliveryAddress: prev?.deliveryAddress || "",
                                  street: prev?.street || "",
                                  number: e.target.value,
                                  complement: prev?.complement || "",
                                  neighborhood: prev?.neighborhood || "",
                                  referencePoint: prev?.referencePoint || "",
                                }))
                              }}
                              className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 text-sm sm:text-base"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="cart-complement" className="text-xs text-slate-700">
                              Complemento
                            </Label>
                            <Input
                              id="cart-complement"
                              type="text"
                              placeholder="Apto, bloco, etc."
                              value={manualDeliveryInfo?.complement || ""}
                              onChange={(e) => {
                                setManualDeliveryInfo((prev) => ({
                                  customerName: prev?.customerName || "",
                                  customerPhone: prev?.customerPhone || "",
                                  deliveryAddress: prev?.deliveryAddress || "",
                                  street: prev?.street || "",
                                  number: prev?.number || "",
                                  complement: e.target.value,
                                  neighborhood: prev?.neighborhood || "",
                                  referencePoint: prev?.referencePoint || "",
                                }))
                              }}
                              className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 text-sm sm:text-base"
                            />
                          </div>
                          
                          <div className="sm:col-span-2">
                            <Label htmlFor="cart-neighborhood" className="text-xs text-slate-700">
                              Bairro <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="cart-neighborhood"
                              type="text"
                              placeholder="Nome do bairro"
                              value={manualDeliveryInfo?.neighborhood || ""}
                              onChange={(e) => {
                                setManualDeliveryInfo((prev) => ({
                                  customerName: prev?.customerName || "",
                                  customerPhone: prev?.customerPhone || "",
                                  deliveryAddress: prev?.deliveryAddress || "",
                                  street: prev?.street || "",
                                  number: prev?.number || "",
                                  complement: prev?.complement || "",
                                  neighborhood: e.target.value,
                                  referencePoint: prev?.referencePoint || "",
                                }))
                              }}
                              className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 text-sm sm:text-base"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="cart-reference-point" className="text-slate-900 flex items-center gap-2 text-sm font-medium">
                            <MapPin className="h-4 w-4" />
                            Ponto de Referência (opcional)
                          </Label>
                          <Input
                            id="cart-reference-point"
                            type="text"
                            placeholder="Ex: Próximo ao mercado, em frente à farmácia, etc."
                            value={manualDeliveryInfo?.referencePoint || ""}
                            onChange={(e) => {
                              setManualDeliveryInfo((prev) => ({
                                customerName: prev?.customerName || "",
                                customerPhone: prev?.customerPhone || "",
                                deliveryAddress: prev?.deliveryAddress || "",
                                street: prev?.street || "",
                                number: prev?.number || "",
                                complement: prev?.complement || "",
                                neighborhood: prev?.neighborhood || "",
                                referencePoint: e.target.value,
                              }))
                            }}
                            className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 text-sm sm:text-base"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {orderType === "pickup" && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-3 sm:p-4 rounded-xl border border-blue-200 shadow-sm space-y-3 sm:space-y-4 animate-in slide-in-from-top duration-300">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm sm:text-base">
                    <div className="p-1.5 bg-blue-200 rounded-lg">
                      <Store className="h-4 w-4" />
                    </div>
                    <span>Informações para Retirada</span>
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="cart-pickup-name" className="text-slate-900 flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4" />
                        Nome Completo <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="cart-pickup-name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={pickupCustomerName}
                        onChange={(e) => setPickupCustomerName(e.target.value)}
                        className="border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-sm sm:text-base"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="cart-pickup-phone" className="text-slate-900 flex items-center gap-2 text-sm font-medium">
                        <Phone className="h-4 w-4" />
                        Telefone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="cart-pickup-phone"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        value={pickupCustomerPhone}
                        onChange={(e) => setPickupCustomerPhone(e.target.value)}
                        className="border-slate-200 focus:border-blue-400 focus:ring-blue-400 text-sm sm:text-base"
                        required
                      />
                      <p className="text-xs text-slate-600">Usaremos seu telefone para avisar quando o pedido estiver pronto</p>
                    </div>
                  </div>
                </div>
              )}

              {orderType === "dine-in" && tableNumber && (
                <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-3 sm:p-4 rounded-xl border border-green-200 shadow-sm space-y-3 sm:space-y-4 animate-in slide-in-from-top duration-300">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm sm:text-base">
                    <div className="p-1.5 bg-green-200 rounded-lg">
                      <UtensilsCrossed className="h-4 w-4" />
                    </div>
                    <span>Pedido na Mesa</span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-slate-800">
                      <span className="font-semibold">Mesa {tableNumber}</span>
                    </p>
                    <p className="text-xs text-slate-600">Seu pedido será enviado para a cozinha e preparado para esta mesa.</p>
                  </div>
                </div>
              )}

              {cart.map((item, index) => {
                const itemKey = `${item.id}-${item.selectedVariety?.id || 'base'}-${item.selectedExtras?.map(e => `${e.extra.id}:${e.quantity}`).join(',') || 'no-extras'}`
                return (
                <div
                  key={itemKey}
                  className="group flex gap-3 sm:gap-4 p-4 sm:p-5 bg-gradient-to-br from-white to-slate-50/50 rounded-2xl border border-slate-200 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300 hover:border-slate-300 animate-in fade-in slide-in-from-right duration-500"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate group-hover:text-slate-700 transition-colors">
                      {item.name}
                    </h3>
                    {item.selectedVariety && (
                      <p className="text-xs text-slate-600 mt-1 font-medium">Tamanho: {item.selectedVariety.name}</p>
                    )}
                    {item.selectedExtras && item.selectedExtras.length > 0 && (
                      <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                        {item.selectedExtras.map((extraItem) => (
                          <p key={extraItem.extra.id} className="font-medium">
                            {extraItem.extra.name} {extraItem.quantity > 1 && `(x${extraItem.quantity})`}
                          </p>
                        ))}
                      </div>
                    )}
                    <p className="text-base sm:text-lg text-slate-800 font-bold mt-2">R$ {item.finalPrice.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                    {onEditItem && (
                      <Button
                        onClick={() => onEditItem(itemKey)}
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 sm:h-8 sm:w-8 border-slate-300 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 hover:scale-110 active:scale-95"
                        title="Editar item"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4 text-slate-600" />
                      </Button>
                    )}
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

              <div className="pt-2 animate-in fade-in duration-500 delay-200">
                <label className="block text-sm font-semibold text-slate-900 mb-3">
                  Forma de Pagamento <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("PIX")}
                    className={`flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                      paymentMethod === "PIX"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <Smartphone className={`h-5 w-5 sm:h-6 sm:w-6 ${paymentMethod === "PIX" ? "text-green-600" : "text-slate-500"}`} />
                    <span className="text-xs sm:text-sm font-medium">PIX</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Dinheiro")}
                    className={`flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                      paymentMethod === "Dinheiro"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <Wallet className={`h-5 w-5 sm:h-6 sm:w-6 ${paymentMethod === "Dinheiro" ? "text-green-600" : "text-slate-500"}`} />
                    <span className="text-xs sm:text-sm font-medium">Dinheiro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Cartão de Débito")}
                    className={`flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                      paymentMethod === "Cartão de Débito"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <CreditCard className={`h-5 w-5 sm:h-6 sm:w-6 ${paymentMethod === "Cartão de Débito" ? "text-green-600" : "text-slate-500"}`} />
                    <span className="text-xs sm:text-sm font-medium">Débito</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Cartão de Crédito")}
                    className={`flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 ${
                      paymentMethod === "Cartão de Crédito"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <CreditCard className={`h-5 w-5 sm:h-6 sm:w-6 ${paymentMethod === "Cartão de Crédito" ? "text-green-600" : "text-slate-500"}`} />
                    <span className="text-xs sm:text-sm font-medium">Crédito</span>
                  </button>
                </div>
              </div>

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
          <div className="border-t border-slate-200/80 p-5 sm:p-6 space-y-4 sm:space-y-5 bg-gradient-to-br from-slate-50 via-white to-slate-50 shadow-2xl">
            {!isRestaurantOpen(restaurantInfo?.opening_hours) && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-sm">
                <p className="text-sm sm:text-base text-red-800 font-semibold text-center">
                  ⚠️ O estabelecimento está fechado no momento. Não é possível realizar pedidos fora do horário de funcionamento.
                </p>
              </div>
            )}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center text-sm sm:text-base text-slate-800">
                <span className="font-semibold">Subtotal:</span>
                <span className="font-bold text-slate-900">R$ {totalPrice.toFixed(2)}</span>
              </div>
              {orderType === "delivery" && calculatedDeliveryFee > 0 && (
                <div className="flex justify-between items-center text-sm sm:text-base text-slate-800">
                  <span className="flex items-center gap-2 font-semibold">
                    <Bike className="h-4 w-4 text-slate-600" />
                    Taxa de entrega:
                    {deliveryZones.length > 1 && selectedDeliveryZoneId && (
                      <span className="text-xs text-slate-600 ml-1 font-normal">
                        ({deliveryZones.find(z => z.id === selectedDeliveryZoneId)?.name || ""})
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-slate-900">R$ {calculatedDeliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 sm:pt-4 border-t-2 border-slate-300">
                <span className="text-lg sm:text-xl font-bold text-slate-900">Total:</span>
                <span className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-clip-text text-transparent">
                  R$ {finalTotal.toFixed(2)}
                </span>
              </div>
            </div>
            <Button
              onClick={handleSubmitOrder}
              disabled={
                Boolean(isSubmitting || 
                !isRestaurantOpen(restaurantInfo?.opening_hours) ||
                (!paymentMethod || !paymentMethod.trim()) ||
                (orderType === "delivery" && (!effectiveDeliveryInfo || !effectiveDeliveryInfo.customerName || !effectiveDeliveryInfo.customerPhone || (!buildFullAddress(effectiveDeliveryInfo)?.trim()))) ||
                (orderType === "pickup" && (!pickupCustomerName?.trim() || !pickupCustomerPhone?.trim())) ||
                (orderType === "dine-in" && (!tableNumber || tableNumber === 0)))
              }
              className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-800 hover:to-slate-700 text-white text-base sm:text-lg py-6 sm:py-7 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-bold"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-3">
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
