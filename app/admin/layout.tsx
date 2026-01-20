import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"
import { isAdminUser } from "@/lib/supabase/admin-check"
import { SessionRefresher } from "@/components/admin/session-refresher"
import { PWAInstallButton } from "@/components/admin/pwa-install-button"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Verifica se o usuário é admin (não é cliente)
  const isAdmin = await isAdminUser(user)
  if (!isAdmin) {
    // Usuário é um cliente, redireciona para a página inicial
    redirect("/")
  }

  // Buscar logo e nome do restaurante (cacheado por layout)
  const { data: restaurantSettings } = await supabase
    .from("restaurant_settings")
    .select("name, logo_url")
    .single()

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <SessionRefresher />
      <PWAInstallButton />
      <AdminSidebar 
        user={user} 
        restaurantName={restaurantSettings?.name || "Admin Panel"}
        restaurantLogo={restaurantSettings?.logo_url || null}
      />
      <main className="flex-1 w-full pt-16 lg:pt-0 lg:ml-64 overflow-x-hidden bg-gradient-to-br from-slate-50/50 via-white to-slate-50/50">
        {children}
      </main>
    </div>
  )
}
