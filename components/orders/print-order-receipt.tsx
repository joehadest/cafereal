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
  newItemIds?: Set<string>
}

// Função para formatar CNPJ
const formatCNPJ = (cnpj: string | null | undefined): string | null => {
  if (!cnpj) return null
  const cleanCnpj = cnpj.replace(/\D/g, '')
  if (cleanCnpj.length !== 14) return cnpj
  return cleanCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export function PrintOrderReceipt({ order, restaurantInfo, newItemIds }: PrintOrderReceiptProps) {
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
    <div className="print-receipt print:block bg-white text-black font-mono" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '2mm 1mm', boxSizing: 'border-box', overflow: 'visible', wordWrap: 'break-word', display: 'block', visibility: 'visible', pageBreakInside: 'auto', height: 'auto', minHeight: 'auto', lineHeight: '1.3', fontSize: '11px' }}>
      {/* Header do Estabelecimento */}
      <div className="text-center border-b border-black pb-2 mb-2" style={{ borderBottomWidth: '2px' }}>
        <div className="mb-1">
          <h1 className="text-base font-bold uppercase leading-tight" style={{ fontSize: '16px', letterSpacing: '0.5px' }}>
            {restaurantInfo?.name || "CAFEREAL"}
          </h1>
        </div>
        {restaurantInfo?.address && (
          <p className="text-[10px] leading-tight mb-0.5" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {restaurantInfo.address}
          </p>
        )}
        {restaurantInfo?.phone && (
          <p className="text-[10px]">Tel: {restaurantInfo.phone}</p>
        )}
        {restaurantInfo?.cnpj && (
          <p className="text-[10px]">CNPJ: {formatCNPJ(restaurantInfo.cnpj)}</p>
        )}
      </div>

      {/* Linha Separadora */}
      <div className="text-center mb-2" style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '2px 0' }}>
        <p className="text-[12px] font-bold uppercase">COMPROVANTE DE PEDIDO</p>
      </div>

      {/* Informações do Pedido */}
      <div className="mb-2 pb-2" style={{ borderBottom: '1px dashed #000' }}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px] font-bold">PEDIDO:</span>
          <span className="text-[11px] font-bold">#{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px]">Data:</span>
          <span className="text-[11px]">{timestamp.toLocaleDateString("pt-BR")}</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px]">Hora:</span>
          <span className="text-[11px]">{timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px]">Tipo:</span>
          <span className="text-[11px] font-bold uppercase">
            {isDelivery ? "DELIVERY" : order.table_number === 0 ? "BALCÃO" : `MESA ${order.table_number}`}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[11px]">Status:</span>
          <span className="text-[11px] font-bold">
            {statusMap[order.status as keyof typeof statusMap] || order.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Informações do Cliente */}
      {(order.customer_name || order.payment_method || (isDelivery && order.customer_phone)) && (
        <div className="mb-2 pb-2" style={{ borderBottom: '1px dashed #000' }}>
          <p className="text-[12px] font-bold uppercase mb-1">DADOS DO CLIENTE</p>
          {order.customer_name && (
            <div className="mb-0.5">
              <span className="text-[11px]">Cliente: </span>
              <span className="text-[11px] font-bold">{order.customer_name}</span>
            </div>
          )}
          {isDelivery && order.customer_phone && (
            <div className="mb-0.5">
              <span className="text-[11px]">Telefone: </span>
              <span className="text-[11px]">{order.customer_phone}</span>
            </div>
          )}
          {order.payment_method && (
            <div className="mb-0.5">
              <span className="text-[11px]">Pagamento: </span>
              <span className="text-[11px] font-bold">{order.payment_method}</span>
            </div>
          )}
          {isDelivery && order.delivery_address && (
            <div className="mb-0.5">
              <span className="text-[11px]">Endereço: </span>
              <span className="text-[11px]" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {order.delivery_address.replace(/\n/g, ", ").replace(/\s+/g, " ").trim()}
              </span>
            </div>
          )}
          {isDelivery && order.reference_point && (
            <div>
              <span className="text-[11px]">Ref.: </span>
              <span className="text-[11px]" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {order.reference_point.trim()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Aviso de Itens Adicionados */}
      {newItemIds && newItemIds.size > 0 && (
        <div className="mb-2 pb-2 text-center" style={{ borderBottom: '1px dashed #000' }}>
          <p className="text-[12px] font-bold uppercase">⚠️ ITENS ADICIONADOS ⚠️</p>
        </div>
      )}

      {/* Itens do Pedido - Formato Tabular */}
      <div className="mb-2 pb-2" style={{ borderBottom: '2px solid #000' }}>
        <p className="text-[12px] font-bold uppercase mb-1">ITENS DO PEDIDO</p>
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
                    <span className="text-[9px] font-bold uppercase" style={{ backgroundColor: '#ffeb3b', padding: '1px 4px' }}>✨ NOVO ✨</span>
                  </div>
                )}
                {/* Linha principal: Qtd x Descrição */}
                <div className="flex justify-between items-start mb-0.5">
                  <div className="flex-1" style={{ maxWidth: 'calc(100% - 50px)' }}>
                    {item.category_name && (
                      <span className="text-[10px] uppercase" style={{ color: '#666' }}>[{item.category_name}] </span>
                    )}
                    <span className="text-[12px] font-bold">
                      {item.quantity}x {item.product_name}
                    </span>
                  </div>
                  <div className="text-right" style={{ minWidth: '50px' }}>
                    <span className="text-[12px] font-bold">R$ {itemTotal.toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
                {/* Variação */}
                {item.variety_name && (
                  <div className="ml-2 mb-0.5">
                    <span className="text-[11px]">Tam: </span>
                    <span className="text-[11px] font-bold">{item.variety_name}</span>
                  </div>
                )}
                {/* Extras */}
                {item.order_item_extras && item.order_item_extras.length > 0 && (
                  <div className="ml-2 mb-0.5">
                    {item.order_item_extras.map((extra) => (
                      <div key={extra.id} className="text-[11px]">
                        + {extra.extra_name}
                        {extra.quantity > 1 && <span> (x{extra.quantity})</span>}
                      </div>
                    ))}
                  </div>
                )}
                {/* Observações do item */}
                {item.notes && (
                  <div className="ml-2 mt-0.5">
                    <span className="text-[11px] italic">OBS: {item.notes}</span>
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
          <p className="text-[12px] font-bold uppercase mb-0.5">OBSERVAÇÕES GERAIS</p>
          <p className="text-[11px] whitespace-pre-wrap" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {order.notes}
          </p>
        </div>
      )}

      {/* Resumo Financeiro */}
      <div className="mb-2 pb-2" style={{ borderBottom: '2px solid #000' }}>
        <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '2px 0' }}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[12px]">Subtotal:</span>
            <span className="text-[12px] font-bold">
              R$ {(isDelivery && order.delivery_fee ? order.total - order.delivery_fee : order.total).toFixed(2).replace(".", ",")}
            </span>
          </div>
          {isDelivery && order.delivery_fee && order.delivery_fee > 0 && (
            <div className="flex justify-between items-center mb-1">
              <span className="text-[12px]">Taxa de Entrega:</span>
              <span className="text-[12px] font-bold">R$ {order.delivery_fee.toFixed(2).replace(".", ",")}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1 mt-1" style={{ borderTop: '1px solid #000' }}>
            <span className="text-[14px] font-bold uppercase">TOTAL:</span>
            <span className="text-[14px] font-bold">R$ {order.total.toFixed(2).replace(".", ",")}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-2 pt-2" style={{ borderTop: '1px solid #000' }}>
        <p className="text-[11px] font-bold uppercase mb-0.5">{restaurantInfo?.name || "CAFEREAL"}</p>
        <p className="text-[11px] mb-0.5">Obrigado pela preferência!</p>
        <p className="text-[11px]">Volte sempre!</p>
      </div>

      {/* Linha de Corte */}
      <div className="text-center mt-2 pt-1">
        <p className="text-[11px]" style={{ letterSpacing: '1px' }}>{"=".repeat(40)}</p>
      </div>
    </div>
  )
}
