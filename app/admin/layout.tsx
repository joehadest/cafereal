import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"
import { isAdminUser } from "@/lib/supabase/admin-check"

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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-slate-50">
      <AdminSidebar user={user} />
      <main className="flex-1 w-full pt-16 lg:pt-0 lg:ml-64 overflow-x-hidden">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  )
}
