import { createClient } from "@/lib/supabase/server"
import { DashboardClient } from "@/components/admin/dashboard-client"

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
  const todayEnd = new Date(today)
  todayEnd.setHours(23, 59, 59, 999)

  const { data: todayOrders } = await supabase
    .from("orders")
    .select("total, status, order_type, table_number")
    .gte("created_at", today.toISOString())
    .lte("created_at", todayEnd.toISOString())

  const todayRevenue = todayOrders?.reduce((sum, order) => sum + order.total, 0) || 0
  const todayCompletedOrders = todayOrders?.filter((o) => o.status === "delivered").length || 0
  const todayDeliveryOrders = todayOrders?.filter((o) => o.order_type === "delivery").length || 0
  const todayBalcaoOrders = todayOrders?.filter((o) => o.table_number === 0).length || 0
  const todayBalcaoRevenue = todayOrders?.filter((o) => o.table_number === 0).reduce((sum, order) => sum + order.total, 0) || 0

  // Get weekly data (last 7 days)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  weekAgo.setHours(0, 0, 0, 0)

  const { data: weeklyOrders } = await supabase
    .from("orders")
    .select("total, status, created_at")
    .gte("created_at", weekAgo.toISOString())
    .eq("status", "delivered")

  const weeklyRevenue = weeklyOrders?.reduce((sum, order) => sum + order.total, 0) || 0
  const weeklyCompletedOrders = weeklyOrders?.length || 0

  // Get monthly data (last 30 days)
  const monthAgo = new Date()
  monthAgo.setDate(monthAgo.getDate() - 30)
  monthAgo.setHours(0, 0, 0, 0)

  const { data: monthlyOrders } = await supabase
    .from("orders")
    .select("total, status, created_at")
    .gte("created_at", monthAgo.toISOString())
    .eq("status", "delivered")

  const monthlyRevenue = monthlyOrders?.reduce((sum, order) => sum + order.total, 0) || 0
  const monthlyCompletedOrders = monthlyOrders?.length || 0

  // Calculate averages
  const dailyAverage = weeklyRevenue / 7
  const weeklyAverage = monthlyRevenue / 4

  // Get revenue by day for the last 7 days
  const dailyRevenues: { date: string; revenue: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const dateEnd = new Date(date)
    dateEnd.setHours(23, 59, 59, 999)

    const dayOrders = weeklyOrders?.filter(
      (order) =>
        new Date(order.created_at) >= date && new Date(order.created_at) <= dateEnd
    ) || []

    const dayRevenue = dayOrders.reduce((sum, order) => sum + order.total, 0)
    dailyRevenues.push({
      date: date.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }),
      revenue: dayRevenue,
    })
  }

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

  // Prepare initial stats for the client component
  const initialStats = {
    totalOrders: totalOrders || 0,
    activeOrders: activeOrders || 0,
    totalProducts: totalProducts || 0,
    totalTables: totalTables || 0,
    todayRevenue,
    todayCompletedOrders,
    todayDeliveryOrders,
    todayBalcaoOrders,
    todayBalcaoRevenue,
    periodRevenue: weeklyRevenue,
    periodCompletedOrders: weeklyCompletedOrders,
    dailyAverage,
    dailyRevenues,
    recentOrders: recentOrders || [],
    completedOrders: completedOrders || [],
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-6 lg:px-8">
      <DashboardClient initialStats={initialStats} />
    </div>
  )
}
