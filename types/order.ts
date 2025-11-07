export type OrderItem = {
  id: string
  product_name: string
  product_price: number
  quantity: number
  subtotal: number
  notes: string | null
}

export type Order = {
  id: string
  order_type: string
  table_number: number
  status: string
  total: number
  notes: string | null
  customer_name?: string | null
  customer_phone?: string | null
  delivery_address?: string | null
  delivery_fee?: number
  created_at: string
  order_items: OrderItem[]
}
