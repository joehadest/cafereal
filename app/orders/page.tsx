import { createClient } from "@/lib/supabase/server"
import { OrdersClient } from "@/components/orders/orders-client"

export const revalidate = 0 // Disable caching for real-time updates

export default async function OrdersPage() {
  const supabase = await createClient()

  // Fetch all orders with their items
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .in("status", ["pending", "preparing", "ready"])
    .order("created_at", { ascending: false })

  // Fetch all tables (only active ones)
  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("active", true)
    .order("table_number")

  return <OrdersClient orders={orders || []} tables={tables || []} />
}
