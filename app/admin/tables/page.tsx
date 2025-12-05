import { createClient } from "@/lib/supabase/server"
import { TablesClient } from "@/components/admin/tables-client"

export const revalidate = 0

export default async function TablesPage() {
  const supabase = await createClient()

  const { data: tables } = await supabase.from("restaurant_tables").select("*").order("table_number")

  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-6 lg:px-8">
      <TablesClient tables={tables || []} />
    </div>
  )
}
