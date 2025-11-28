import { createClient } from "@/lib/supabase/server"
import { ProductsClient } from "@/components/admin/products-client"

export const revalidate = 0

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: products } = await supabase.from("products").select("*, categories(name)").order("display_order")

  const { data: categories } = await supabase.from("categories").select("*").eq("active", true).order("display_order")

  return <ProductsClient products={products || []} categories={categories || []} />
}
