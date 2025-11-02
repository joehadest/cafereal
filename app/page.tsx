import { createClient } from "@/lib/supabase/server"
import { MenuClient } from "@/components/menu/menu-client"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: restaurantSettings } = await supabase.from("restaurant_settings").select("name, logo_url").single()

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
    />
  )
}
