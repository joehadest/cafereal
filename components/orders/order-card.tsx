"use client"

import React from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Clock, ChevronRight, Bike, MapPin, Phone, User, UtensilsCrossed, Trash2, Printer, FileText, ChefHat, Receipt } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createRoot } from "react-dom/client"
import type { Order } from "@/types/order"
import { PrintOrderReceipt } from "./print-order-receipt"
import { PrintKitchenTicket } from "./print-kitchen-ticket"
import { PrintCustomerTicket } from "./print-customer-ticket"

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

function OrderCardComponent({
  order,
  restaurantInfo,
}: { order: Order; restaurantInfo?: { name: string; phone?: string; address?: string; cnpj?: string } }) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [printDialogOpen, setPrintDialogOpen] = useState(false)
  const [printType, setPrintType] = useState<"receipt" | "kitchen" | "customer">("receipt")
  const config = statusConfig[order.status as keyof typeof statusConfig]

  const isDelivery = order.order_type === "delivery"

  const handleUpdateStatus = async () => {
    if (!config) return
    
    setIsUpdating(true)
    const supabase = createClient()

    try {
      const nextStatus =
        typeof config.nextStatus === "function" ? config.nextStatus(order.order_type) : config.nextStatus

      const { error } = await supabase.from("orders").update({ status: nextStatus }).eq("id", order.id)

      if (error) throw error

      try {
        router.refresh()
      } catch (error) {
        console.warn("Erro ao atualizar após mudar status:", error)
      }
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

    console.log("Iniciando deleção do pedido:", order.id)
    setIsDeleting(true)
    const supabase = createClient()

    try {
      // Primeiro, deletar os extras dos itens (se houver)
      if (order.order_items && order.order_items.length > 0) {
        const itemIds = order.order_items.map((item) => item.id)
        console.log("Deletando extras dos itens:", itemIds)
        if (itemIds.length > 0) {
          const { error: extrasError, data: extrasData } = await supabase
            .from("order_item_extras")
            .delete()
            .in("order_item_id", itemIds)
            .select()
          
          console.log("Resultado da deleção de extras:", { extrasError, extrasData })
          if (extrasError) {
            console.warn("Erro ao deletar extras (pode não existir):", extrasError)
            // Continuar mesmo se houver erro, pois pode não haver extras
          }
        }
      }

      // Depois, deletar os itens do pedido
      console.log("Deletando itens do pedido:", order.id)
      const { error: itemsError, data: itemsData } = await supabase
        .from("order_items")
        .delete()
        .eq("order_id", order.id)
        .select()
      
      console.log("Resultado da deleção de itens:", { itemsError, itemsData })
      if (itemsError) {
        console.error("Erro ao deletar itens:", itemsError)
        throw itemsError
      }

      // Por fim, deletar o pedido
      console.log("Deletando pedido:", order.id)
      const { error: orderError, data: orderData } = await supabase
        .from("orders")
        .delete()
        .eq("id", order.id)
        .select()
      
      console.log("Resultado da deleção do pedido:", { orderError, orderData })
      if (orderError) {
        console.error("Erro ao deletar pedido:", orderError)
        throw orderError
      }

      console.log("Pedido deletado com sucesso! Atualizando página...")
      // Disparar evento customizado para remover o pedido da lista imediatamente
      window.dispatchEvent(new CustomEvent("order-deleted", { detail: { orderId: order.id } }))
      
      // Forçar atualização completa da página após um pequeno delay
      setTimeout(() => {
        try {
          router.refresh()
        } catch (error) {
          console.warn("Erro ao atualizar após deletar pedido:", error)
        }
      }, 100)
    } catch (error) {
      console.error("Error deleting order:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      alert(`Erro ao excluir pedido: ${errorMessage}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePrint = () => {
    // Verificar se o pedido tem dados
    if (!order || !order.order_items || order.order_items.length === 0) {
      alert("Erro: Pedido sem itens para imprimir")
      return
    }

    console.log("Imprimindo pedido:", order)
    console.log("Tipo de impressão:", printType)
    console.log("Restaurante info:", restaurantInfo)

    // Criar elemento temporário para impressão
    const printContainer = document.createElement("div")
    printContainer.className = "print-container"
    printContainer.style.position = "absolute"
    printContainer.style.left = "-9999px"
    printContainer.style.top = "0"
    printContainer.style.width = "80mm"
    printContainer.id = `print-container-${order.id}`

    document.body.appendChild(printContainer)

    // Renderizar o pedido usando React
    const root = createRoot(printContainer)

    root.render(
      <div id={`print-wrapper-${order.id}`} style={{ width: "80mm", display: "block", visibility: "visible" }}>
        {printType === "kitchen" ? (
          <div className="print-kitchen" style={{ display: "block", visibility: "visible", position: "relative" }}>
            <PrintKitchenTicket order={order} restaurantName={restaurantInfo?.name} />
          </div>
        ) : printType === "customer" ? (
          <div className="print-customer" style={{ display: "block", visibility: "visible", position: "relative" }}>
            <PrintCustomerTicket order={order} restaurantInfo={restaurantInfo} />
          </div>
        ) : (
          <div className="print-receipt" style={{ display: "block", visibility: "visible", position: "relative" }}>
            <PrintOrderReceipt order={order} restaurantInfo={restaurantInfo} />
          </div>
        )}
      </div>
    )

    // Adicionar estilos de impressão temporários
    const style = document.createElement("style")
    style.id = `print-styles-${order.id}`
    style.innerHTML = `
      /* Forçar visibilidade antes da impressão */
      #print-container-${order.id} .hidden {
        display: block !important;
        visibility: visible !important;
      }
      #print-container-${order.id} .print-receipt,
      #print-container-${order.id} .print-kitchen,
      #print-container-${order.id} .print-customer {
        display: block !important;
        visibility: visible !important;
      }
      #print-container-${order.id} * {
        visibility: visible !important;
      }
      @media print {
        /* Ocultar tudo do body */
        body * { 
          visibility: hidden !important; 
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
        /* Tornar visível apenas o container de impressão e seu conteúdo */
        #print-container-${order.id} { 
          position: relative !important; 
          left: auto !important; 
          top: auto !important; 
          width: 80mm !important;
          max-width: 80mm !important;
          margin: 0 auto !important;
          padding: 0 !important;
          visibility: visible !important;
          display: block !important;
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
          page-break-before: avoid !important;
          break-inside: avoid !important;
          break-after: avoid !important;
          break-before: avoid !important;
        }
        #print-container-${order.id} *, 
        #print-container-${order.id} .print-kitchen,
        #print-container-${order.id} .print-kitchen *,
        #print-container-${order.id} .print-receipt,
        #print-container-${order.id} .print-receipt *,
        #print-container-${order.id} .print-customer,
        #print-container-${order.id} .print-customer *,
        #print-container-${order.id} .hidden { 
          visibility: visible !important; 
          display: block !important;
        }
        #print-container-${order.id} .print-receipt,
        #print-container-${order.id} .print-kitchen,
        #print-container-${order.id} .print-customer {
          position: relative !important;
          left: auto !important;
          top: auto !important;
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
          page-break-before: avoid !important;
          break-inside: avoid !important;
          break-after: avoid !important;
          break-before: avoid !important;
          max-height: 100vh !important;
          height: auto !important;
          display: block !important;
          visibility: visible !important;
        }
        @page {
          size: 80mm auto !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        /* Ocultar qualquer elemento fora do container de impressão */
        body > *:not(#print-container-${order.id}) {
          display: none !important;
          visibility: hidden !important;
        }
      }
    `
    document.head.appendChild(style)

    // Fechar o diálogo
    setPrintDialogOpen(false)

    // Aguardar um pouco para garantir que o React renderizou tudo
    setTimeout(() => {
      // Mover o container para a posição correta antes de imprimir
      printContainer.style.position = "relative"
      printContainer.style.left = "auto"
      printContainer.style.top = "auto"
      printContainer.style.visibility = "visible"
      
      // Forçar visibilidade de todos os elementos e remover classe hidden
      const allElements = printContainer.querySelectorAll("*")
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement
        htmlEl.style.visibility = "visible"
        htmlEl.style.display = htmlEl.style.display || "block"
        if (htmlEl.classList.contains("hidden")) {
          htmlEl.classList.remove("hidden")
        }
        // Garantir que elementos com print:block sejam visíveis
        if (htmlEl.classList.contains("print-receipt") || htmlEl.classList.contains("print-kitchen") || htmlEl.classList.contains("print-customer")) {
          htmlEl.style.display = "block"
          htmlEl.style.visibility = "visible"
        }
      })

      // Aguardar mais um pouco para garantir que os estilos foram aplicados
      setTimeout(() => {
        try {
          window.print()
        } catch (printError) {
          console.warn("Erro ao imprimir:", printError)
          // Limpar mesmo se houver erro
          root.unmount()
          if (document.body.contains(printContainer)) {
            document.body.removeChild(printContainer)
          }
          const styleElement = document.getElementById(`print-styles-${order.id}`)
          if (styleElement) {
            document.head.removeChild(styleElement)
          }
          return
        }

        // Limpar após impressão
        setTimeout(() => {
          try {
            root.unmount()
            if (document.body.contains(printContainer)) {
              document.body.removeChild(printContainer)
            }
            const styleElement = document.getElementById(`print-styles-${order.id}`)
            if (styleElement) {
              document.head.removeChild(styleElement)
            }
          } catch (cleanupError) {
            console.warn("Erro ao limpar após impressão:", cleanupError)
          }
        }, 1000)
      }, 100)
    }, 300)
  }

  const timeAgo = new Date(order.created_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const nextLabel = config ? (typeof config.nextLabel === "function" ? config.nextLabel(order.order_type) : config.nextLabel) : "Sem ação"
  const statusLabel = config?.label || order.status
  const statusColor = config?.color || "bg-gray-500"

  return (
    <>
      <Card className="border-slate-200 hover:shadow-md hover:border-slate-400 transition-shadow">
        <CardHeader className="pb-3 p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {isDelivery ? (
                <div className="flex items-center gap-2">
                  <Bike className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                  <span className="text-lg sm:text-xl font-bold text-slate-900">Delivery</span>
                </div>
              ) : order.table_number === 0 ? (
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                  <span className="text-lg sm:text-xl font-bold text-slate-900">Balcão</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                  <span className="text-lg sm:text-xl font-bold text-slate-900">Mesa {order.table_number}</span>
                </div>
              )}
              <Badge className={`${statusColor} text-white border-0 text-xs`}>
                {statusLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-700">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{timeAgo}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Dialog open={printDialogOpen} onOpenChange={setPrintDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 sm:h-10 sm:w-10 border-blue-300 text-blue-600 hover:bg-blue-50 bg-transparent"
                      title="Imprimir pedido"
                    >
                      <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md mx-4">
                    <DialogHeader>
                      <DialogTitle className="text-lg sm:text-xl">Imprimir Pedido</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <RadioGroup value={printType} onValueChange={(value) => setPrintType(value as "receipt" | "kitchen" | "customer")}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="receipt" id="receipt" />
                          <Label htmlFor="receipt" className="flex items-center gap-2 cursor-pointer text-sm sm:text-base">
                            <FileText className="h-4 w-4" />
                            Recibo Completo
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="kitchen" id="kitchen" />
                          <Label htmlFor="kitchen" className="flex items-center gap-2 cursor-pointer text-sm sm:text-base">
                            <ChefHat className="h-4 w-4" />
                            Comanda de Cozinha
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="customer" id="customer" />
                          <Label htmlFor="customer" className="flex items-center gap-2 cursor-pointer text-sm sm:text-base">
                            <Receipt className="h-4 w-4" />
                            Comanda do Cliente {!isDelivery && (order.table_number === 0 ? "(Balcão)" : `(Mesa ${order.table_number})`)}
                          </Label>
                        </div>
                      </RadioGroup>
                      <Button onClick={handlePrint} className="w-full bg-blue-600 hover:bg-blue-700 text-sm sm:text-base">
                        <Printer className="h-4 w-4 mr-2" />
                        Imprimir
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  onClick={handleDeleteOrder}
                  disabled={isDeleting}
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 sm:h-10 sm:w-10 border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                  title="Excluir pedido"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 p-3 sm:p-6">
          {isDelivery && (order.customer_name || order.customer_phone || order.delivery_address) && (
            <div className="bg-slate-50 p-2 sm:p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs sm:text-sm hover:bg-slate-100 transition-colors">
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
            {order.order_items.map((item, index) => (
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
              <span className="text-lg sm:text-xl font-bold text-slate-600 hover:scale-110 transition-transform duration-300 inline-block">
                R$ {order.total.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>

        {config && (
          <CardFooter className="p-3 sm:p-6 pt-0">
            <Button
              onClick={handleUpdateStatus}
              disabled={isUpdating}
              className={`w-full bg-slate-600 hover:bg-slate-700 hover:shadow-lg transition-all duration-300 text-sm sm:text-base ${
                isUpdating ? "animate-pulse" : "hover:scale-105"
              }`}
            >
              {isUpdating ? "Atualizando..." : nextLabel}
              <ChevronRight
                className={`h-3 w-3 sm:h-4 sm:w-4 ml-2 ${isUpdating ? "" : "group-hover:translate-x-1 transition-transform"}`}
              />
            </Button>
          </CardFooter>
        )}
      </Card>
    </>
  )
}

// Memoizar o componente para evitar re-renders desnecessários
// Só re-renderiza se o pedido realmente mudou
export const OrderCard = React.memo(OrderCardComponent, (prevProps, nextProps) => {
  // Comparação customizada: retorna true se os props são iguais (não re-renderizar)
  // Retorna false se os props são diferentes (re-renderizar)
  const isEqual = 
    prevProps.order.id === nextProps.order.id &&
    prevProps.order.status === nextProps.order.status &&
    prevProps.order.total === nextProps.order.total &&
    prevProps.order.order_items?.length === nextProps.order.order_items?.length &&
    JSON.stringify(prevProps.restaurantInfo) === JSON.stringify(nextProps.restaurantInfo)
  
  return isEqual
})
