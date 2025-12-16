import { createClient } from "@/lib/supabase/server"
import { StaffOrdersClient } from "@/components/staff/staff-orders-client"

export const revalidate = 0

export default async function StaffOrdersPage() {
  const supabase = await createClient()

  // Buscar categorias com produtos ativos
  const { data: categories } = await supabase
    .from("categories")
    .select("*, products(*)")
    .eq("active", true)
    .order("display_order")

  // Filter products to only show active ones and sort by display_order
  if (categories) {
    categories.forEach((category: any) => {
      if (category.products) {
        category.products = category.products
          .filter((p: any) => p.active === true)
          .sort((a: any, b: any) => {
            if (a.display_order !== b.display_order) {
              return a.display_order - b.display_order
            }
            return a.id.localeCompare(b.id)
          })
      }
    })
  }

  // Fetch all varieties and extras separately
  const { data: allVarieties } = await supabase
    .from("product_varieties")
    .select("*")
    .order("display_order")

  const { data: allExtras } = await supabase
    .from("product_extras")
    .select("*")
    .order("display_order")

  // Map varieties and extras to products
  if (categories && allVarieties && allExtras) {
    categories.forEach((category: any) => {
      if (category.products) {
        category.products = category.products.map((product: any) => ({
          ...product,
          varieties: allVarieties.filter((v) => v.product_id === product.id),
          extras: allExtras.filter((e) => e.product_id === product.id),
        }))
      }
    })
  }

  // Buscar mesas ativas
  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("active", true)
    .order("table_number")

  // Buscar pedidos ativos do dia atual para edição
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      order_items(
        *,
        order_item_extras(*)
      )
    `)
    .in("status", ["pending", "preparing", "ready", "out_for_delivery", "delivered"])
    .gte("created_at", today.toISOString())
    .lte("created_at", todayEnd.toISOString())
    .order("created_at", { ascending: false })

  // Buscar informações do restaurante
  const { data: restaurantSettings } = await supabase
    .from("restaurant_settings")
    .select("name, phone, address, cnpj")
    .single()

  const restaurantInfo = restaurantSettings
    ? {
        name: restaurantSettings.name || "CafeReal",
        phone: restaurantSettings.phone || undefined,
        address: restaurantSettings.address || undefined,
        cnpj: restaurantSettings.cnpj || undefined,
      }
    : {
        name: "CafeReal",
        phone: undefined,
        address: undefined,
        cnpj: undefined,
      }

  return (
    <StaffOrdersClient
      categories={categories || []}
      tables={tables || []}
      orders={orders || []}
      restaurantInfo={restaurantInfo}
    />
  )
}

