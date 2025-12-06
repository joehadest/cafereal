"use client"

import React from "react"
import type { Order } from "@/types/order"

interface PrintCustomerTicketProps {
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

export function PrintCustomerTicket({ order, restaurantInfo }: PrintCustomerTicketProps) {
  const isDelivery = order.order_type === "delivery"
  const timestamp = new Date(order.created_at)

  return (
    <div className="print-customer hidden print:block bg-white text-black p-3 max-w-[80mm] mx-auto font-sans text-xs overflow-visible" style={{ width: '80mm', maxWidth: '80mm' }}>
      {/* Header do Restaurante */}
      <div className="text-center border-b-2 border-black pb-3 mb-3">
        <div className="mb-2">
          <h1 className="text-2xl font-bold uppercase leading-tight text-black tracking-wide">
            {restaurantInfo?.name || "CAFEREAL"}
          </h1>
        </div>
        <div className="border-t border-b border-gray-600 py-2 my-2">
          <p className="text-sm font-bold text-black uppercase">Comanda do Cliente</p>
        </div>
        {restaurantInfo?.phone && (
          <p className="text-xs font-bold text-black">Tel: {restaurantInfo.phone}</p>
        )}
      </div>

      {/* Informações da Mesa */}
      {!isDelivery && (
        <div className="mb-3 pb-3 border-b-2 border-gray-400 bg-gray-100 -mx-3 px-3 py-3 rounded">
          <div className="text-center">
            <p className="text-xl font-bold text-black mb-1">{order.table_number === 0 ? "BALCÃO" : `MESA ${order.table_number}`}</p>
            <p className="text-xs text-black">
              {timestamp.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="text-sm font-bold text-black mt-1">
              {timestamp.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      )}

      {/* Informações do Pedido */}
      <div className="mb-3 pb-3 border-b border-gray-300">
        <div className="flex justify-between items-center mb-2">
          <span className="font-bold text-base text-black">Pedido #{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        {isDelivery && order.customer_name && (
          <div className="text-xs text-black">
            <span className="font-bold">Cliente:</span> {order.customer_name}
          </div>
        )}
      </div>

      {/* Itens do Pedido */}
      <div className="mb-3 pb-3 border-b-2 border-gray-800">
        <h2 className="font-bold text-sm mb-3 uppercase text-black">Seu Pedido</h2>
        <div className="space-y-3">
          {order.order_items.map((item) => {
            const itemPrice = item.variety_price ?? item.product_price
            const extrasPrice = (item.order_item_extras || []).reduce(
              (sum, extra) => sum + extra.extra_price * extra.quantity,
              0
            )
            const itemTotal = (itemPrice + extrasPrice) * item.quantity

            return (
              <div key={item.id} className="border-b border-dotted border-gray-300 pb-3 last:border-0 last:pb-0">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    {item.category_name && (
                      <div className="text-[10px] text-gray-600 font-semibold uppercase mb-0.5">
                        [{item.category_name}]
                      </div>
                    )}
                    <div className="font-bold text-sm leading-tight break-words text-black">
                      {item.quantity}x {item.product_name}
                    </div>
                    {item.variety_name && (
                      <div className="text-xs text-black mt-1 font-semibold">
                        Tamanho: {item.variety_name}
                      </div>
                    )}
                    {item.order_item_extras && item.order_item_extras.length > 0 && (
                      <div className="text-xs text-black mt-1 space-y-0.5 font-semibold">
                        {item.order_item_extras.map((extra) => (
                          <div key={extra.id} className="leading-tight">
                            + {extra.extra_name}
                            {extra.quantity > 1 && <span> (x{extra.quantity})</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {item.notes && (
                      <div className="mt-2 ml-2 pl-2 border-l-2 border-yellow-500 bg-yellow-50 py-1 px-2 rounded">
                        <p className="text-xs font-semibold text-black leading-tight">
                          <span className="font-bold">OBS:</span> {item.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className="font-bold text-sm text-black">R$ {itemTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Observações do Pedido */}
      {order.notes && (
        <div className="mb-3 pb-3 border-b border-gray-300 bg-yellow-50 -mx-3 px-3 py-2 rounded">
          <h2 className="font-bold text-xs mb-1 uppercase text-black">Observações</h2>
          <p className="text-xs text-black whitespace-pre-wrap leading-tight break-words font-semibold">
            {order.notes}
          </p>
        </div>
      )}

      {/* Resumo Financeiro */}
      <div className="mb-3 pb-3 border-b-2 border-gray-800">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-black font-bold">Subtotal:</span>
            <span className="font-bold text-black">
              R$ {(isDelivery && order.delivery_fee ? order.total - order.delivery_fee : order.total).toFixed(2)}
            </span>
          </div>
          {isDelivery && order.delivery_fee && order.delivery_fee > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-black font-bold">Taxa de Entrega:</span>
              <span className="font-bold text-black">R$ {order.delivery_fee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-gray-800">
            <span className="text-lg font-bold uppercase text-black">Total:</span>
            <span className="text-xl font-bold text-black">R$ {order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs mt-4 space-y-1 border-t-2 border-gray-800 pt-3">
        <p className="font-bold text-black uppercase">{restaurantInfo?.name || "CAFEREAL"}</p>
        {restaurantInfo?.cnpj && (
          <p className="font-bold text-black text-[10px]">CNPJ: {formatCNPJ(restaurantInfo.cnpj)}</p>
        )}
        <p className="font-bold text-black">Obrigado pela preferência!</p>
        <p className="font-bold text-black">Volte sempre!</p>
        {restaurantInfo?.phone && (
          <p className="font-bold text-black text-[10px] mt-2">Tel: {restaurantInfo.phone}</p>
        )}
      </div>

      {/* Corte */}
      <div className="text-center mt-4 pt-2 text-xs text-black font-bold">
        <p>{"- - - - - - - - - - - - - - - - - - - -"}</p>
      </div>
    </div>
  )
}


