import { createClient } from "@/lib/supabase/server"
import { OrdersClient } from "@/components/orders/orders-client"

export const revalidate = 0 // Disable caching for real-time updates

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  // Fetch all orders with their items, varieties, and extras
  // Incluindo "delivered" para que pedidos não sumam após serem marcados como entregues
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
    .order("created_at", { ascending: false })

  // Fetch all tables (only active ones for display)
  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("active", true)
    .order("table_number")

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

  return <OrdersClient orders={orders || []} tables={tables || []} restaurantInfo={restaurantInfo} />
}
