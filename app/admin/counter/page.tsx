import { createClient } from "@/lib/supabase/server"
import { CounterClient } from "@/components/admin/counter-client"

export const revalidate = 0

export default async function CounterPage() {
  const supabase = await createClient()

  // Não precisa buscar categorias e produtos, pois o balcão é um item especial

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
        categories={[]}
        tables={tables || []}
        restaurantInfo={restaurantInfo}
      />
    </div>
  )
}

