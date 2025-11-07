"use client"

import type { Order } from "@/types/order"

interface PrintOrderReceiptProps {
  order: Order
  restaurantInfo?: {
    name: string
    phone?: string
    address?: string
  }
}

export function PrintOrderReceipt({ order, restaurantInfo }: PrintOrderReceiptProps) {
  const isDelivery = order.order_type === "delivery"
  const timestamp = new Date(order.created_at)

  const statusMap = {
    pending: "PENDENTE",
    preparing: "EM PREPARO",
    ready: "PRONTO",
    out_for_delivery: "SAIU PARA ENTREGA",
    delivered: "ENTREGUE",
  }

  return (
    <div className="print-receipt hidden print:block bg-white text-black p-6 max-w-[80mm] mx-auto font-mono text-sm">
      {/* Header do Restaurante */}
      <div className="text-center border-b-2 border-dashed border-gray-800 pb-4 mb-4">
        <h1 className="text-2xl font-bold uppercase mb-2">{restaurantInfo?.name || "Restaurante"}</h1>
        {restaurantInfo?.phone && <p className="text-xs">Tel: {restaurantInfo.phone}</p>}
        {restaurantInfo?.address && <p className="text-xs mt-1">{restaurantInfo.address}</p>}
      </div>

      {/* Informações do Pedido */}
      <div className="mb-4 pb-4 border-b border-gray-400">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-lg">PEDIDO #{order.id.slice(0, 8).toUpperCase()}</span>
          <span
            className={`px-2 py-1 text-xs font-bold ${
              order.status === "pending"
                ? "bg-yellow-200"
                : order.status === "preparing"
                  ? "bg-blue-200"
                  : order.status === "ready"
                    ? "bg-green-200"
                    : "bg-gray-200"
            }`}
          >
            {statusMap[order.status as keyof typeof statusMap] || order.status.toUpperCase()}
          </span>
        </div>
        <div className="text-xs space-y-1">
          <p>
            <strong>Data:</strong> {timestamp.toLocaleDateString("pt-BR")}
          </p>
          <p>
            <strong>Hora:</strong> {timestamp.toLocaleTimeString("pt-BR")}
          </p>
          <p>
            <strong>Tipo:</strong> {isDelivery ? "DELIVERY" : `MESA ${order.table_number}`}
          </p>
        </div>
      </div>

      {/* Informações do Cliente (Delivery) */}
      {isDelivery && (
        <div className="mb-4 pb-4 border-b border-gray-400 bg-gray-50 p-3 -mx-6 px-6">
          <h2 className="font-bold text-sm mb-2 uppercase">Cliente</h2>
          <div className="text-xs space-y-1">
            <p>
              <strong>Nome:</strong> {order.customer_name}
            </p>
            <p>
              <strong>Telefone:</strong> {order.customer_phone}
            </p>
            <p>
              <strong>Endereço:</strong>
            </p>
            <p className="ml-2 whitespace-pre-wrap">{order.delivery_address}</p>
          </div>
        </div>
      )}

      {/* Itens do Pedido */}
      <div className="mb-4 pb-4 border-b-2 border-gray-800">
        <h2 className="font-bold text-sm mb-3 uppercase">Itens</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-400">
              <th className="text-left pb-2">Item</th>
              <th className="text-center pb-2 px-2">Qtd</th>
              <th className="text-right pb-2">Valor</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item, index) => (
              <>
                <tr key={item.id} className="border-b border-dotted border-gray-300">
                  <td className="py-2 pr-2">{item.product_name}</td>
                  <td className="py-2 text-center px-2">{item.quantity}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    R$ {(item.product_price * item.quantity).toFixed(2)}
                  </td>
                </tr>
                {item.notes && (
                  <tr key={`${item.id}-notes`}>
                    <td colSpan={3} className="text-[10px] italic text-gray-600 pb-2 pl-4">
                      OBS: {item.notes}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Observações do Pedido */}
      {order.notes && (
        <div className="mb-4 pb-4 border-b border-gray-400 bg-yellow-50 p-3 -mx-6 px-6">
          <h2 className="font-bold text-sm mb-2 uppercase">Observações Gerais</h2>
          <p className="text-xs whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      {/* Resumo Financeiro */}
      <div className="mb-4 pb-4 border-b-2 border-gray-800">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-bold">
              R$ {(isDelivery && order.delivery_fee ? order.total - order.delivery_fee : order.total).toFixed(2)}
            </span>
          </div>
          {isDelivery && order.delivery_fee && order.delivery_fee > 0 && (
            <div className="flex justify-between">
              <span>Taxa de Entrega:</span>
              <span className="font-bold">R$ {order.delivery_fee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t-2 border-gray-800">
            <span className="text-lg font-bold">TOTAL:</span>
            <span className="text-xl font-bold">R$ {order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs mt-4 space-y-1">
        <p className="font-bold">Obrigado pela preferência!</p>
        <p>Volte sempre!</p>
      </div>

      {/* Corte */}
      <div className="text-center mt-6 text-xs">
        <p>{"- - - - - - - - - - - - - - - - - - - -"}</p>
      </div>
    </div>
  )
}
