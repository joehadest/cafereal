"use client"

import { useState } from "react"
import { createRoot } from "react-dom/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Printer, FileText, ChefHat } from "lucide-react"
import type { Order } from "@/types/order"
import { PrintOrderReceipt } from "./print-order-receipt"
import { PrintKitchenTicket } from "./print-kitchen-ticket"

interface BulkPrintDialogProps {
  orders: Order[]
  restaurantInfo?: {
    name: string
    phone?: string
    address?: string
  }
}

export function BulkPrintDialog({ orders, restaurantInfo }: BulkPrintDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [printType, setPrintType] = useState<"receipt" | "kitchen">("kitchen")
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filteredOrders = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus)

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map((o) => o.id))
    }
  }

  const handleToggleOrder = (orderId: string) => {
    setSelectedOrders((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]))
  }

  const handlePrint = () => {
    if (selectedOrders.length === 0) return

    // Criar elemento temporário com todos os pedidos selecionados
    const printContainer = document.createElement("div")
    printContainer.className = "print-container"
    printContainer.style.position = "absolute"
    printContainer.style.left = "-9999px"
    printContainer.style.top = "0"
    printContainer.style.width = "100%"
    printContainer.id = "bulk-print-container"

    document.body.appendChild(printContainer)

    // Renderizar todos os pedidos selecionados usando React
    const root = createRoot(printContainer)
    
    const ordersToPrint = selectedOrders
      .map((orderId) => orders.find((o) => o.id === orderId))
      .filter((order): order is Order => order !== undefined)

    root.render(
      <div style={{ width: "100%" }}>
        {ordersToPrint.map((order, index) => (
          <div
            key={order.id}
            className="print-item"
            style={{
              pageBreakAfter: index < ordersToPrint.length - 1 ? "always" : "auto",
              pageBreakInside: "avoid",
            }}
          >
            {printType === "kitchen" ? (
              <div className="print-kitchen" style={{ display: "block" }}>
                <PrintKitchenTicket order={order} restaurantName={restaurantInfo?.name} />
              </div>
            ) : (
              <div className="print-receipt" style={{ display: "block" }}>
                <PrintOrderReceipt order={order} restaurantInfo={restaurantInfo} />
              </div>
            )}
          </div>
        ))}
      </div>
    )

    // Adicionar estilos de impressão temporários
    const style = document.createElement("style")
    style.id = "bulk-print-styles"
    style.innerHTML = `
      @media print {
        body * { 
          visibility: hidden !important; 
        }
        #bulk-print-container, 
        #bulk-print-container *, 
        #bulk-print-container .print-kitchen,
        #bulk-print-container .print-kitchen *,
        #bulk-print-container .print-receipt,
        #bulk-print-container .print-receipt * { 
          visibility: visible !important; 
          display: block !important;
        }
        #bulk-print-container .hidden {
          display: block !important;
          visibility: visible !important;
        }
        #bulk-print-container { 
          position: absolute !important; 
          left: 0 !important; 
          top: 0 !important; 
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          height: auto !important;
          min-height: auto !important;
          max-height: none !important;
          overflow: visible !important;
        }
        #bulk-print-container .print-item {
          page-break-inside: auto !important;
          margin-bottom: 0 !important;
          height: auto !important;
          min-height: auto !important;
          max-height: none !important;
          overflow: visible !important;
        }
        #bulk-print-container .print-item:not(:last-child) {
          page-break-after: always !important;
        }
      }
    `
    document.head.appendChild(style)

    // Aguardar um pouco para garantir que o React renderizou tudo
    setTimeout(() => {
      window.print()
      // Limpar após impressão
      setTimeout(() => {
        root.unmount()
        if (document.body.contains(printContainer)) {
          document.body.removeChild(printContainer)
        }
        const existingStyle = document.getElementById("bulk-print-styles")
        if (existingStyle) {
          document.head.removeChild(existingStyle)
        }
        setOpen(false)
      }, 500)
    }, 500)
  }

  const statusCounts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    ready: orders.filter((o) => o.status === "ready").length,
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="bg-slate-600 hover:bg-slate-700 text-white">
            <Printer className="h-4 w-4 mr-2" />
            Impressão em Lote
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Impressão em Lote de Pedidos</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Tipo de Impressão */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Tipo de Impressão</Label>
              <RadioGroup value={printType} onValueChange={(v) => setPrintType(v as any)} className="space-y-2">
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50">
                  <RadioGroupItem value="kitchen" id="kitchen" />
                  <Label htmlFor="kitchen" className="flex items-center gap-2 cursor-pointer flex-1">
                    <ChefHat className="h-5 w-5 text-slate-600" />
                    <div>
                      <p className="font-semibold">Comanda de Cozinha</p>
                      <p className="text-xs text-slate-600">Formato grande, foco nos itens e observações</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-slate-50">
                  <RadioGroupItem value="receipt" id="receipt" />
                  <Label htmlFor="receipt" className="flex items-center gap-2 cursor-pointer flex-1">
                    <FileText className="h-5 w-5 text-slate-600" />
                    <div>
                      <p className="font-semibold">Recibo Completo</p>
                      <p className="text-xs text-slate-600">Com valores, cliente e informações completas</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Filtro por Status */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Filtrar por Status</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                  className="justify-start"
                >
                  Todos ({statusCounts.all})
                </Button>
                <Button
                  variant={filterStatus === "pending" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("pending")}
                  className="justify-start"
                >
                  Pendentes ({statusCounts.pending})
                </Button>
                <Button
                  variant={filterStatus === "preparing" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("preparing")}
                  className="justify-start"
                >
                  Preparo ({statusCounts.preparing})
                </Button>
                <Button
                  variant={filterStatus === "ready" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("ready")}
                  className="justify-start"
                >
                  Prontos ({statusCounts.ready})
                </Button>
              </div>
            </div>

            {/* Seleção de Pedidos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold">Selecionar Pedidos</Label>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedOrders.length === filteredOrders.length ? "Desmarcar Todos" : "Selecionar Todos"}
                </Button>
              </div>
              <div className="border rounded-lg max-h-64 overflow-auto">
                {filteredOrders.length === 0 ? (
                  <p className="text-center text-slate-600 py-8">Nenhum pedido encontrado</p>
                ) : (
                  <div className="divide-y">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center space-x-3 p-3 hover:bg-slate-50 cursor-pointer"
                        onClick={() => handleToggleOrder(order.id)}
                      >
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={() => handleToggleOrder(order.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">
                            #{order.id.slice(0, 8)} -{" "}
                            {order.order_type === "delivery" ? "Delivery" : order.table_number === 0 ? "Balcão" : `Mesa ${order.table_number}`}
                          </p>
                          <p className="text-xs text-slate-600">
                            {order.order_items.length} itens • R$ {order.total.toFixed(2)} •{" "}
                            {new Date(order.created_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            order.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : order.status === "preparing"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {order.status === "pending"
                            ? "Pendente"
                            : order.status === "preparing"
                              ? "Preparo"
                              : "Pronto"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-3 border-t">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handlePrint}
                disabled={selectedOrders.length === 0}
                className="flex-1 bg-slate-600 hover:bg-slate-700"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir {selectedOrders.length > 0 && `(${selectedOrders.length})`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Componentes de impressão escondidos - renderizados para serem clonados */}
      <div style={{ position: "absolute", left: "-9999px", top: "0", opacity: 0, pointerEvents: "none" }}>
        {orders.map((order) => (
          <div key={order.id}>
            <div 
              data-receipt={order.id} 
              className="print-receipt"
              style={{ display: "block" }}
            >
              <PrintOrderReceipt order={order} restaurantInfo={restaurantInfo} />
            </div>
            <div 
              data-kitchen-ticket={order.id} 
              className="print-kitchen"
              style={{ display: "block" }}
            >
              <PrintKitchenTicket order={order} restaurantName={restaurantInfo?.name} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
