export type OrderItemExtra = {
  id: string
  order_item_id: string
  extra_id: string
  extra_name: string
  extra_price: number
  quantity: number
}

export type OrderItem = {
  id: string
  product_name: string
  category_name?: string | null
  product_price: number
  quantity: number
  subtotal: number
  notes: string | null
  variety_id?: string | null
  variety_name?: string | null
  variety_price?: number | null
  order_item_extras?: OrderItemExtra[]
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
  reference_point?: string | null
  delivery_fee?: number
  created_at: string
  order_items: OrderItem[]
}
