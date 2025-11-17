"use client"

import type { Order } from "@/types/order"

interface PrintKitchenTicketProps {
  order: Order
  restaurantName?: string
}

export function PrintKitchenTicket({ order, restaurantName }: PrintKitchenTicketProps) {
  const isDelivery = order.order_type === "delivery"
  const timestamp = new Date(order.created_at)

  return (
    <div className="print-kitchen hidden print:block bg-white text-black p-4 max-w-[80mm] mx-auto font-mono overflow-visible">
      {/* Header */}
      <div className="text-center border-b-4 border-black pb-3 mb-3">
        <h1 className="text-3xl font-bold">{restaurantName || "COZINHA"}</h1>
      </div>

      {/* Tipo e Mesa/Delivery */}
      <div className="bg-black text-white p-3 mb-3 text-center">
        <p className="text-4xl font-bold">{isDelivery ? "DELIVERY" : `MESA ${order.table_number}`}</p>
      </div>

      {/* Pedido e Hora */}
      <div className="text-center mb-4 pb-3 border-b-2 border-dashed border-gray-600">
        <p className="text-2xl font-bold mb-1">PEDIDO #{order.id.slice(0, 8).toUpperCase()}</p>
        <p className="text-xl font-bold">
          {timestamp.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Itens - Formato Cozinha */}
      <div className="mb-4">
        <table className="w-full text-base">
          <tbody>
            {order.order_items.map((item) => (
              <tr key={item.id} className="border-b-2 border-gray-400">
                <td className="py-4 pr-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-3xl font-bold mr-4">{item.quantity}x</span>
                    <span className="text-xl font-bold flex-1 uppercase leading-tight">{item.product_name}</span>
                  </div>
                  {item.variety_name && (
                    <div className="ml-12 mt-1 mb-1">
                      <p className="text-base font-bold">TAMANHO: {item.variety_name.toUpperCase()}</p>
                    </div>
                  )}
                  {item.order_item_extras && item.order_item_extras.length > 0 && (
                    <div className="ml-12 mt-1 mb-1">
                      <p className="text-sm font-bold uppercase mb-1">EXTRAS:</p>
                      {item.order_item_extras.map((extra) => (
                        <p key={extra.id} className="text-base font-semibold">
                          + {extra.extra_name.toUpperCase()} {extra.quantity > 1 && `(x${extra.quantity})`}
                        </p>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <div className="ml-12 mt-2 bg-yellow-100 border-l-4 border-yellow-500 p-2">
                      <p className="text-sm font-bold uppercase mb-1">OBSERVAÇÃO:</p>
                      <p className="text-base font-semibold">{item.notes}</p>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Observações Gerais */}
      {order.notes && (
        <div className="bg-red-100 border-4 border-red-500 p-3 mb-4">
          <p className="text-lg font-bold uppercase mb-2">⚠️ ATENÇÃO - OBSERVAÇÃO GERAL:</p>
          <p className="text-base font-bold whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      {/* Info Cliente (se Delivery) */}
      {isDelivery && order.customer_name && (
        <div className="border-t-2 border-dashed border-gray-600 pt-3 mt-3 space-y-1">
          <p className="text-sm">
            <strong>Cliente:</strong> {order.customer_name}
          </p>
          {order.customer_phone && (
            <p className="text-sm">
              <strong>Telefone:</strong> {order.customer_phone}
            </p>
          )}
          {order.delivery_address && (
            <div className="text-sm overflow-visible">
              <p className="font-bold mb-1">Endereço:</p>
              <p className="break-words overflow-wrap-anywhere word-break-break-all overflow-visible leading-tight">
                {order.delivery_address.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Corte */}
      <div className="text-center mt-6 text-sm">
        <p>{"═══════════════════════════"}</p>
      </div>
    </div>
  )
}
