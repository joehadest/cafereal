"use client"

import { createRoot } from "react-dom/client"
import { PrintKitchenTicket } from "./print-kitchen-ticket"
import { PrintCustomerTicket } from "./print-customer-ticket"
import { PrintOrderReceipt } from "./print-order-receipt"
import type { Order } from "@/types/order"

type PrintType = "kitchen" | "customer" | "receipt" | "none"

interface AutoPrintSettings {
  enabled: boolean
  printType: PrintType
  printOnNewOrder: boolean
  printOnStatusChange: boolean
}

export function autoPrintOrder(
  order: Order,
  printType: PrintType,
  restaurantInfo?: {
    name?: string
    phone?: string
    address?: string
    cnpj?: string
  },
  newItemIds?: Set<string>
) {
  // Verificar se o pedido tem dados
  if (!order || !order.order_items || order.order_items.length === 0) {
    console.warn("Pedido sem itens para imprimir:", order.id)
    return
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
          <PrintKitchenTicket order={order} restaurantName={restaurantInfo?.name} newItemIds={newItemIds} />
        </div>
      ) : printType === "customer" ? (
        <div className="print-customer" style={{ display: "block", visibility: "visible", position: "relative" }}>
          <PrintCustomerTicket order={order} restaurantInfo={restaurantInfo} newItemIds={newItemIds} />
        </div>
      ) : (
        <div className="print-receipt" style={{ display: "block", visibility: "visible", position: "relative" }}>
          <PrintOrderReceipt order={order} restaurantInfo={restaurantInfo} newItemIds={newItemIds} />
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
      }
      /* Tornar visível apenas o container de impressão e seu conteúdo */
      #auto-print-container-${order.id} { 
        position: relative !important; 
        left: auto !important; 
        top: auto !important; 
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 auto !important;
        padding: 0 !important;
        visibility: visible !important;
        display: block !important;
        page-break-inside: auto !important;
        page-break-after: auto !important;
        page-break-before: auto !important;
        break-inside: auto !important;
        break-after: auto !important;
        break-before: auto !important;
        height: auto !important;
        min-height: auto !important;
        max-height: none !important;
        overflow: visible !important;
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
        left: auto !important;
        top: auto !important;
        page-break-inside: auto !important;
        page-break-after: auto !important;
        page-break-before: auto !important;
        break-inside: auto !important;
        break-after: auto !important;
        break-before: auto !important;
        height: auto !important;
        min-height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        display: block !important;
        visibility: visible !important;
      }
      @page {
        size: auto !important;
        margin: 0 !important;
        padding: 0 !important;
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
        window.print()
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

