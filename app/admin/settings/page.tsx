import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RestaurantSettingsClient } from "@/components/admin/restaurant-settings-client"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: settings } = await supabase.from("restaurant_settings").select("*").single()

  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-6 lg:px-8">
      <RestaurantSettingsClient initialSettings={settings} />
    </div>
  )
}
