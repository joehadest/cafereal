"use client"

import type { Order } from "@/types/order"

interface PrintKitchenTicketProps {
  order: Order
  restaurantName?: string
  newItemIds?: Set<string>
}

export function PrintKitchenTicket({ order, restaurantName, newItemIds }: PrintKitchenTicketProps) {
  const isDelivery = order.order_type === "delivery"
  const timestamp = new Date(order.created_at)

  return (
    <div className="print-kitchen hidden print:block bg-white text-black font-mono overflow-visible" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '2mm 1mm', boxSizing: 'border-box', pageBreakInside: 'auto', height: 'auto', minHeight: 'auto', lineHeight: '1.3', fontSize: '11px' }}>
      {/* Header - Destacado */}
      <div className="text-center border-b border-black pb-2 mb-2" style={{ borderBottomWidth: '2px' }}>
        <div className="mb-1">
          <h1 className="text-base font-bold uppercase leading-tight" style={{ fontSize: '16px', letterSpacing: '0.5px' }}>
            {restaurantName || "CAFEREAL"}
          </h1>
        </div>
        <div className="mt-1 mb-1" style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '2px 0' }}>
          <p className="text-[12px] font-bold uppercase">COMANDA DE COZINHA</p>
        </div>
      </div>

      {/* Tipo e Mesa/Delivery - Destaque */}
      <div className="mb-2 pb-2 text-center" style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '4px 0', backgroundColor: '#f0f0f0' }}>
        <p className="text-lg font-bold uppercase" style={{ fontSize: '18px' }}>
          {isDelivery ? "DELIVERY" : order.table_number === 0 ? "BALCÃO" : `MESA ${order.table_number}`}
        </p>
      </div>

      {/* Informações do Pedido */}
      <div className="mb-2 pb-2" style={{ borderBottom: '1px dashed #000' }}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[12px] font-bold">PEDIDO:</span>
          <span className="text-[12px] font-bold">#{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[12px]">Data:</span>
          <span className="text-[12px]">{timestamp.toLocaleDateString("pt-BR")}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[12px]">Hora:</span>
          <span className="text-[12px] font-bold">{timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      {/* Aviso de Itens Adicionados */}
      {newItemIds && newItemIds.size > 0 && (
        <div className="mb-2 pb-2 text-center" style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '4px 0', backgroundColor: '#ffebee' }}>
          <p className="text-[12px] font-bold uppercase">⚠️ ITENS ADICIONADOS ⚠️</p>
        </div>
      )}

      {/* Itens - Formato Organizado */}
      <div className="mb-2 pb-2" style={{ borderBottom: '2px solid #000' }}>
        <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '2px 0' }}>
          {order.order_items.map((item, index) => {
            const isNewItem = newItemIds?.has(item.id)
            return (
              <div key={item.id} className={index < order.order_items.length - 1 ? "mb-2 pb-2" : ""} style={index < order.order_items.length - 1 ? { borderBottom: '1px dashed #ccc' } : {}}>
                {isNewItem && (
                  <div className="mb-1 text-center">
                    <span className="text-[11px] font-bold uppercase" style={{ backgroundColor: '#ffcdd2', padding: '1px 4px' }}>✨ NOVO ✨</span>
                  </div>
                )}
                {/* Quantidade e Nome do Produto */}
                <div className="mb-0.5">
                  {item.category_name && (
                    <span className="text-[10px] uppercase" style={{ color: '#666' }}>[{item.category_name}] </span>
                  )}
                  <span className="text-sm font-bold uppercase" style={{ fontSize: '14px' }}>
                    {item.quantity}x {item.product_name}
                  </span>
                </div>
                {/* Variação */}
                {item.variety_name && (
                  <div className="ml-2 mb-0.5">
                    <span className="text-[12px] font-bold uppercase">TAMANHO: {item.variety_name.toUpperCase()}</span>
                  </div>
                )}
                {/* Extras */}
                {item.order_item_extras && item.order_item_extras.length > 0 && (
                  <div className="ml-2 mb-0.5">
                    <span className="text-[11px] font-bold uppercase">EXTRAS:</span>
                    {item.order_item_extras.map((extra) => (
                      <div key={extra.id} className="text-[11px] ml-1">
                        + {extra.extra_name.toUpperCase()} {extra.quantity > 1 && `(x${extra.quantity})`}
                      </div>
                    ))}
                  </div>
                )}
                {/* Observações do item */}
                {item.notes && (
                  <div className="ml-2 mt-1" style={{ borderLeft: '3px solid #ff9800', paddingLeft: '4px', backgroundColor: '#fff3e0' }}>
                    <p className="text-[11px] font-bold uppercase mb-0.5">OBSERVAÇÃO:</p>
                    <p className="text-[11px]">{item.notes}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Observações Gerais */}
      {order.notes && (
        <div className="mb-2 pb-2" style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '4px', backgroundColor: '#ffebee' }}>
          <p className="text-[12px] font-bold uppercase mb-1">⚠️ ATENÇÃO - OBSERVAÇÃO GERAL:</p>
          <p className="text-[12px] font-bold whitespace-pre-wrap" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {order.notes}
          </p>
        </div>
      )}

      {/* Info Cliente */}
      {(order.customer_name || order.payment_method || (isDelivery && order.customer_phone)) && (
        <div className="mb-2 pb-2" style={{ borderBottom: '1px dashed #000' }}>
          <p className="text-[12px] font-bold uppercase mb-1">INFORMAÇÕES DO CLIENTE</p>
          {order.customer_name && (
            <div className="mb-0.5">
              <span className="text-[11px]">Cliente: </span>
              <span className="text-[11px] font-bold">{order.customer_name}</span>
            </div>
          )}
          {order.payment_method && (
            <div className="mb-0.5">
              <span className="text-[11px]">Pagamento: </span>
              <span className="text-[11px] font-bold">{order.payment_method}</span>
            </div>
          )}
          {isDelivery && order.customer_phone && (
            <div className="mb-0.5">
              <span className="text-[11px]">Telefone: </span>
              <span className="text-[11px]">{order.customer_phone}</span>
            </div>
          )}
          {isDelivery && order.delivery_address && (
            <div className="mb-0.5">
              <span className="text-[11px]">Endereço: </span>
              <span className="text-[11px]" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {order.delivery_address.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()}
              </span>
            </div>
          )}
          {isDelivery && order.reference_point && (
            <div>
              <span className="text-[11px]">Ponto de Ref.: </span>
              <span className="text-[11px]" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {order.reference_point.trim()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-2 pt-2" style={{ borderTop: '1px solid #000' }}>
        <p className="text-[11px] font-bold uppercase">{restaurantName || "CAFEREAL"}</p>
      </div>

      {/* Linha de Corte */}
      <div className="text-center mt-2 pt-1">
        <p className="text-[11px]" style={{ letterSpacing: '1px' }}>{"=".repeat(40)}</p>
      </div>
    </div>
  )
}
