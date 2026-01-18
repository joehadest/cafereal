"use client"

import { createRoot } from "react-dom/client"
import { PrintKitchenTicket } from "./print-kitchen-ticket"
import { PrintCustomerTicket } from "./print-customer-ticket"
import { PrintOrderReceipt } from "./print-order-receipt"
import { quickPrint } from "@/lib/print-utils"
import type { Order } from "@/types/order"

type PrintType = "kitchen" | "customer" | "receipt" | "none"

interface AutoPrintSettings {
  enabled: boolean
  printType: PrintType
  printOnNewOrder: boolean
  printOnStatusChange: boolean
}

export async function autoPrintOrder(
  order: Order,
  printType: PrintType,
  restaurantInfo?: {
    name?: string
    phone?: string
    address?: string
    cnpj?: string
    logo_url?: string
    opening_hours?: string
    instagram?: string
    facebook?: string
    whatsapp?: string
  },
  newItemIds?: Set<string>
) {
  // Verificar se o pedido tem dados
  if (!order || !order.order_items || order.order_items.length === 0) {
    console.warn("Pedido sem itens para imprimir:", order.id)
    return
  }

  // Buscar nome da zona de entrega se houver
  let deliveryZoneName: string | undefined = undefined
  if (order.delivery_zone_id) {
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data: zone } = await supabase
        .from("delivery_zones")
        .select("name")
        .eq("id", order.delivery_zone_id)
        .single()
      if (zone) {
        deliveryZoneName = zone.name
      }
    } catch (error) {
      console.error("Erro ao buscar zona de entrega:", error)
    }
  }

  // Criar elemento temporário para impressão
  const printContainer = document.createElement("div")
  printContainer.className = "print-container"
  printContainer.style.position = "absolute"
  printContainer.style.left = "-9999px"
  printContainer.style.top = "0"
  printContainer.style.width = "100%"
  printContainer.id = `auto-print-container-${order.id}`

  document.body.appendChild(printContainer)

  // Renderizar o pedido usando React
  const root = createRoot(printContainer)

  root.render(
    <div id={`auto-print-wrapper-${order.id}`} style={{ width: "100%", display: "block", visibility: "visible" }}>
      {printType === "kitchen" ? (
        <div className="print-kitchen" style={{ display: "block", visibility: "visible", position: "relative" }}>
          <PrintKitchenTicket order={order} restaurantName={restaurantInfo?.name} deliveryZoneName={deliveryZoneName} newItemIds={newItemIds} />
        </div>
      ) : printType === "customer" ? (
        <div className="print-customer" style={{ display: "block", visibility: "visible", position: "relative" }}>
          <PrintCustomerTicket order={order} restaurantInfo={restaurantInfo} deliveryZoneName={deliveryZoneName} newItemIds={newItemIds} />
        </div>
      ) : (
        <div className="print-receipt" style={{ display: "block", visibility: "visible", position: "relative" }}>
          <PrintOrderReceipt order={order} restaurantInfo={restaurantInfo} deliveryZoneName={deliveryZoneName} newItemIds={newItemIds} />
        </div>
      )}
    </div>
  )

  // Adicionar estilos de impressão temporários
  const style = document.createElement("style")
  style.id = `auto-print-styles-${order.id}`
  style.innerHTML = `
    /* Forçar visibilidade antes da impressão */
    #auto-print-container-${order.id} .hidden {
      display: block !important;
      visibility: visible !important;
    }
    #auto-print-container-${order.id} .print-receipt,
    #auto-print-container-${order.id} .print-kitchen,
    #auto-print-container-${order.id} .print-customer {
      display: block !important;
      visibility: visible !important;
    }
    #auto-print-container-${order.id} * {
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
        width: 80mm !important;
        max-width: 80mm !important;
        min-width: 80mm !important;
      }
      /* Tornar visível apenas o container de impressão e seu conteúdo */
      #auto-print-container-${order.id} { 
        position: relative !important; 
        left: 0 !important; 
        top: 0 !important; 
        width: 80mm !important;
        max-width: 80mm !important;
        min-width: 80mm !important;
        margin: 0 !important;
        padding: 0 !important;
        visibility: visible !important;
        display: block !important;
        page-break-inside: avoid !important;
        page-break-after: avoid !important;
        page-break-before: avoid !important;
        break-inside: avoid !important;
        break-after: avoid !important;
        break-before: avoid !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
        padding-bottom: 0 !important;
        margin-bottom: 0 !important;
        box-sizing: border-box !important;
      }
      #auto-print-container-${order.id} *, 
      #auto-print-container-${order.id} .print-kitchen,
      #auto-print-container-${order.id} .print-kitchen *,
      #auto-print-container-${order.id} .print-receipt,
      #auto-print-container-${order.id} .print-receipt *,
      #auto-print-container-${order.id} .print-customer,
      #auto-print-container-${order.id} .print-customer *,
      #auto-print-container-${order.id} .hidden { 
        visibility: visible !important; 
        display: block !important;
      }
      #auto-print-container-${order.id} .print-receipt,
      #auto-print-container-${order.id} .print-kitchen,
      #auto-print-container-${order.id} .print-customer {
        position: relative !important;
        left: 0 !important;
        top: 0 !important;
        width: 80mm !important;
        max-width: 80mm !important;
        min-width: 80mm !important;
        margin: 0 !important;
        padding: 2mm 1mm !important;
        box-sizing: border-box !important;
        page-break-inside: avoid !important;
        page-break-after: avoid !important;
        page-break-before: avoid !important;
        break-inside: avoid !important;
        break-after: avoid !important;
        break-before: avoid !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
        display: block !important;
        visibility: visible !important;
        padding-bottom: 0 !important;
        margin-bottom: 0 !important;
      }
      @page {
        size: 80mm auto !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      /* Remover espaços em branco após o conteúdo */
      #auto-print-container-${order.id} .print-receipt:after,
      #auto-print-container-${order.id} .print-kitchen:after,
      #auto-print-container-${order.id} .print-customer:after {
        content: "" !important;
        display: none !important;
      }
      /* Garantir que o body não tenha altura mínima */
      body {
        height: auto !important;
        min-height: 0 !important;
      }
      /* Garantir que o container se ajuste ao conteúdo */
      #auto-print-container-${order.id} {
        height: fit-content !important;
        min-height: 0 !important;
      }
      /* Ocultar qualquer elemento fora do container de impressão */
      body > *:not(#auto-print-container-${order.id}) {
        display: none !important;
        visibility: hidden !important;
      }
    }
  `
  document.head.appendChild(style)

  // Aguardar um pouco para garantir que o React renderizou tudo
  setTimeout(() => {
    // Mover o container para a posição correta antes de imprimir
    printContainer.style.position = "relative"
    printContainer.style.left = "auto"
    printContainer.style.top = "auto"
    printContainer.style.visibility = "visible"

    // Forçar visibilidade de todos os elementos
    const allElements = printContainer.querySelectorAll("*")
    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement
      htmlEl.style.visibility = "visible"
      htmlEl.style.display = htmlEl.style.display || "block"
      if (htmlEl.classList.contains("hidden")) {
        htmlEl.classList.remove("hidden")
      }
      if (htmlEl.classList.contains("print-receipt") || htmlEl.classList.contains("print-kitchen") || htmlEl.classList.contains("print-customer")) {
        htmlEl.style.display = "block"
        htmlEl.style.visibility = "visible"
      }
    })

    // Aguardar mais um pouco para garantir que os estilos foram aplicados
    setTimeout(() => {
      try {
        // Usar função otimizada de impressão rápida
        // - Foca automaticamente no diálogo
        // - Configura atalho Enter para confirmar rapidamente
        // Nota: Navegadores modernos não permitem impressão completamente silenciosa por segurança
        // O diálogo de impressão sempre aparecerá, mas a experiência será otimizada
        quickPrint({ focusDialog: true })
      } catch (printError) {
        console.warn("Erro ao imprimir automaticamente:", printError)
      }

      // Limpar após impressão
      setTimeout(() => {
        root.unmount()
        if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer)
        }
        const styleElement = document.getElementById(`auto-print-styles-${order.id}`)
        if (styleElement) {
          document.head.removeChild(styleElement)
        }
      }, 1000)
    }, 300)
  }, 200)
}

