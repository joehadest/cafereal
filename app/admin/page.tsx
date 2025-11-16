import { createClient } from "@/lib/supabase/server"
import { StatsCard } from "@/components/admin/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, ShoppingBag, UtensilsCrossed, Package, Clock, CheckCircle2, Bike } from "lucide-react"
import { DeleteOrderButton } from "@/components/orders/delete-order-button"

export const revalidate = 0

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Get statistics
  const { count: totalOrders } = await supabase.from("orders").select("*", { count: "exact", head: true })

  const { count: activeOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "preparing", "ready", "out_for_delivery"])

  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("active", true)

  const { count: totalTables } = await supabase.from("restaurant_tables").select("*", { count: "exact", head: true })

  // Get today's data
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: todayOrders } = await supabase
    .from("orders")
    .select("total, status, order_type")
    .gte("created_at", today.toISOString())

  const todayRevenue = todayOrders?.reduce((sum, order) => sum + order.total, 0) || 0
  const todayCompletedOrders = todayOrders?.filter((o) => o.status === "delivered").length || 0
  const todayDeliveryOrders = todayOrders?.filter((o) => o.order_type === "delivery").length || 0

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, table_number, total, created_at, status, order_type, customer_name")
    .order("created_at", { ascending: false })
    .limit(6)

  const { data: completedOrders } = await supabase
    .from("orders")
    .select("id, table_number, total, created_at, order_type, customer_name")
    .eq("status", "delivered")
    .gte("created_at", today.toISOString())
    .order("created_at", { ascending: false })
    .limit(6)

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "secondary" },
      preparing: { label: "Preparando", variant: "default" },
      ready: { label: "Pronto", variant: "outline" },
      out_for_delivery: { label: "Saiu p/ Entrega", variant: "default" },
      delivered: { label: "Entregue", variant: "outline" },
    }
    return statusMap[status] || { label: status, variant: "secondary" }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-2 text-center animate-in fade-in slide-in-from-top duration-700">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom duration-500">
          Dashboard
        </h1>
        <p className="text-slate-700 text-sm sm:text-base lg:text-lg animate-in fade-in slide-in-from-bottom duration-700 delay-100">Visão geral do restaurante em tempo real</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Receita Hoje"
          value={`R$ ${todayRevenue.toFixed(2)}`}
          icon={DollarSign}
          trend={`${todayCompletedOrders} pedidos concluídos`}
        />
        <StatsCard
          title="Pedidos Ativos"
          value={activeOrders?.toString() || "0"}
          icon={ShoppingBag}
          trend={`${totalOrders} total`}
        />
        <StatsCard
          title="Delivery Hoje"
          value={todayDeliveryOrders.toString()}
          icon={Bike}
          trend={`${todayOrders?.length || 0} pedidos hoje`}
        />
        <StatsCard title="Produtos Ativos" value={totalProducts?.toString() || "0"} icon={Package} />
      </div>

      {/* Recent and Completed Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <Card className="border-slate-200 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300 animate-in fade-in slide-in-from-left duration-500">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <div className="flex items-center gap-2 justify-center text-center">
              <Clock className="h-5 w-5 text-slate-600" />
              <CardTitle className="text-slate-900">Pedidos Recentes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {recentOrders?.map((order, index) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-3 p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all duration-200 hover:shadow-md animate-in slide-in-from-left cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {order.order_type === "delivery" ? (
                        <>
                          <Bike className="h-4 w-4 text-slate-600" />
                          <p className="font-semibold text-slate-900 truncate">
                            {order.customer_name || "Cliente"}
                          </p>
                        </>
                      ) : (
                        <>
                          <UtensilsCrossed className="h-4 w-4 text-slate-600" />
                          <p className="font-semibold text-slate-900">Mesa {order.table_number}</p>
                        </>
                      )}
                    </div>
                    <Badge variant={getStatusBadge(order.status).variant} className="text-xs">
                      {getStatusBadge(order.status).label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right space-y-1">
                      <p className="font-bold text-slate-600 text-lg">R$ {order.total.toFixed(2)}</p>
                      <p className="text-xs text-slate-700">
                        {new Date(order.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <DeleteOrderButton orderId={order.id} />
                  </div>
                </div>
              ))}
              {(!recentOrders || recentOrders.length === 0) && (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-700">Nenhum pedido recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Completed Orders Today */}
        <Card className="border-green-200 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300 animate-in fade-in slide-in-from-right duration-500">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
            <div className="flex items-center gap-2 justify-center text-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900">Concluídos Hoje</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {completedOrders?.map((order, index) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-white rounded-lg border border-green-200 hover:border-green-300 transition-all duration-200 hover:shadow-md animate-in slide-in-from-right cursor-pointer"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {order.order_type === "delivery" ? (
                        <>
                          <Bike className="h-4 w-4 text-green-600" />
                          <p className="font-semibold text-green-900">{order.customer_name || "Cliente"}</p>
                        </>
                      ) : (
                        <>
                          <UtensilsCrossed className="h-4 w-4 text-green-600" />
                          <p className="font-semibold text-green-900">Mesa {order.table_number}</p>
                        </>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                      Entregue
                    </Badge>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-green-600 text-lg">R$ {order.total.toFixed(2)}</p>
                    <p className="text-xs text-green-700">
                      {new Date(order.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {(!completedOrders || completedOrders.length === 0) && (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-green-300 mx-auto mb-3" />
                  <p className="text-green-700">Nenhum pedido concluído hoje</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
