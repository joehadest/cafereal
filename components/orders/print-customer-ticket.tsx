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
  newItemIds?: Set<string>
}

// Função para formatar CNPJ
const formatCNPJ = (cnpj: string | null | undefined): string | null => {
  if (!cnpj) return null
  const cleanCnpj = cnpj.replace(/\D/g, '')
  if (cleanCnpj.length !== 14) return cnpj
  return cleanCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export function PrintCustomerTicket({ order, restaurantInfo, newItemIds }: PrintCustomerTicketProps) {
  const isDelivery = order.order_type === "delivery"
  const timestamp = new Date(order.created_at)

  return (
    <div className="print-customer hidden print:block bg-white text-black font-mono overflow-visible font-bold" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '2mm 1mm', boxSizing: 'border-box', pageBreakInside: 'auto', height: 'auto', minHeight: 'auto', lineHeight: '1.3', fontSize: '15px', fontWeight: 'bold' }}>
      {/* Header do Estabelecimento */}
      <div className="text-center border-b border-black pb-2 mb-2" style={{ borderBottomWidth: '2px' }}>
        <div className="mb-1">
          <h1 className="font-bold uppercase leading-tight" style={{ fontSize: '20px', letterSpacing: '0.5px', fontWeight: 'bold' }}>
            {restaurantInfo?.name || "CAFEREAL"}
          </h1>
        </div>
        {restaurantInfo?.address && (
          <p className="leading-tight mb-0.5 font-bold" style={{ fontSize: '13px', wordBreak: 'break-word', overflowWrap: 'break-word', fontWeight: 'bold' }}>
            {restaurantInfo.address}
          </p>
        )}
        {restaurantInfo?.phone && (
          <p className="font-bold" style={{ fontSize: '13px', fontWeight: 'bold' }}>Tel: {restaurantInfo.phone}</p>
        )}
        {restaurantInfo?.cnpj && (
          <p className="font-bold" style={{ fontSize: '13px', fontWeight: 'bold' }}>CNPJ: {formatCNPJ(restaurantInfo.cnpj)}</p>
        )}
      </div>

      {/* Linha Separadora */}
      <div className="text-center mb-2" style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '2px 0' }}>
        <p className="font-bold uppercase" style={{ fontSize: '16px', fontWeight: 'bold' }}>COMANDA DO CLIENTE</p>
      </div>

      {/* Informações do Pedido */}
      <div className="mb-2 pb-2" style={{ borderBottom: '1px dashed #000' }}>
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold" style={{ fontSize: '16px', fontWeight: 'bold' }}>PEDIDO:</span>
          <span className="font-bold" style={{ fontSize: '16px', fontWeight: 'bold' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>Data:</span>
          <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>{timestamp.toLocaleDateString("pt-BR")}</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>Hora:</span>
          <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>{timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        {!isDelivery && (
          <div className="flex justify-between items-center">
            <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>Local:</span>
            <span className="font-bold uppercase" style={{ fontSize: '15px', fontWeight: 'bold' }}>
              {order.table_number === 0 ? "BALCÃO" : `MESA ${order.table_number}`}
            </span>
          </div>
        )}
        {order.customer_name && (
          <div className="flex justify-between items-center mt-1">
            <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>Cliente:</span>
            <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>{order.customer_name}</span>
          </div>
        )}
        {order.payment_method && (
          <div className="flex justify-between items-center mt-1">
            <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>Pagamento:</span>
            <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>{order.payment_method}</span>
          </div>
        )}
      </div>

      {/* Aviso de Itens Adicionados */}
      {newItemIds && newItemIds.size > 0 && (
        <div className="mb-2 pb-2 text-center" style={{ borderBottom: '1px dashed #000' }}>
          <p className="font-bold uppercase" style={{ fontSize: '16px', fontWeight: 'bold' }}>✨ ITENS ADICIONADOS ✨</p>
        </div>
      )}

      {/* Itens do Pedido - Formato Tabular */}
      <div className="mb-2 pb-2" style={{ borderBottom: '2px solid #000' }}>
        <p className="font-bold uppercase mb-1" style={{ fontSize: '16px', fontWeight: 'bold' }}>SEU PEDIDO</p>
        <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '2px 0' }}>
          {order.order_items.map((item, index) => {
            const extrasPrice = (item.order_item_extras || []).reduce(
              (sum, extra) => sum + extra.extra_price * extra.quantity,
              0
            )
            const itemTotal = item.subtotal + extrasPrice
            const isNewItem = newItemIds?.has(item.id)

            return (
              <div key={item.id} className={index < order.order_items.length - 1 ? "mb-2 pb-2" : ""} style={index < order.order_items.length - 1 ? { borderBottom: '1px dashed #ccc' } : {}}>
                {isNewItem && (
                  <div className="mb-1 text-center">
                    <span className="font-bold uppercase" style={{ fontSize: '13px', backgroundColor: '#e3f2fd', padding: '1px 4px', fontWeight: 'bold' }}>✨ NOVO ✨</span>
                  </div>
                )}
                {/* Linha principal: Qtd x Descrição */}
                <div className="flex justify-between items-start mb-0.5">
                  <div className="flex-1" style={{ maxWidth: 'calc(100% - 60px)' }}>
                    {item.category_name && (
                      <span className="uppercase font-bold" style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>[{item.category_name}] </span>
                    )}
                    <span className="font-bold" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      {item.quantity}x {item.product_name}
                    </span>
                  </div>
                  <div className="text-right" style={{ minWidth: '55px' }}>
                    <span className="font-bold" style={{ fontSize: '16px', fontWeight: 'bold' }}>R$ {itemTotal.toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
                {/* Variação */}
                {item.variety_name && (
                  <div className="ml-2 mb-0.5">
                    <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>Tamanho: </span>
                    <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>{item.variety_name}</span>
                  </div>
                )}
                {/* Extras */}
                {item.order_item_extras && item.order_item_extras.length > 0 && (
                  <div className="ml-2 mb-0.5">
                    {item.order_item_extras.map((extra) => (
                      <div key={extra.id} className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>
                        + {extra.extra_name}
                        {extra.quantity > 1 && <span className="font-bold" style={{ fontWeight: 'bold' }}> (x{extra.quantity})</span>}
                      </div>
                    ))}
                  </div>
                )}
                {/* Observações do item */}
                {item.notes && (
                  <div className="ml-2 mt-0.5">
                    <span className="font-bold italic" style={{ fontSize: '15px', fontWeight: 'bold' }}>OBS: {item.notes}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Observações Gerais */}
      {order.notes && (
        <div className="mb-2 pb-2" style={{ borderBottom: '1px dashed #000' }}>
          <p className="font-bold uppercase mb-0.5" style={{ fontSize: '16px', fontWeight: 'bold' }}>OBSERVAÇÕES</p>
          <p className="font-bold whitespace-pre-wrap" style={{ fontSize: '15px', fontWeight: 'bold', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {order.notes}
          </p>
        </div>
      )}

      {/* Resumo Financeiro */}
      <div className="mb-2 pb-2" style={{ borderBottom: '2px solid #000' }}>
        <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '2px 0' }}>
          <div className="flex justify-between items-center mb-1">
            <span className="font-bold" style={{ fontSize: '16px', fontWeight: 'bold' }}>Subtotal:</span>
            <span className="font-bold" style={{ fontSize: '16px', fontWeight: 'bold' }}>
              R$ {(isDelivery && order.delivery_fee ? order.total - order.delivery_fee : order.total).toFixed(2).replace(".", ",")}
            </span>
          </div>
          {isDelivery && order.delivery_fee && order.delivery_fee > 0 && (
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold" style={{ fontSize: '16px', fontWeight: 'bold' }}>Taxa de Entrega:</span>
              <span className="font-bold" style={{ fontSize: '16px', fontWeight: 'bold' }}>R$ {order.delivery_fee.toFixed(2).replace(".", ",")}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1 mt-1" style={{ borderTop: '1px solid #000' }}>
            <span className="font-bold uppercase" style={{ fontSize: '18px', fontWeight: 'bold' }}>TOTAL:</span>
            <span className="font-bold" style={{ fontSize: '18px', fontWeight: 'bold' }}>R$ {order.total.toFixed(2).replace(".", ",")}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-2 pt-2" style={{ borderTop: '1px solid #000' }}>
        <p className="font-bold uppercase mb-0.5" style={{ fontSize: '15px', fontWeight: 'bold' }}>{restaurantInfo?.name || "CAFEREAL"}</p>
        <p className="font-bold mb-0.5" style={{ fontSize: '15px', fontWeight: 'bold' }}>Obrigado pela preferência!</p>
        <p className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>Volte sempre!</p>
      </div>

      {/* Linha de Corte */}
      <div className="text-center mt-2 pt-1">
        <p className="font-bold" style={{ fontSize: '15px', letterSpacing: '1px', fontWeight: 'bold' }}>{"=".repeat(40)}</p>
      </div>
    </div>
  )
}
