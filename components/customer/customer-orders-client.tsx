"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Bike, UtensilsCrossed, Package, CheckCircle, XCircle, RefreshCw, ArrowLeft, Home, User, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { Order } from "@/types/order"
import { CustomerOrderCard } from "./customer-order-card"

const statusConfig = {
  pending: {
    label: "Pendente",
    color: "bg-yellow-500",
    icon: Clock,
  },
  preparing: {
    label: "Em Preparo",
    color: "bg-blue-500",
    icon: Package,
  },
  ready: {
    label: "Pronto",
    color: "bg-green-500",
    icon: CheckCircle,
  },
  out_for_delivery: {
    label: "Saiu para Entrega",
    color: "bg-purple-500",
    icon: Bike,
  },
  delivered: {
    label: "Entregue",
    color: "bg-emerald-500",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-500",
    icon: XCircle,
  },
}

export function CustomerOrdersClient({ orders: initialOrders }: { orders: Order[] }) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>(initialOrders || [])

  useEffect(() => {
    setOrders(initialOrders || [])
  }, [initialOrders])

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    checkUser()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setOrders([])
        setIsRefreshing(false)
        return
      }

      // Buscar perfil do cliente
      const { data: customerProfile, error: profileError } = await supabase
        .from("customer_profiles")
        .select("phone")
        .eq("user_id", user.id)
        .maybeSingle()

      if (profileError || !customerProfile || !customerProfile.phone) {
        setOrders([])
        setIsRefreshing(false)
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
      console.error("Erro ao atualizar pedidos:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const allOrders = orders || []
  const pendingOrders = allOrders.filter((o) => o.status === "pending")
  const preparingOrders = allOrders.filter((o) => o.status === "preparing")
  const readyOrders = allOrders.filter((o) => o.status === "ready")
  const outForDeliveryOrders = allOrders.filter((o) => o.status === "out_for_delivery")
  const deliveredOrders = allOrders.filter((o) => o.status === "delivered")
  const cancelledOrders = allOrders.filter((o) => o.status === "cancelled")

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-stone-50 via-stone-100 to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="bg-slate-600 p-2 rounded-lg">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 truncate">Meus Pedidos</h1>
                <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">Acompanhe o status dos seus pedidos</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {user && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/customer/profile")}
                    className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-2 sm:px-4"
                  >
                    <User className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Perfil</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-2 sm:px-4"
                  >
                    <LogOut className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Sair</span>
                  </Button>
                </>
              )}
              {!user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/customer/login")}
                  className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-2 sm:px-4"
                >
                  <User className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Entrar</span>
                </Button>
              )}
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="px-2 sm:px-4"
              >
                <RefreshCw className={`h-4 w-4 sm:mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                size="sm"
                className="px-2 sm:px-4"
              >
                <Home className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Início</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 mb-6">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              Todos ({allOrders.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              Pendentes ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="preparing" className="text-xs sm:text-sm">
              Em Preparo ({preparingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="ready" className="text-xs sm:text-sm">
              Prontos ({readyOrders.length})
            </TabsTrigger>
            <TabsTrigger value="out_for_delivery" className="text-xs sm:text-sm hidden sm:inline-flex">
              Em Entrega ({outForDeliveryOrders.length})
            </TabsTrigger>
            <TabsTrigger value="delivered" className="text-xs sm:text-sm">
              Entregues ({deliveredOrders.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs sm:text-sm hidden sm:inline-flex">
              Cancelados ({cancelledOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {allOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                {!user ? (
                  <>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Faça login para ver seus pedidos</h3>
                    <p className="text-slate-600 mb-4">Entre com sua conta para acompanhar o status dos seus pedidos.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={() => router.push("/customer/login")} variant="default">
                        <User className="h-4 w-4 mr-2" />
                        Fazer Login
                      </Button>
                      <Button onClick={() => router.push("/")} variant="outline">
                        <Home className="h-4 w-4 mr-2" />
                        Ver Cardápio
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Nenhum pedido encontrado</h3>
                    <p className="text-slate-600 mb-4">Você ainda não realizou nenhum pedido.</p>
                    <Button onClick={() => router.push("/")} variant="default">
                      <Home className="h-4 w-4 mr-2" />
                      Ver Cardápio
                    </Button>
                  </>
                )}
              </Card>
            ) : (
              allOrders.map((order) => <CustomerOrderCard key={order.id} order={order} />)
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-slate-600">Nenhum pedido pendente no momento.</p>
              </Card>
            ) : (
              pendingOrders.map((order) => <CustomerOrderCard key={order.id} order={order} />)
            )}
          </TabsContent>

          <TabsContent value="preparing" className="space-y-4">
            {preparingOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-slate-600">Nenhum pedido em preparo no momento.</p>
              </Card>
            ) : (
              preparingOrders.map((order) => <CustomerOrderCard key={order.id} order={order} />)
            )}
          </TabsContent>

          <TabsContent value="ready" className="space-y-4">
            {readyOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-slate-600">Nenhum pedido pronto no momento.</p>
              </Card>
            ) : (
              readyOrders.map((order) => <CustomerOrderCard key={order.id} order={order} />)
            )}
          </TabsContent>

          <TabsContent value="out_for_delivery" className="space-y-4">
            {outForDeliveryOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-slate-600">Nenhum pedido em entrega no momento.</p>
              </Card>
            ) : (
              outForDeliveryOrders.map((order) => <CustomerOrderCard key={order.id} order={order} />)
            )}
          </TabsContent>

          <TabsContent value="delivered" className="space-y-4">
            {deliveredOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-slate-600">Nenhum pedido entregue ainda.</p>
              </Card>
            ) : (
              deliveredOrders.map((order) => <CustomerOrderCard key={order.id} order={order} />)
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4">
            {cancelledOrders.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-slate-600">Nenhum pedido cancelado.</p>
              </Card>
            ) : (
              cancelledOrders.map((order) => <CustomerOrderCard key={order.id} order={order} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

