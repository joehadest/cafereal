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
          <p className="text-sm font-bold">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-xs font-bold">
            {orderDate.toLocaleDateString("pt-BR")} {orderDate.toLocaleTimeString("pt-BR")}
          </p>
        </div>

        <div className="divider">========================================</div>

        {/* Order Type */}
        <div className="mb-3">
          {isDelivery ? (
            <>
              <p className="font-bold text-lg">DELIVERY</p>
              <p className="text-sm font-bold">
                <strong>Cliente:</strong> {order.customer_name}
              </p>
              <p className="text-sm font-bold">
                <strong>Telefone:</strong> {order.customer_phone}
              </p>
              <p className="text-sm font-bold">
                <strong>Endereço:</strong>
              </p>
              <p className="text-xs ml-2 font-bold">{order.delivery_address ? order.delivery_address.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() : ""}</p>
              {order.reference_point && (
                <>
                  <p className="text-sm font-bold">
                    <strong>Ponto de Referência:</strong>
                  </p>
                  <p className="text-xs ml-2 font-bold">{order.reference_point.trim()}</p>
                </>
              )}
              {order.payment_method && (
                <p className="text-sm font-bold">
                  <strong>Pagamento:</strong> {order.payment_method}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="font-bold text-lg">MESA {order.table_number}</p>
              {order.customer_name && (
                <p className="text-sm font-bold">
                  <strong>Cliente:</strong> {order.customer_name}
                </p>
              )}
              {order.payment_method && (
                <p className="text-sm font-bold">
                  <strong>Pagamento:</strong> {order.payment_method}
                </p>
              )}
            </>
          )}
        </div>

        <div className="divider">========================================</div>

        {/* Items */}
        <div className="mb-3">
          <p className="font-bold mb-2 text-lg">ITENS:</p>
          {order.order_items.map((item, index) => (
            <div key={item.id} className="mb-2">
              <div className="flex justify-between">
                <span className="font-bold text-sm">
                  {item.quantity}x {item.product_name}
                </span>
              </div>
              {item.notes && <p className="text-xs ml-4 italic font-bold">Obs: {item.notes}</p>}
            </div>
          ))}
        </div>

        <div className="divider">========================================</div>

        {/* Notes */}
        {order.notes && (
          <>
            <div className="mb-3">
              <p className="font-bold text-lg">OBSERVAÇÕES:</p>
              <p className="text-sm font-bold">{order.notes}</p>
            </div>
            <div className="divider">========================================</div>
          </>
        )}

        {/* Total */}
        <div className="mb-3">
          {isDelivery && order.delivery_fee && order.delivery_fee > 0 && (
            <div className="flex justify-between text-sm mb-1 font-bold">
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
          <p className="text-sm font-bold">Obrigado pela preferência!</p>
          <p className="text-xs mt-2 font-bold">Status: {order.status.toUpperCase()}</p>
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
            width: 100%;
            font-family: "Courier New", monospace;
            font-size: 15px;
            font-weight: bold;
            line-height: 1.4;
            color: #000;
            background: #fff;
            padding: 2mm 1mm;
          }

          .receipt-content {
            width: 100%;
          }

          .divider {
            font-size: 13px;
            font-weight: bold;
            margin: 8px 0;
            overflow: hidden;
          }

          .text-center {
            text-align: center;
          }

          .text-xs {
            font-size: 13px;
            font-weight: bold;
          }

          .text-sm {
            font-size: 15px;
            font-weight: bold;
          }

          .text-lg {
            font-size: 18px;
            font-weight: bold;
          }

          .text-2xl {
            font-size: 22px;
            font-weight: bold;
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
            size: auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body {
            height: auto !important;
            min-height: 0 !important;
          }
          .thermal-receipt {
            height: fit-content !important;
            min-height: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}
