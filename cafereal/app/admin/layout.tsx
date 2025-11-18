import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"

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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-slate-50">
      <AdminSidebar user={user} />
      <main className="flex-1 w-full pt-16 lg:pt-0 lg:ml-64">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  )
}
