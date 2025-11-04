import { createClient } from "@/lib/supabase/server"
import { MenuClient } from "@/components/menu/menu-client"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: restaurantSettings } = await supabase
    .from("restaurant_settings")
    .select(
      "name, logo_url, delivery_fee, min_order_value, phone, email, address, opening_hours, instagram, facebook, whatsapp, accepts_delivery, accepts_pickup, accepts_dine_in"
    )
    .single()

  // Fetch categories with products
  const { data: categories } = await supabase
    .from("categories")
    .select("*, products(*)")
    .eq("active", true)
    .order("display_order")

  // Fetch available tables
  const { data: tables } = await supabase.from("restaurant_tables").select("*").order("table_number")

  return (
    <MenuClient
      categories={categories || []}
      tables={tables || []}
      restaurantName={restaurantSettings?.name || "Cardápio Digital"}
      restaurantLogo={restaurantSettings?.logo_url || null}
      deliveryFeeSetting={restaurantSettings?.delivery_fee ?? 0}
      restaurantInfo={{
        name: restaurantSettings?.name || "Cardápio Digital",
        logoUrl: restaurantSettings?.logo_url || null,
        address: restaurantSettings?.address ?? null,
        phone: restaurantSettings?.phone ?? null,
        email: restaurantSettings?.email ?? null,
        opening_hours: restaurantSettings?.opening_hours ?? null,
        instagram: restaurantSettings?.instagram ?? null,
        facebook: restaurantSettings?.facebook ?? null,
        whatsapp: restaurantSettings?.whatsapp ?? null,
        delivery_fee: restaurantSettings?.delivery_fee ?? null,
        min_order_value: restaurantSettings?.min_order_value ?? null,
        accepts_delivery: restaurantSettings?.accepts_delivery ?? null,
        accepts_pickup: restaurantSettings?.accepts_pickup ?? null,
        accepts_dine_in: restaurantSettings?.accepts_dine_in ?? null,
      }}
    />
  )
}
