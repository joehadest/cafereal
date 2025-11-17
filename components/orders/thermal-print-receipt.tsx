"use client"

import { useEffect, useRef } from "react"

type OrderItem = {
  id: string
  product_name: string
  quantity: number
  notes: string | null
}

type Order = {
  id: string
  order_type: string
  table_number: number
  status: string
  total: number
  notes: string | null
  customer_name?: string | null
  customer_phone?: string | null
  delivery_address?: string | null
  delivery_fee?: number
  created_at: string
  order_items: OrderItem[]
}

export function ThermalPrintReceipt({ order, autoPrint = false }: { order: Order; autoPrint?: boolean }) {
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoPrint && printRef.current) {
      setTimeout(() => {
        window.print()
      }, 100)
    }
  }, [autoPrint])

  const isDelivery = order.order_type === "delivery"
  const orderDate = new Date(order.created_at)

  return (
    <div ref={printRef} className="thermal-receipt">
      <div className="receipt-content">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold">RESTAURANTE</h1>
          <p className="text-sm">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-xs">
            {orderDate.toLocaleDateString("pt-BR")} {orderDate.toLocaleTimeString("pt-BR")}
          </p>
        </div>

        <div className="divider">========================================</div>

        {/* Order Type */}
        <div className="mb-3">
          {isDelivery ? (
            <>
              <p className="font-bold text-lg">DELIVERY</p>
              <p className="text-sm">
                <strong>Cliente:</strong> {order.customer_name}
              </p>
              <p className="text-sm">
                <strong>Telefone:</strong> {order.customer_phone}
              </p>
              <p className="text-sm">
                <strong>Endereço:</strong>
              </p>
              <p className="text-xs ml-2">{order.delivery_address ? order.delivery_address.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() : ""}</p>
            </>
          ) : (
            <p className="font-bold text-lg">MESA {order.table_number}</p>
          )}
        </div>

        <div className="divider">========================================</div>

        {/* Items */}
        <div className="mb-3">
          <p className="font-bold mb-2">ITENS:</p>
          {order.order_items.map((item, index) => (
            <div key={item.id} className="mb-2">
              <div className="flex justify-between">
                <span>
                  {item.quantity}x {item.product_name}
                </span>
              </div>
              {item.notes && <p className="text-xs ml-4 italic">Obs: {item.notes}</p>}
            </div>
          ))}
        </div>

        <div className="divider">========================================</div>

        {/* Notes */}
        {order.notes && (
          <>
            <div className="mb-3">
              <p className="font-bold">OBSERVAÇÕES:</p>
              <p className="text-sm">{order.notes}</p>
            </div>
            <div className="divider">========================================</div>
          </>
        )}

        {/* Total */}
        <div className="mb-3">
          {isDelivery && order.delivery_fee && order.delivery_fee > 0 && (
            <div className="flex justify-between text-sm mb-1">
              <span>Taxa de Entrega:</span>
              <span>R$ {order.delivery_fee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg">
            <span>TOTAL:</span>
            <span>R$ {order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="divider">========================================</div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-sm">Obrigado pela preferência!</p>
          <p className="text-xs mt-2">Status: {order.status.toUpperCase()}</p>
        </div>
      </div>

      <style jsx>{`
        .thermal-receipt {
          display: none;
        }

        @media print {
          body * {
            visibility: hidden;
          }

          .thermal-receipt,
          .thermal-receipt * {
            visibility: visible;
          }

          .thermal-receipt {
            display: block;
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            font-family: "Courier New", monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: #fff;
            padding: 10mm;
          }

          .receipt-content {
            width: 100%;
          }

          .divider {
            font-size: 10px;
            margin: 8px 0;
            overflow: hidden;
          }

          .text-center {
            text-align: center;
          }

          .text-xs {
            font-size: 10px;
          }

          .text-sm {
            font-size: 11px;
          }

          .text-lg {
            font-size: 14px;
          }

          .text-2xl {
            font-size: 18px;
          }

          .font-bold {
            font-weight: bold;
          }

          .mb-1 {
            margin-bottom: 2px;
          }

          .mb-2 {
            margin-bottom: 4px;
          }

          .mb-3 {
            margin-bottom: 8px;
          }

          .mb-4 {
            margin-bottom: 12px;
          }

          .mt-2 {
            margin-top: 4px;
          }

          .mt-4 {
            margin-top: 12px;
          }

          .ml-2 {
            margin-left: 4px;
          }

          .ml-4 {
            margin-left: 8px;
          }

          .flex {
            display: flex;
          }

          .justify-between {
            justify-content: space-between;
          }

          .italic {
            font-style: italic;
          }

          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}
