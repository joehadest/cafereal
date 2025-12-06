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
    <div className="print-kitchen hidden print:block bg-white text-black p-3 max-w-[80mm] mx-auto font-mono overflow-visible" style={{ width: '80mm', maxWidth: '80mm' }}>
      {/* Header - Destacado */}
      <div className="text-center border-b-2 border-black pb-2 mb-2">
        <div className="mb-1">
          <h1 className="text-xl font-bold uppercase tracking-wide">{restaurantName || "CAFEREAL"}</h1>
        </div>
        <div className="border-t border-b border-gray-600 py-1 mt-1">
          <p className="text-xs font-bold uppercase">Comanda de Cozinha</p>
        </div>
      </div>

      {/* Tipo e Mesa/Delivery */}
      <div className="bg-black text-white p-2 mb-2 text-center">
        <p className="text-2xl font-bold">{isDelivery ? "DELIVERY" : order.table_number === 0 ? "BALCÃO" : `MESA ${order.table_number}`}</p>
      </div>

      {/* Pedido e Hora */}
      <div className="text-center mb-2 pb-2 border-b-2 border-dashed border-gray-600">
        <p className="text-base font-bold mb-0.5">PEDIDO #{order.id.slice(0, 8).toUpperCase()}</p>
        <p className="text-sm font-bold">
          {timestamp.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Itens - Formato Cozinha */}
      <div className="mb-2">
        <table className="w-full text-xs">
          <tbody>
            {order.order_items.map((item) => (
              <tr key={item.id} className="border-b-2 border-gray-400">
                <td className="py-2 pr-3">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xl font-bold mr-3">{item.quantity}x</span>
                    <span className="text-sm font-bold flex-1 uppercase leading-tight">{item.product_name}</span>
                  </div>
                  {item.variety_name && (
                    <div className="ml-10 mt-0.5 mb-0.5">
                      <p className="text-xs font-bold">TAMANHO: {item.variety_name.toUpperCase()}</p>
                    </div>
                  )}
                  {item.order_item_extras && item.order_item_extras.length > 0 && (
                    <div className="ml-10 mt-0.5 mb-0.5">
                      <p className="text-xs font-bold uppercase mb-0.5">EXTRAS:</p>
                      {item.order_item_extras.map((extra) => (
                        <p key={extra.id} className="text-xs font-semibold">
                          + {extra.extra_name.toUpperCase()} {extra.quantity > 1 && `(x${extra.quantity})`}
                        </p>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <div className="ml-10 mt-1 bg-yellow-100 border-l-4 border-yellow-500 p-1.5">
                      <p className="text-xs font-bold uppercase mb-0.5">OBSERVAÇÃO:</p>
                      <p className="text-xs font-semibold">{item.notes}</p>
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
        <div className="bg-red-100 border-4 border-red-500 p-2 mb-2">
          <p className="text-sm font-bold uppercase mb-1">⚠️ ATENÇÃO - OBSERVAÇÃO GERAL:</p>
          <p className="text-sm font-bold whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      {/* Info Cliente (se Delivery) */}
      {isDelivery && order.customer_name && (
        <div className="border-t-2 border-dashed border-gray-600 pt-2 mt-2 space-y-0.5">
          <p className="text-xs">
            <strong>Cliente:</strong> {order.customer_name}
          </p>
          {order.customer_phone && (
            <p className="text-xs">
              <strong>Telefone:</strong> {order.customer_phone}
            </p>
          )}
          {order.delivery_address && (
            <div className="text-xs overflow-visible">
              <p className="font-bold mb-0.5">Endereço:</p>
              <p className="break-words overflow-wrap-anywhere word-break-break-all overflow-visible leading-tight">
                {order.delivery_address.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-3 pt-2 border-t-2 border-gray-600 text-xs">
        <p className="font-bold uppercase">{restaurantName || "CAFEREAL"}</p>
      </div>

      {/* Corte */}
      <div className="text-center mt-2 text-xs">
        <p>{"═══════════════════════════"}</p>
      </div>
    </div>
  )
}
