"use client"

import { useState, useEffect, useMemo } from "react"
import { StatsCard } from "@/components/admin/stats-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ShoppingBag, UtensilsCrossed, Package, Clock, CheckCircle2, Bike, TrendingUp, Calendar, BarChart3, Filter } from "lucide-react"
import { DeleteOrderButton } from "@/components/orders/delete-order-button"
import { createClient } from "@/lib/supabase/client"

type Order = {
  id: string
  table_number: number | null
  total: number
  created_at: string
  status: string
  order_type: string
  customer_name: string | null
}

type DashboardStats = {
  totalOrders: number
  activeOrders: number
  totalProducts: number
  totalTables: number
  todayRevenue: number
  todayCompletedOrders: number
  todayDeliveryOrders: number
  todayBalcaoOrders: number
  todayBalcaoRevenue: number
  periodRevenue: number
  periodCompletedOrders: number
  dailyAverage: number
  dailyRevenues: { date: string; revenue: number }[]
  recentOrders: Order[]
  completedOrders: Order[]
}

export function DashboardClient({ initialStats }: { initialStats: DashboardStats }) {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "custom">("today")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<DashboardStats>(initialStats)
  const supabase = createClient()

  const fetchData = async (start: Date, end: Date) => {
    setIsLoading(true)
    try {
      // Get today's data (for balcão stats)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayEnd = new Date(today)
      todayEnd.setHours(23, 59, 59, 999)

      const { data: todayOrders } = await supabase
        .from("orders")
        .select("total, status, table_number, order_type")
        .gte("created_at", today.toISOString())
        .lte("created_at", todayEnd.toISOString())

      const todayRevenue = todayOrders?.reduce((sum, order) => sum + order.total, 0) || 0
      const todayCompletedOrders = todayOrders?.filter((o) => o.status === "delivered").length || 0
      const todayDeliveryOrders = todayOrders?.filter((o) => o.order_type === "delivery").length || 0
      const todayBalcaoOrders = todayOrders?.filter((o) => o.order_type === "dine-in" && o.table_number === 0).length || 0
      const todayBalcaoRevenue = todayOrders?.filter((o) => o.order_type === "dine-in" && o.table_number === 0).reduce((sum, order) => sum + order.total, 0) || 0

      // Get period orders
      const { data: periodOrders } = await supabase
        .from("orders")
        .select("total, status, created_at, order_type")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .eq("status", "delivered")

      const periodRevenue = periodOrders?.reduce((sum, order) => sum + order.total, 0) || 0
      const periodCompletedOrders = periodOrders?.length || 0

      // Calculate daily revenues for the period
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      const dailyRevenues: { date: string; revenue: number }[] = []
      
      for (let i = 0; i <= daysDiff; i++) {
        const date = new Date(start)
        date.setDate(date.getDate() + i)
        date.setHours(0, 0, 0, 0)
        const dateEnd = new Date(date)
        dateEnd.setHours(23, 59, 59, 999)

        const dayOrders = periodOrders?.filter(
          (order) =>
            new Date(order.created_at) >= date && new Date(order.created_at) <= dateEnd
        ) || []

        const dayRevenue = dayOrders.reduce((sum, order) => sum + order.total, 0)
        dailyRevenues.push({
          date: date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }),
          revenue: dayRevenue,
        })
      }

      const daysCount = daysDiff + 1
      const dailyAverage = periodRevenue / daysCount

      // Get recent orders
      const { data: recentOrders } = await supabase
        .from("orders")
        .select("id, table_number, total, created_at, status, order_type, customer_name")
        .order("created_at", { ascending: false })
        .limit(6)

      // Get completed orders today
      const { data: completedOrders } = await supabase
        .from("orders")
        .select("id, table_number, total, created_at, order_type, customer_name")
        .eq("status", "delivered")
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false })
        .limit(6)

      setStats((prev) => ({
        ...prev,
        todayRevenue,
        todayCompletedOrders,
        todayDeliveryOrders,
        todayBalcaoOrders,
        todayBalcaoRevenue,
        periodRevenue,
        periodCompletedOrders,
        dailyAverage,
        dailyRevenues,
        recentOrders: recentOrders || [],
        completedOrders: completedOrders || [],
      }))
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    let start: Date
    let end: Date = todayEnd

    switch (period) {
      case "today":
        start = today
        break
      case "week":
        start = new Date()
        start.setDate(start.getDate() - 7)
        start.setHours(0, 0, 0, 0)
        break
      case "month":
        start = new Date()
        start.setDate(start.getDate() - 30)
        start.setHours(0, 0, 0, 0)
        break
      case "custom":
        if (startDate && endDate) {
          start = new Date(startDate)
          start.setHours(0, 0, 0, 0)
          end = new Date(endDate)
          end.setHours(23, 59, 59, 999)
        } else {
          return
        }
        break
    }

    fetchData(start, end)

    // Atualizar automaticamente a cada 30 segundos (otimizado para reduzir uso de recursos)
    // Só atualizar se a página estiver visível
    const interval = setInterval(() => {
      // Só fazer polling se a página estiver visível
      if (typeof document !== "undefined" && !document.hidden) {
        fetchData(start, end)
      }
    }, 30000) // Aumentado de 5s para 30s (reduz 83% das requisições)

    return () => clearInterval(interval)
  }, [period, startDate, endDate])

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

  const periodLabel = useMemo(() => {
    switch (period) {
      case "today":
        return "Hoje"
      case "week":
        return "Últimos 7 dias"
      case "month":
        return "Últimos 30 dias"
      case "custom":
        return startDate && endDate ? `${new Date(startDate).toLocaleDateString("pt-BR")} - ${new Date(endDate).toLocaleDateString("pt-BR")}` : "Período personalizado"
    }
  }, [period, startDate, endDate])

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-4">
        <div className="space-y-2 text-center animate-in fade-in slide-in-from-top duration-700">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom duration-500">
            Dashboard
          </h1>
          <p className="text-slate-700 text-sm sm:text-base lg:text-lg animate-in fade-in slide-in-from-bottom duration-700 delay-100">
            Visão geral do restaurante em tempo real
          </p>
        </div>

        {/* Filter Section */}
        <Card className="border-slate-200 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-slate-600" />
                <CardTitle className="text-slate-900 text-base sm:text-lg">Filtrar por Período</CardTitle>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Select value={period} onValueChange={(value: "today" | "week" | "month" | "custom") => setPeriod(value)}>
                  <SelectTrigger className="w-full sm:w-48 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Últimos 7 dias</SelectItem>
                    <SelectItem value="month">Últimos 30 dias</SelectItem>
                    <SelectItem value="custom">Período personalizado</SelectItem>
                  </SelectContent>
                </Select>

                {period === "custom" && (
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="flex-1 sm:w-auto">
                      <Label htmlFor="start-date" className="text-xs text-slate-700 mb-1 block">
                        Data Inicial
                      </Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border-slate-200 h-9 sm:h-10"
                      />
                    </div>
                    <div className="flex-1 sm:w-auto">
                      <Label htmlFor="end-date" className="text-xs text-slate-700 mb-1 block">
                        Data Final
                      </Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border-slate-200 h-9 sm:h-10"
                        min={startDate}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Revenue Overview - Daily, Weekly, Monthly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-green-200 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-900">Receita Diária</CardTitle>
            <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 mb-1">
              {isLoading ? "..." : `R$ ${stats.todayRevenue.toFixed(2)}`}
            </div>
            <p className="text-xs text-green-600 mt-1">{stats.todayCompletedOrders} pedidos concluídos hoje</p>
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs text-green-700">
                Média diária ({periodLabel}): <span className="font-semibold">R$ {stats.dailyAverage.toFixed(2)}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Receita do Período</CardTitle>
            <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 mb-1">
              {isLoading ? "..." : `R$ ${stats.periodRevenue.toFixed(2)}`}
            </div>
            <p className="text-xs text-blue-600 mt-1">{stats.periodCompletedOrders} pedidos no período</p>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-xs text-blue-700">
                Período: <span className="font-semibold">{periodLabel}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-900">Estatísticas Gerais</CardTitle>
            <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 mb-1">{stats.totalOrders} pedidos</div>
            <p className="text-xs text-purple-600 mt-1">Total de pedidos registrados</p>
            <div className="mt-3 pt-3 border-t border-purple-200">
              <p className="text-xs text-purple-700">
                Média por dia: <span className="font-semibold">R$ {stats.dailyAverage.toFixed(2)}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart - Period Days */}
      <Card className="border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-600" />
            <CardTitle className="text-slate-900">Receita do Período - {periodLabel}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-slate-700">Carregando dados...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.dailyRevenues.map((day, index) => {
                const maxRevenue = Math.max(...stats.dailyRevenues.map((d) => d.revenue), 1)
                const percentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0

                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{day.date}</span>
                      <span className="font-bold text-slate-900">R$ {day.revenue.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-slate-500 to-slate-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              {stats.dailyRevenues.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-700">Nenhum dado disponível para este período</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="Pedidos Ativos"
          value={stats.activeOrders?.toString() || "0"}
          icon={ShoppingBag}
          trend={`${stats.totalOrders} total`}
        />
        <StatsCard
          title="Delivery Hoje"
          value={stats.todayDeliveryOrders.toString()}
          icon={Bike}
          trend={`${stats.todayCompletedOrders} concluídos hoje`}
        />
        <StatsCard
          title="Balcão Hoje"
          value={stats.todayBalcaoOrders.toString()}
          icon={UtensilsCrossed}
          trend={`R$ ${stats.todayBalcaoRevenue.toFixed(2)}`}
        />
        <StatsCard title="Produtos Ativos" value={stats.totalProducts?.toString() || "0"} icon={Package} />
        <StatsCard title="Mesas" value={stats.totalTables?.toString() || "0"} icon={UtensilsCrossed} />
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
              {stats.recentOrders?.map((order, index) => (
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
                          <p className="font-semibold text-slate-900 truncate">{order.customer_name || "Cliente"}</p>
                        </>
                      ) : order.table_number === 0 ? (
                        <>
                          <UtensilsCrossed className="h-4 w-4 text-slate-600" />
                          <p className="font-semibold text-slate-900">Balcão</p>
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
              {(!stats.recentOrders || stats.recentOrders.length === 0) && (
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
              {stats.completedOrders?.map((order, index) => (
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
                      ) : order.table_number === 0 ? (
                        <>
                          <UtensilsCrossed className="h-4 w-4 text-green-600" />
                          <p className="font-semibold text-green-900">Balcão</p>
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
              {(!stats.completedOrders || stats.completedOrders.length === 0) && (
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

