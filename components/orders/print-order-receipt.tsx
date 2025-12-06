"use client"

import React from "react"
import type { Order } from "@/types/order"

interface PrintOrderReceiptProps {
  order: Order
  restaurantInfo?: {
    name: string
    phone?: string
    address?: string
    cnpj?: string
  }
}

// Função para formatar CNPJ
const formatCNPJ = (cnpj: string | null | undefined): string | null => {
  if (!cnpj) return null
  const cleanCnpj = cnpj.replace(/\D/g, '')
  if (cleanCnpj.length !== 14) return cnpj
  return cleanCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
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
    <div className="print-receipt print:block bg-white text-black p-2 max-w-[80mm] mx-auto font-sans text-xs font-bold" style={{ width: '80mm', maxWidth: '80mm', margin: '0 auto', boxSizing: 'border-box', overflow: 'hidden', wordWrap: 'break-word', display: 'block', visibility: 'visible' }}>
      {/* Header do Restaurante - Destacado */}
      <div className="text-center border-b-2 border-black pb-2 mb-2">
        <div className="mb-1.5">
          <h1 className="text-xl font-bold uppercase leading-tight text-black tracking-wide">
            {restaurantInfo?.name || "CAFEREAL"}
          </h1>
        </div>
        <div className="border-t border-b border-gray-600 py-1 my-1">
          <p className="text-xs font-bold text-black uppercase">Comprovante de Pedido</p>
        </div>
        {restaurantInfo?.phone && (
          <p className="text-xs font-bold text-black">Tel: {restaurantInfo.phone}</p>
        )}
        {restaurantInfo?.address && (
          <p className="text-xs font-bold text-black mt-0.5 leading-tight break-words" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {restaurantInfo.address}
          </p>
        )}
      </div>

      {/* Informações do Pedido */}
      <div className="mb-2 pb-2 border-b border-gray-300">
        <div className="flex justify-between items-start mb-1.5 gap-2">
          <div className="flex-1">
            <span className="font-bold text-sm block leading-tight">
              PEDIDO #{order.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <span
            className={`px-2 py-1 text-xs font-bold rounded whitespace-nowrap ${
              order.status === "pending"
                ? "bg-yellow-200 text-yellow-900"
                : order.status === "preparing"
                  ? "bg-blue-200 text-blue-900"
                  : order.status === "ready"
                    ? "bg-green-200 text-green-900"
                    : "bg-gray-200 text-gray-900"
            }`}
          >
            {statusMap[order.status as keyof typeof statusMap] || order.status.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs mt-1.5">
          <div>
            <span className="font-bold text-black">Data:</span>{" "}
            <span className="font-bold">{timestamp.toLocaleDateString("pt-BR")}</span>
          </div>
          <div>
            <span className="font-bold text-black">Hora:</span>{" "}
            <span className="font-bold">
              {timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="col-span-2">
            <span className="font-bold text-black">Tipo:</span>{" "}
            <span className="font-bold uppercase">
              {isDelivery ? "DELIVERY" : order.table_number === 0 ? "BALCÃO" : `MESA ${order.table_number}`}
            </span>
          </div>
        </div>
      </div>

      {/* Informações do Cliente (Delivery) */}
      {isDelivery && (
        <div className="mb-2 pb-2 border-b border-gray-300 bg-gray-50 -mx-3 px-3 py-2 rounded">
          <h2 className="font-bold text-xs mb-1.5 uppercase text-black">Dados do Cliente</h2>
          <div className="space-y-1 text-xs">
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-black min-w-[50px]">Nome:</span>
              <span className="flex-1 break-words font-bold">{order.customer_name}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-black min-w-[50px]">Telefone:</span>
              <span className="flex-1 break-words font-bold">{order.customer_phone}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="font-bold text-black min-w-[50px]">Endereço:</span>
              <span className="flex-1 break-words leading-tight overflow-wrap-anywhere font-bold" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {order.delivery_address
                  ? order.delivery_address.replace(/\n/g, ", ").replace(/\s+/g, " ").trim()
                  : "Não informado"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Itens do Pedido */}
      <div className="mb-2 pb-2 border-b-2 border-gray-800">
        <h2 className="font-bold text-xs mb-2 uppercase text-black">Itens do Pedido</h2>
        <div className="space-y-2">
          {order.order_items.map((item) => {
              const itemPrice = item.variety_price ?? item.product_price
              const extrasPrice = (item.order_item_extras || []).reduce(
                (sum, extra) => sum + extra.extra_price * extra.quantity,
                0
              )
              const itemTotal = (itemPrice + extrasPrice) * item.quantity

              return (
              <div key={item.id} className="border-b border-dotted border-gray-300 pb-2 last:border-0 last:pb-0">
                <div className="flex justify-between items-start gap-1 mb-0.5">
                  <div className="flex-1 min-w-0" style={{ maxWidth: 'calc(100% - 50px)', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                    {item.category_name && (
                      <div className="text-[10px] text-gray-600 font-semibold uppercase mb-0.5" style={{ wordBreak: 'break-word' }}>
                        [{item.category_name}]
                      </div>
                    )}
                    <div className="font-bold text-xs leading-tight break-words" style={{ wordBreak: 'break-word' }}>
                      {item.quantity}x {item.product_name}
                    </div>
                        {item.variety_name && (
                      <div className="text-xs text-black mt-0.5 font-bold" style={{ wordBreak: 'break-word' }}>
                        Tam: <span className="font-bold">{item.variety_name}</span>
                      </div>
                        )}
                        {item.order_item_extras && item.order_item_extras.length > 0 && (
                      <div className="text-xs text-black mt-0.5 space-y-0.5 font-bold" style={{ wordBreak: 'break-word' }}>
                            {item.order_item_extras.map((extra) => (
                          <div key={extra.id} className="leading-tight">
                            + {extra.extra_name}
                            {extra.quantity > 1 && <span className="font-bold"> (x{extra.quantity})</span>}
                              </div>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-xs text-black mt-0.5 font-bold italic" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                            OBS: {item.notes}
                          </div>
                        )}
                      </div>
                  <div className="text-right flex-shrink-0" style={{ minWidth: '45px', maxWidth: '50px' }}>
                    <span className="font-bold text-xs">R$ {itemTotal.toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
              </div>
              )
            })}
        </div>
      </div>

      {/* Observações do Pedido */}
      {order.notes && (
        <div className="mb-2 pb-2 border-b border-gray-300 bg-yellow-50 -mx-3 px-3 py-2 rounded">
          <h2 className="font-bold text-xs mb-1 uppercase text-black">Observações Gerais</h2>
          <p className="text-xs text-black whitespace-pre-wrap leading-tight break-words font-bold" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {order.notes}
          </p>
        </div>
      )}

      {/* Resumo Financeiro */}
      <div className="mb-2 pb-2 border-b-2 border-gray-800">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center gap-1">
            <span className="text-black font-bold flex-shrink-0">Subtotal:</span>
            <span className="font-bold text-right flex-shrink-0" style={{ minWidth: '60px' }}>
              R$ {(isDelivery && order.delivery_fee ? order.total - order.delivery_fee : order.total).toFixed(2).replace(".", ",")}
            </span>
          </div>
          {isDelivery && order.delivery_fee && order.delivery_fee > 0 && (
            <div className="flex justify-between items-center gap-1">
              <span className="text-black font-bold flex-shrink-0">Taxa Entrega:</span>
              <span className="font-bold text-right flex-shrink-0" style={{ minWidth: '60px' }}>
                R$ {order.delivery_fee.toFixed(2).replace(".", ",")}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1.5 mt-1.5 border-t-2 border-gray-800 gap-1">
            <span className="text-base font-bold uppercase flex-shrink-0">Total:</span>
            <span className="text-lg font-bold text-right flex-shrink-0" style={{ minWidth: '60px' }}>
              R$ {order.total.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs mt-2 space-y-0.5 border-t-2 border-gray-800 pt-2">
        <p className="font-bold text-black uppercase">{restaurantInfo?.name || "CAFEREAL"}</p>
        {restaurantInfo?.cnpj && (
          <p className="font-bold text-black text-[10px]">CNPJ: {formatCNPJ(restaurantInfo.cnpj)}</p>
        )}
        <p className="font-bold text-black">Obrigado pela preferência!</p>
        <p className="font-bold text-black">Volte sempre!</p>
        {restaurantInfo?.phone && (
          <p className="font-bold text-black text-[10px] mt-1">Tel: {restaurantInfo.phone}</p>
        )}
      </div>

      {/* Corte */}
      <div className="text-center mt-3 pt-1 text-xs text-black font-bold">
        <p>{"- - - - - - - - - - - - - - - - - - - -"}</p>
      </div>
    </div>
  )
}

