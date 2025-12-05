import { createClient } from "@/lib/supabase/server"
import { CategoriesClient } from "@/components/admin/categories-client"

export const revalidate = 0

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase.from("categories").select("*").order("display_order")

  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-6 lg:px-8">
      <CategoriesClient categories={categories || []} />
    </div>
  )
}
