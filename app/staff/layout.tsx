import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { isAdminUser } from "@/lib/supabase/admin-check"

export default async function StaffLayout({
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

  return <>{children}</>
}

