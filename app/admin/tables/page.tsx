import { createClient } from "@/lib/supabase/server"
import { TablesClient } from "@/components/admin/tables-client"

export const revalidate = 0

export default async function TablesPage() {
  const supabase = await createClient()

  const { data: tables } = await supabase.from("restaurant_tables").select("*").order("table_number")

  return <TablesClient tables={tables || []} />
}
