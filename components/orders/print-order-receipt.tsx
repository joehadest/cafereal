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
    logo_url?: string
    opening_hours?: string
    instagram?: string
    facebook?: string
    whatsapp?: string
  }
  deliveryZoneName?: string
  newItemIds?: Set<string>
}

// Função para formatar CNPJ
const formatCNPJ = (cnpj: string | null | undefined): string | null => {
  if (!cnpj) return null
  const cleanCnpj = cnpj.replace(/\D/g, '')
  if (cleanCnpj.length !== 14) return cnpj
  return cleanCnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

// Função para formatar telefone
const formatPhone = (phone: string | null | undefined): string | null => {
  if (!phone) return null
  const numbers = phone.replace(/\D/g, "")
  if (numbers.length <= 10) {
    return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, (match, p1, p2, p3) => {
      if (p3) return `(${p1}) ${p2}-${p3}`
      if (p2) return `(${p1}) ${p2}`
      if (p1) return `(${p1}`
      return numbers
    })
  } else {
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, (match, p1, p2, p3) => {
      if (p3) return `(${p1}) ${p2}-${p3}`
      if (p2) return `(${p1}) ${p2}`
      if (p1) return `(${p1}`
      return numbers
    })
  }
}

// Função para gerar código de barras visual simples
const generateBarcode = (text: string): string => {
  // Código de barras visual usando caracteres Unicode para impressão térmica
  // Usa padrão de barras simples baseado no código
  const barcodePattern = "█▉▊▋▌▍▎▏"
  let result = ""
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i)
    const patternIndex = charCode % barcodePattern.length
    result += barcodePattern[patternIndex]
  }
  return result
}

export function PrintOrderReceipt({ order, restaurantInfo, deliveryZoneName, newItemIds }: PrintOrderReceiptProps) {
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
    <div className="print-receipt print:block bg-white text-black font-mono font-bold" style={{ width: '80mm', maxWidth: '80mm', minWidth: '80mm', margin: '0', padding: '2mm 1mm 0 1mm', boxSizing: 'border-box', overflow: 'visible', wordWrap: 'break-word', display: 'block', visibility: 'visible', pageBreakInside: 'avoid', height: 'auto', minHeight: '0', lineHeight: '1.2', fontSize: '12px', fontWeight: 'bold' }}>
      {/* Header do Estabelecimento */}
      <div className="text-center border-b border-black pb-1 mb-1" style={{ borderBottomWidth: '1px', padding: '2px 0' }}>
        <h1 className="font-bold uppercase leading-tight" style={{ fontSize: '16px', letterSpacing: '0.5px', fontWeight: 'bold', marginBottom: '2px' }}>
          {restaurantInfo?.name || "CAFEREAL"}
        </h1>
        {restaurantInfo?.address && (
          <p className="leading-tight font-bold" style={{ fontSize: '10px', wordBreak: 'break-word', overflowWrap: 'break-word', fontWeight: 'bold', margin: '1px 0' }}>
            {restaurantInfo.address}
          </p>
        )}
        <div className="flex justify-center gap-2" style={{ fontSize: '10px', marginTop: '1px' }}>
          {restaurantInfo?.phone && (
            <span className="font-bold" style={{ fontWeight: 'bold' }}>Tel: {restaurantInfo.phone}</span>
          )}
          {restaurantInfo?.cnpj && (
            <span className="font-bold" style={{ fontWeight: 'bold' }}>CNPJ: {formatCNPJ(restaurantInfo.cnpj)}</span>
          )}
        </div>
        <p className="font-bold text-center" style={{ fontSize: '9px', fontWeight: 'bold', marginTop: '2px', marginBottom: '1px' }}>CUPOM NÃO FISCAL</p>
      </div>

      {/* Linha Separadora */}
      <div className="text-center mb-1" style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '1px 0' }}>
        <p className="font-bold uppercase" style={{ fontSize: '12px', fontWeight: 'bold' }}>COMPROVANTE DE PEDIDO</p>
      </div>

      {/* Informações do Pedido - Compacto */}
      <div className="mb-1 pb-1" style={{ borderBottom: '1px dashed #000', padding: '2px 0' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '1px' }}>
          <span className="font-bold" style={{ fontSize: '12px', fontWeight: 'bold' }}>PEDIDO: #{order.id.slice(0, 8).toUpperCase()}</span>
          <span className="font-bold" style={{ fontSize: '12px', fontWeight: 'bold' }}>
            {timestamp.toLocaleDateString("pt-BR")} {timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold uppercase" style={{ fontSize: '12px', fontWeight: 'bold' }}>
            {isDelivery ? "DELIVERY" : order.table_number === 0 ? "BALCÃO" : `MESA ${order.table_number}`}
          </span>
          <span className="font-bold" style={{ fontSize: '12px', fontWeight: 'bold' }}>
            {statusMap[order.status as keyof typeof statusMap] || order.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Informações do Cliente - Compacto */}
      {(order.customer_name || order.payment_method || (isDelivery && order.customer_phone)) && (
        <div className="mb-1 pb-1" style={{ borderBottom: '1px dashed #000', padding: '2px 0' }}>
          <p className="font-bold uppercase" style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '2px' }}>DADOS DO CLIENTE</p>
          {order.customer_name && (
            <div style={{ marginBottom: '1px' }}>
              <span className="font-bold" style={{ fontSize: '11px', fontWeight: 'bold' }}>Cliente: {order.customer_name}</span>
              {isDelivery && order.customer_phone && (
                <span className="font-bold" style={{ fontSize: '11px', fontWeight: 'bold' }}> | Tel: {formatPhone(order.customer_phone) || order.customer_phone}</span>
              )}
            </div>
          )}
          {isDelivery && deliveryZoneName && (
            <div style={{ marginBottom: '1px' }}>
              <span className="font-bold" style={{ fontSize: '11px', fontWeight: 'bold' }}>Zona: {deliveryZoneName}</span>
            </div>
          )}
          {order.payment_method && (
            <div style={{ marginBottom: '1px' }}>
              <span className="font-bold" style={{ fontSize: '11px', fontWeight: 'bold' }}>Pagamento: {order.payment_method}</span>
            </div>
          )}
          {order.waiter_name && (
            <div style={{ marginBottom: '1px' }}>
              <span className="font-bold" style={{ fontSize: '11px', fontWeight: 'bold' }}>Garçom: {order.waiter_name}</span>
            </div>
          )}
          {isDelivery && order.delivery_address && (
            <div style={{ marginBottom: '1px' }}>
              <span className="font-bold" style={{ fontSize: '11px', fontWeight: 'bold', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                End: {order.delivery_address.replace(/\n/g, ", ").replace(/\s+/g, " ").trim()}
              </span>
            </div>
          )}
          {isDelivery && order.reference_point && (
            <div>
              <span className="font-bold" style={{ fontSize: '11px', fontWeight: 'bold', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                Ref: {order.reference_point.trim()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Aviso de Itens Adicionados */}
      {newItemIds && newItemIds.size > 0 && (
        <div className="mb-1 pb-1 text-center" style={{ borderBottom: '1px dashed #000', padding: '1px 0' }}>
          <p className="font-bold uppercase" style={{ fontSize: '12px', fontWeight: 'bold' }}>⚠️ ITENS ADICIONADOS ⚠️</p>
        </div>
      )}

      {/* Itens do Pedido - Compacto */}
      <div className="mb-1 pb-1" style={{ borderBottom: '1px solid #000', padding: '2px 0' }}>
        <p className="font-bold uppercase" style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>ITENS DO PEDIDO</p>
        {order.order_items.map((item, index) => {
          const extrasPrice = (item.order_item_extras || []).reduce(
            (sum, extra) => sum + extra.extra_price * extra.quantity,
            0
          )
          const itemTotal = item.subtotal + extrasPrice
          const isNewItem = newItemIds?.has(item.id)

          return (
            <div key={item.id} style={index < order.order_items.length - 1 ? { borderBottom: '1px dashed #ccc', paddingBottom: '2px', marginBottom: '2px' } : {}}>
              {isNewItem && (
                <div className="text-center" style={{ marginBottom: '1px' }}>
                  <span className="font-bold uppercase" style={{ fontSize: '10px', backgroundColor: '#ffeb3b', padding: '1px 3px', fontWeight: 'bold' }}>✨ NOVO ✨</span>
                </div>
              )}
              {/* Linha principal: Qtd x Descrição + Preço */}
              <div className="flex justify-between items-start" style={{ marginBottom: '1px' }}>
                <div className="flex-1" style={{ maxWidth: 'calc(100% - 55px)' }}>
                  {item.category_name && (
                    <span className="uppercase font-bold" style={{ fontSize: '9px', color: '#666', fontWeight: 'bold' }}>[{item.category_name}] </span>
                  )}
                  <span className="font-bold" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    {item.quantity}x {item.product_name}
                  </span>
                </div>
                <div className="text-right" style={{ minWidth: '50px' }}>
                  <span className="font-bold" style={{ fontSize: '12px', fontWeight: 'bold' }}>R$ {itemTotal.toFixed(2).replace(".", ",")}</span>
                </div>
              </div>
              {/* Variação e Extras - Compacto */}
              {(item.variety_name || (item.order_item_extras && item.order_item_extras.length > 0)) && (
                <div style={{ marginLeft: '8px', marginBottom: '1px', fontSize: '10px' }}>
                  {item.variety_name && (
                    <span className="font-bold" style={{ fontWeight: 'bold' }}>Tam: {item.variety_name}</span>
                  )}
                  {item.order_item_extras && item.order_item_extras.length > 0 && (
                    <span className="font-bold" style={{ fontWeight: 'bold' }}>
                      {item.variety_name ? ' | ' : ''}
                      {item.order_item_extras.map((extra, idx) => (
                        <span key={extra.id}>
                          {idx > 0 ? ', ' : ''}+ {extra.extra_name}{extra.quantity > 1 && ` (x${extra.quantity})`}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
              )}
              {/* Observações do item ou informações de peso */}
              {item.notes && (
                <div style={{ marginLeft: '8px', fontSize: '10px' }}>
                  {item.notes.includes("Peso:") ? (
                    <span className="font-bold" style={{ fontWeight: 'bold' }}>{item.notes}</span>
                  ) : (
                    <span className="font-bold italic" style={{ fontWeight: 'bold' }}>OBS: {item.notes}</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Observações Gerais */}
      {order.notes && (
        <div className="mb-1 pb-1" style={{ borderBottom: '1px dashed #000', padding: '2px 0' }}>
          <p className="font-bold uppercase" style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '1px' }}>OBSERVAÇÕES GERAIS</p>
          <p className="font-bold whitespace-pre-wrap" style={{ fontSize: '11px', fontWeight: 'bold', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {order.notes}
          </p>
        </div>
      )}

      {/* Resumo Financeiro - Compacto */}
      <div className="mb-1 pb-1" style={{ borderBottom: '1px solid #000', padding: '2px 0' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: '1px' }}>
          <span className="font-bold" style={{ fontSize: '11px', fontWeight: 'bold' }}>Subtotal:</span>
          <span className="font-bold" style={{ fontSize: '11px', fontWeight: 'bold' }}>
            R$ {(isDelivery && order.delivery_fee ? order.total - order.delivery_fee : order.total).toFixed(2).replace(".", ",")}
          </span>
        </div>
        {isDelivery && order.delivery_fee && order.delivery_fee > 0 && (
          <div className="flex justify-between items-center" style={{ marginBottom: '2px' }}>
            <span className="font-bold" style={{ fontSize: '11px', fontWeight: 'bold' }}>Taxa de Entrega:</span>
            <span className="font-bold" style={{ fontSize: '11px', fontWeight: 'bold' }}>R$ {order.delivery_fee.toFixed(2).replace(".", ",")}</span>
          </div>
        )}
        <div className="flex justify-between items-center" style={{ borderTop: '1px solid #000', paddingTop: '2px', marginTop: '2px' }}>
          <span className="font-bold uppercase" style={{ fontSize: '14px', fontWeight: 'bold' }}>TOTAL:</span>
          <span className="font-bold" style={{ fontSize: '14px', fontWeight: 'bold' }}>R$ {order.total.toFixed(2).replace(".", ",")}</span>
        </div>
      </div>

      {/* Código de Barras do Pedido */}
      <div className="text-center mt-1 pt-1" style={{ borderTop: '1px dashed #000', paddingTop: '2px' }}>
        <p className="font-bold" style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '1px' }}>CÓDIGO DO PEDIDO</p>
        <p className="font-mono" style={{ fontSize: '14px', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '1px' }}>
          {order.id.slice(0, 8).toUpperCase()}
        </p>
        <div className="font-mono" style={{ fontSize: '8px', letterSpacing: '0.5px', lineHeight: '1' }}>
          {generateBarcode(order.id.slice(0, 8).toUpperCase())}
        </div>
      </div>

      {/* Footer - Compacto */}
      <div className="text-center mt-1 pt-1" style={{ borderTop: '1px solid #000', paddingTop: '2px' }}>
        <p className="font-bold uppercase" style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '1px' }}>{restaurantInfo?.name || "CAFEREAL"}</p>
        {restaurantInfo?.opening_hours && (
          <p className="font-bold" style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '1px' }}>
            {restaurantInfo.opening_hours.split('\n').slice(0, 1).join(' | ')}
          </p>
        )}
        <div className="flex justify-center gap-2" style={{ fontSize: '9px', marginBottom: '1px' }}>
          {restaurantInfo?.instagram && (
            <span className="font-bold" style={{ fontWeight: 'bold' }}>📷 @{restaurantInfo.instagram.replace('@', '').split('/').pop()}</span>
          )}
          {restaurantInfo?.whatsapp && (
            <span className="font-bold" style={{ fontWeight: 'bold' }}>💬 {formatPhone(restaurantInfo.whatsapp) || restaurantInfo.whatsapp}</span>
          )}
        </div>
        <p className="font-bold" style={{ fontSize: '10px', fontWeight: 'bold' }}>Obrigado pela preferência!</p>
      </div>

      {/* Linha de Corte */}
      <div className="text-center mt-1 pt-1" style={{ marginBottom: '0', paddingBottom: '0' }}>
        <p className="font-bold" style={{ fontSize: '10px', letterSpacing: '0.5px', fontWeight: 'bold', marginBottom: '0' }}>{"=".repeat(35)}</p>
      </div>
    </div>
  )
}
