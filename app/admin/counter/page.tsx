import { createClient } from "@/lib/supabase/server"
import { CounterClient } from "@/components/admin/counter-client"

export const revalidate = 10 // Cache por 10 segundos para melhor performance

export default async function CounterPage() {
  const supabase = await createClient()

  // Executar todas as consultas em paralelo para melhor performance
  const [
    categoriesResult,
    allVarietiesResult,
    allExtrasResult,
    tablesResult,
    restaurantSettingsResult,
  ] = await Promise.all([
    // Buscar categorias com produtos ativos
    supabase
      .from("categories")
      .select("*, products(*)")
      .eq("active", true)
      .order("display_order"),
    
    // Fetch all varieties
    supabase
      .from("product_varieties")
      .select("*")
      .order("display_order"),
    
    // Fetch all extras
    supabase
      .from("product_extras")
      .select("*")
      .order("display_order"),
    
    // Buscar mesas (apenas ativas para o balcão)
    supabase
      .from("restaurant_tables")
      .select("*")
      .eq("active", true)
      .order("table_number"),
    
    // Buscar informações do restaurante
    supabase
      .from("restaurant_settings")
      .select("name, phone, address, cnpj")
      .single(),
  ])

  const categories = categoriesResult.data
  const allVarieties = allVarietiesResult.data
  const allExtras = allExtrasResult.data
  const tables = tablesResult.data
  const restaurantSettings = restaurantSettingsResult.data

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
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-6">
      <CounterClient
        categories={categories || []}
        tables={tables || []}
        restaurantInfo={restaurantInfo}
      />
    </div>
  )
}

