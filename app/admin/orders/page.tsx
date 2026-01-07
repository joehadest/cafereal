import { createClient } from "@/lib/supabase/server"
import { OrdersClient } from "@/components/orders/orders-client"

export const revalidate = 10 // Cache por 10 segundos para melhor performance

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  // Executar todas as consultas em paralelo para melhor performance
  const [ordersResult, tablesResult, restaurantSettingsResult] = await Promise.all([
    // Fetch all orders with their items, varieties, and extras
    // Incluindo "delivered" para que pedidos não sumam após serem marcados como entregues
    supabase
      .from("orders")
      .select(`
        *,
        order_items(
          *,
          order_item_extras(*)
        )
      `)
      .in("status", ["pending", "preparing", "ready", "out_for_delivery", "delivered"])
      .order("created_at", { ascending: false }),

    // Fetch all tables (only active ones for display)
    supabase
      .from("restaurant_tables")
      .select("*")
      .eq("active", true)
      .order("table_number"),

    // Buscar informações do restaurante
    supabase
      .from("restaurant_settings")
      .select("name, phone, address, cnpj, logo_url, opening_hours, instagram, facebook, whatsapp")
      .single(),
  ])

  const orders = ordersResult.data
  const tables = tablesResult.data
  const restaurantSettings = restaurantSettingsResult.data

  const restaurantInfo = restaurantSettings
    ? {
        name: restaurantSettings.name || "CafeReal",
        phone: restaurantSettings.phone || undefined,
        address: restaurantSettings.address || undefined,
        cnpj: restaurantSettings.cnpj || undefined,
        logo_url: restaurantSettings.logo_url || undefined,
        opening_hours: restaurantSettings.opening_hours || undefined,
        instagram: restaurantSettings.instagram || undefined,
        facebook: restaurantSettings.facebook || undefined,
        whatsapp: restaurantSettings.whatsapp || undefined,
      }
    : {
        name: "CafeReal",
        phone: undefined,
        address: undefined,
        cnpj: undefined,
        logo_url: undefined,
        opening_hours: undefined,
        instagram: undefined,
        facebook: undefined,
        whatsapp: undefined,
      }

  return <OrdersClient orders={orders || []} tables={tables || []} restaurantInfo={restaurantInfo} />
}
