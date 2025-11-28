import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

/**
 * Verifica se o usuário é um admin (não está na tabela customer_profiles)
 * Apenas usuários que NÃO são clientes podem acessar o painel admin
 */
export async function isAdminUser(user: User | null): Promise<boolean> {
  if (!user) {
    return false
  }

  const supabase = await createClient()

  // Verifica se o usuário está na tabela customer_profiles
  // Se estiver, ele é um cliente e NÃO pode acessar o admin
  const { data: customerProfile } = await supabase
    .from("customer_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  // Se encontrou um perfil de cliente, o usuário NÃO é admin
  if (customerProfile) {
    return false
  }

  // Se não encontrou perfil de cliente, o usuário pode ser admin
  return true
}

