"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CustomerOrdersClient } from "@/components/customer/customer-orders-client"
import type { Order } from "@/types/order"

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setOrders([])
          setIsLoading(false)
          return
        }

        // Verificar se é admin sem perfil de cliente
        const { data: adminProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle()

        if (adminProfile) {
          const { data: customerProfile } = await supabase
            .from("customer_profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle()

          if (!customerProfile) {
            setIsRedirecting(true)
            window.location.href = "/admin"
            return
          }
        }

        // Buscar perfil do cliente
        const { data: customerProfile, error: profileError } = await supabase
          .from("customer_profiles")
          .select("phone")
          .eq("user_id", user.id)
          .maybeSingle()

        if (profileError) {
          console.error("Erro ao buscar perfil:", profileError)
          setIsLoading(false)
          return
        }

        if (!customerProfile || !customerProfile.phone) {
          console.log("Cliente sem telefone cadastrado")
          setIsLoading(false)
          return
        }

        // Buscar pedidos do cliente pelo telefone
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(`
            *,
            order_items(
              *,
              order_item_extras(*)
            )
          `)
          .eq("customer_phone", customerProfile.phone)
          .order("created_at", { ascending: false })

        if (ordersError) {
          console.error("Erro ao buscar pedidos:", ordersError)
        } else {
          setOrders((ordersData as Order[]) || [])
        }
      } catch (error) {
        console.error("Erro ao carregar pedidos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()
  }, [])

  if (isRedirecting) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Carregando seus pedidos...</p>
        </div>
      </div>
    )
  }

  return <CustomerOrdersClient orders={orders} />
}

