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
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-stone-50 to-purple-50">
      <AdminSidebar user={user} />
      <main className="flex-1 ml-64">{children}</main>
    </div>
  )
}
