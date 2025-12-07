import { createClient } from "@/lib/supabase/server"
import { CounterClient } from "@/components/admin/counter-client"

export const revalidate = 0

export default async function CounterPage() {
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

  // Buscar mesas (apenas ativas para o balcão)
  const { data: tables } = await supabase
    .from("restaurant_tables")
    .select("*")
    .eq("active", true)
    .order("table_number")

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
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-6">
      <CounterClient
        categories={categories || []}
        tables={tables || []}
        restaurantInfo={restaurantInfo}
      />
    </div>
  )
}

