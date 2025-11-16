export type ProductVariety = {
  id: string
  product_id: string
  name: string
  price: number
  display_order: number
  active: boolean
  created_at: string
  updated_at: string
}

export type ProductExtra = {
  id: string
  product_id: string
  name: string
  price: number
  display_order: number
  active: boolean
  max_quantity: number
  created_at: string
  updated_at: string
}

export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  category_id: string | null
  display_order: number
  active: boolean
  image_url?: string
  created_at: string
  updated_at: string
  categories?: { name: string }
  varieties?: ProductVariety[]
  extras?: ProductExtra[]
}
