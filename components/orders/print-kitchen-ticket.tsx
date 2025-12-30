"use client"

import type { Order } from "@/types/order"

interface PrintKitchenTicketProps {
  order: Order
  restaurantName?: string
  deliveryZoneName?: string
  newItemIds?: Set<string>
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

export function PrintKitchenTicket({ order, restaurantName, deliveryZoneName, newItemIds }: PrintKitchenTicketProps) {
  const isDelivery = order.order_type === "delivery"
  const timestamp = new Date(order.created_at)

  return (
    <div className="print-kitchen hidden print:block bg-white text-black font-mono overflow-visible font-bold" style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '2mm 1mm', boxSizing: 'border-box', pageBreakInside: 'auto', height: 'auto', minHeight: 'auto', lineHeight: '1.3', fontSize: '15px', fontWeight: 'bold' }}>
      {/* Header - Destacado */}
      <div className="text-center border-b border-black pb-2 mb-2" style={{ borderBottomWidth: '2px' }}>
        <div className="mb-1">
          <h1 className="font-bold uppercase leading-tight" style={{ fontSize: '20px', letterSpacing: '0.5px', fontWeight: 'bold' }}>
            {restaurantName || "CAFEREAL"}
          </h1>
        </div>
        <div className="mt-1 mb-1" style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '2px 0' }}>
          <p className="font-bold uppercase" style={{ fontSize: '16px', fontWeight: 'bold' }}>COMANDA DE COZINHA</p>
        </div>
      </div>

      {/* Tipo e Mesa/Delivery - Destaque */}
      <div className="mb-2 pb-2 text-center" style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '4px 0', backgroundColor: '#f0f0f0' }}>
        <p className="font-bold uppercase" style={{ fontSize: '22px', fontWeight: 'bold' }}>
          {isDelivery ? "DELIVERY" : order.table_number === 0 ? "BALCÃO" : `MESA ${order.table_number}`}
        </p>
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
        <div className="flex justify-between items-center">
          <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>Hora:</span>
          <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>{timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      {/* Aviso de Itens Adicionados */}
      {newItemIds && newItemIds.size > 0 && (
        <div className="mb-2 pb-2 text-center" style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '4px 0', backgroundColor: '#ffebee' }}>
          <p className="font-bold uppercase" style={{ fontSize: '16px', fontWeight: 'bold' }}>⚠️ ITENS ADICIONADOS ⚠️</p>
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
                    <span className="font-bold uppercase" style={{ fontSize: '13px', backgroundColor: '#ffcdd2', padding: '1px 4px', fontWeight: 'bold' }}>✨ NOVO ✨</span>
                  </div>
                )}
                {/* Quantidade e Nome do Produto */}
                <div className="mb-0.5">
                  {item.category_name && (
                    <span className="uppercase font-bold" style={{ fontSize: '13px', color: '#666', fontWeight: 'bold' }}>[{item.category_name}] </span>
                  )}
                  <span className="font-bold uppercase" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {item.quantity}x {item.product_name}
                  </span>
                </div>
                {/* Variação */}
                {item.variety_name && (
                  <div className="ml-2 mb-0.5">
                    <span className="font-bold uppercase" style={{ fontSize: '16px', fontWeight: 'bold' }}>TAMANHO: {item.variety_name.toUpperCase()}</span>
                  </div>
                )}
                {/* Extras */}
                {item.order_item_extras && item.order_item_extras.length > 0 && (
                  <div className="ml-2 mb-0.5">
                    <span className="font-bold uppercase" style={{ fontSize: '15px', fontWeight: 'bold' }}>EXTRAS:</span>
                    {item.order_item_extras.map((extra) => (
                      <div key={extra.id} className="font-bold ml-1" style={{ fontSize: '15px', fontWeight: 'bold' }}>
                        + {extra.extra_name.toUpperCase()} {extra.quantity > 1 && <span className="font-bold" style={{ fontWeight: 'bold' }}>(x{extra.quantity})</span>}
                      </div>
                    ))}
                  </div>
                )}
                {/* Observações do item ou informações de peso */}
                {item.notes && (
                  <div className="ml-2 mt-1" style={{ borderLeft: '3px solid #ff9800', paddingLeft: '4px', backgroundColor: '#fff3e0' }}>
                    {item.notes.includes("Peso:") ? (
                      <>
                        <p className="font-bold uppercase mb-0.5" style={{ fontSize: '15px', fontWeight: 'bold' }}>ITEM POR PESO:</p>
                        <p className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>{item.notes}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold uppercase mb-0.5" style={{ fontSize: '15px', fontWeight: 'bold' }}>OBSERVAÇÃO:</p>
                        <p className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>{item.notes}</p>
                      </>
                    )}
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
          <p className="font-bold uppercase mb-1" style={{ fontSize: '16px', fontWeight: 'bold' }}>⚠️ ATENÇÃO - OBSERVAÇÃO GERAL:</p>
          <p className="font-bold whitespace-pre-wrap" style={{ fontSize: '16px', fontWeight: 'bold', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
            {order.notes}
          </p>
        </div>
      )}

      {/* Info Cliente */}
      {(order.customer_name || order.payment_method || (isDelivery && order.customer_phone)) && (
        <div className="mb-2 pb-2" style={{ borderBottom: '1px dashed #000' }}>
          <p className="font-bold uppercase mb-1" style={{ fontSize: '16px', fontWeight: 'bold' }}>INFORMAÇÕES DO CLIENTE</p>
          {order.customer_name && (
            <div className="mb-0.5">
              <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>Cliente: </span>
              <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>{order.customer_name}</span>
            </div>
          )}
          {order.payment_method && (
            <div className="mb-0.5">
              <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>Pagamento: </span>
              <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>{order.payment_method}</span>
            </div>
          )}
          {isDelivery && order.customer_phone && (
            <div className="mb-0.5">
              <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>Telefone: </span>
              <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>{formatPhone(order.customer_phone) || order.customer_phone}</span>
            </div>
          )}
          {isDelivery && deliveryZoneName && (
            <div className="mb-0.5">
              <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>Zona: </span>
              <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>{deliveryZoneName}</span>
            </div>
          )}
          {isDelivery && order.delivery_address && (
            <div className="mb-0.5">
              <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>Endereço: </span>
              <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {order.delivery_address.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()}
              </span>
            </div>
          )}
          {isDelivery && order.reference_point && (
            <div>
              <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold' }}>Ponto de Ref.: </span>
              <span className="font-bold" style={{ fontSize: '15px', fontWeight: 'bold', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {order.reference_point.trim()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center mt-2 pt-2" style={{ borderTop: '1px solid #000' }}>
        <p className="font-bold uppercase" style={{ fontSize: '15px', fontWeight: 'bold' }}>{restaurantName || "CAFEREAL"}</p>
      </div>

      {/* Linha de Corte */}
      <div className="text-center mt-2 pt-1">
        <p className="font-bold" style={{ fontSize: '15px', letterSpacing: '1px', fontWeight: 'bold' }}>{"=".repeat(40)}</p>
      </div>
    </div>
  )
}
