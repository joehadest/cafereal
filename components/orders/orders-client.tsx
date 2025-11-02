"use client"

import { useState } from "react"
import { OrderCard } from "./order-card"
import { TableStatus } from "./table-status"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardList, LayoutGrid, RefreshCw, Bike, UtensilsCrossed } from "lucide-react"
import { useRouter } from "next/navigation"

type OrderItem = {
  id: string
  product_name: string
  product_price: number
  quantity: number
  subtotal: number
  notes: string | null
}

type Order = {
  id: string
  order_type: string
  table_number: number
  status: string
  total: number
  notes: string | null
  customer_name?: string | null
  customer_phone?: string | null
  delivery_address?: string | null
  delivery_fee?: number
  created_at: string
  order_items: OrderItem[]
}

type Table = {
  id: string
  table_number: number
  capacity: number
  status: string
}

export function OrdersClient({
  orders,
  tables,
}: {
  orders: Order[]
  tables: Table[]
}) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  const deliveryOrders = orders.filter((o) => o.order_type === "delivery")
  const dineInOrders = orders.filter((o) => o.order_type === "dine-in")

  const pendingOrders = orders.filter((o) => o.status === "pending")
  const preparingOrders = orders.filter((o) => o.status === "preparing")
  const readyOrders = orders.filter((o) => o.status === "ready")
  const outForDeliveryOrders = orders.filter((o) => o.status === "out_for_delivery")

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-purple-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-purple-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-purple-900">Gerenciamento de Pedidos</h1>
                <p className="text-sm text-purple-700">
                  {orders.length} pedidos ativos ({deliveryOrders.length} delivery, {dineInOrders.length} mesa)
                </p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-purple-300 text-purple-900 hover:bg-purple-50 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-white border border-purple-200">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-100">
              <ClipboardList className="h-4 w-4 mr-2" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="delivery" className="data-[state=active]:bg-purple-100">
              <Bike className="h-4 w-4 mr-2" />
              Delivery ({deliveryOrders.length})
            </TabsTrigger>
            <TabsTrigger value="dine-in" className="data-[state=active]:bg-purple-100">
              <UtensilsCrossed className="h-4 w-4 mr-2" />
              Mesas ({dineInOrders.length})
            </TabsTrigger>
            <TabsTrigger value="tables" className="data-[state=active]:bg-purple-100">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Status das Mesas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-8">
            {/* Pending Orders */}
            <section>
              <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                <span className="bg-yellow-500 h-3 w-3 rounded-full"></span>
                Pendentes ({pendingOrders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {pendingOrders.length === 0 && (
                  <p className="text-purple-700 col-span-full text-center py-8">Nenhum pedido pendente</p>
                )}
              </div>
            </section>

            {/* Preparing Orders */}
            <section>
              <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-500 h-3 w-3 rounded-full"></span>
                Em Preparo ({preparingOrders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {preparingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {preparingOrders.length === 0 && (
                  <p className="text-purple-700 col-span-full text-center py-8">Nenhum pedido em preparo</p>
                )}
              </div>
            </section>

            {/* Ready Orders */}
            <section>
              <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                <span className="bg-green-500 h-3 w-3 rounded-full"></span>
                Prontos ({readyOrders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {readyOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
                {readyOrders.length === 0 && (
                  <p className="text-purple-700 col-span-full text-center py-8">Nenhum pedido pronto</p>
                )}
              </div>
            </section>

            {outForDeliveryOrders.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                  <span className="bg-purple-500 h-3 w-3 rounded-full"></span>
                  Saiu para Entrega ({outForDeliveryOrders.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {outForDeliveryOrders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </div>
              </section>
            )}
          </TabsContent>

          <TabsContent value="delivery" className="space-y-8">
            {deliveryOrders.length === 0 ? (
              <p className="text-purple-700 text-center py-12">Nenhum pedido de delivery</p>
            ) : (
              <>
                {deliveryOrders.filter((o) => o.status === "pending").length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold text-purple-900 mb-4">Pendentes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {deliveryOrders
                        .filter((o) => o.status === "pending")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                  </section>
                )}
                {deliveryOrders.filter((o) => o.status === "preparing").length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold text-purple-900 mb-4">Em Preparo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {deliveryOrders
                        .filter((o) => o.status === "preparing")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                  </section>
                )}
                {deliveryOrders.filter((o) => o.status === "ready" || o.status === "out_for_delivery").length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold text-purple-900 mb-4">Prontos / Em Entrega</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {deliveryOrders
                        .filter((o) => o.status === "ready" || o.status === "out_for_delivery")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="dine-in" className="space-y-8">
            {dineInOrders.length === 0 ? (
              <p className="text-purple-700 text-center py-12">Nenhum pedido de mesa</p>
            ) : (
              <>
                {dineInOrders.filter((o) => o.status === "pending").length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold text-purple-900 mb-4">Pendentes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dineInOrders
                        .filter((o) => o.status === "pending")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                  </section>
                )}
                {dineInOrders.filter((o) => o.status === "preparing").length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold text-purple-900 mb-4">Em Preparo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dineInOrders
                        .filter((o) => o.status === "preparing")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                  </section>
                )}
                {dineInOrders.filter((o) => o.status === "ready").length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold text-purple-900 mb-4">Prontos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dineInOrders
                        .filter((o) => o.status === "ready")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="tables">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tables.map((table) => {
                const tableOrders = dineInOrders.filter((o) => o.table_number === table.table_number)
                return <TableStatus key={table.id} table={table} orders={tableOrders} />
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
