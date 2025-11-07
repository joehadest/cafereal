import { createClient } from "@/lib/supabase/server"
import { OrdersClient } from "@/components/orders/orders-client"

export const revalidate = 0 // Disable caching for real-time updates

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  // Fetch all orders with their items
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .in("status", ["pending", "preparing", "ready", "out_for_delivery"])
    .order("created_at", { ascending: false })

  // Fetch all tables
  const { data: tables } = await supabase.from("restaurant_tables").select("*").order("table_number")

  const { data: restaurantSettings } = await supabase
    .from("restaurant_settings")
    .select("name, phone, address")
    .single()

  const restaurantInfo = restaurantSettings
    ? {
        name: restaurantSettings.name || "Restaurante",
        phone: restaurantSettings.phone || undefined,
        address: restaurantSettings.address || undefined,
      }
    : undefined

  return <OrdersClient orders={orders || []} tables={tables || []} restaurantInfo={restaurantInfo} />
}
