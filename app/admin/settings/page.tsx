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

  return <RestaurantSettingsClient initialSettings={settings} />
}
