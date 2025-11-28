import { createClient } from "@/lib/supabase/server"
import { CategoriesClient } from "@/components/admin/categories-client"

export const revalidate = 0

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase.from("categories").select("*").order("display_order")

  return <CategoriesClient categories={categories || []} />
}
