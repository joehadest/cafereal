import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function TableQRCodePage({
  params,
}: {
  params: Promise<{ qr_code_id: string }>
}) {
  const { qr_code_id } = await params
  const supabase = await createClient()

  // Buscar a mesa pelo qr_code_id
  const { data: table, error } = await supabase
    .from("restaurant_tables")
    .select("id, table_number, active")
    .eq("qr_code_id", qr_code_id)
    .single()

  if (error || !table) {
    redirect("/?error=mesa_nao_encontrada")
  }

  if (!table.active) {
    redirect("/?error=mesa_desativada")
  }

  // Redirecionar para o menu com a mesa selecionada
  redirect(`/?table=${table.table_number}`)
}

