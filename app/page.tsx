import { createClient } from "@/lib/supabase/server"
import { MenuClient } from "@/components/menu/menu-client"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  
  // Buscar informações da mesa se table estiver presente
  let tableNumber: number | null = null
  let tableQuery: Promise<any> | null = null
  if (params.table) {
    const tableNum = parseInt(params.table)
    if (!isNaN(tableNum)) {
      tableQuery = supabase
        .from("restaurant_tables")
        .select("table_number, active")
        .eq("table_number", tableNum)
        .eq("active", true)
        .single()
    }
  }

  // Executar todas as consultas em paralelo para melhor performance
  const [
    tableResult,
    restaurantSettingsResult,
    categoriesResult,
    allVarietiesResult,
    allExtrasResult,
    deliveryZonesResult,
  ] = await Promise.all([
    tableQuery || Promise.resolve({ data: null }),
    supabase
      .from("restaurant_settings")
      .select(
        "name, logo_url, delivery_fee, min_order_value, phone, email, address, opening_hours, instagram, facebook, whatsapp, pix_key, accepts_delivery, accepts_pickup, accepts_dine_in"
      )
      .single(),
    supabase
      .from("categories")
      .select("*, products(*)")
      .eq("active", true)
      .order("display_order"),
    supabase
      .from("product_varieties")
      .select("*")
      .order("display_order"),
    supabase
      .from("product_extras")
      .select("*")
      .order("display_order"),
    supabase
      .from("delivery_zones")
      .select("*")
      .eq("active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
  ])

  if (tableResult.data) {
    tableNumber = tableResult.data.table_number
  }

  const restaurantSettings = restaurantSettingsResult.data
  const categories = categoriesResult.data
  const allVarieties = allVarietiesResult.data
  const allExtras = allExtrasResult.data
  const deliveryZones = deliveryZonesResult.data

  // Debug: verificar se whatsapp está sendo carregado do banco
  console.log("[Server] WhatsApp do banco:", restaurantSettings?.whatsapp)
  
  // Filter products to only show active ones and sort by display_order, but keep all active categories
  if (categories) {
    categories.forEach((category: any) => {
      if (category.products) {
        category.products = category.products
          .filter((p: any) => p.active === true)
          .sort((a: any, b: any) => {
            // Ordenar por display_order, e se for igual, por ID para garantir ordem consistente
            if (a.display_order !== b.display_order) {
              return a.display_order - b.display_order
            }
            return a.id.localeCompare(b.id)
          })
      }
    })
  }

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

  return (
      <MenuClient
      categories={categories || []}
      restaurantName={restaurantSettings?.name || "Cardápio Digital"}
      restaurantLogo={restaurantSettings?.logo_url || null}
      deliveryFeeSetting={restaurantSettings?.delivery_fee ?? 0}
      deliveryZones={deliveryZones || []}
      initialTableNumber={tableNumber ?? undefined}
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
        pix_key: restaurantSettings?.pix_key ?? null,
        delivery_fee: restaurantSettings?.delivery_fee ?? null,
        min_order_value: restaurantSettings?.min_order_value ?? null,
        accepts_delivery: restaurantSettings?.accepts_delivery ?? null,
        accepts_pickup: restaurantSettings?.accepts_pickup ?? null,
        accepts_dine_in: restaurantSettings?.accepts_dine_in ?? null,
      }}
    />
  )
}
