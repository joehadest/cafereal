"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { OrderCard } from "./order-card"
import { TableStatus } from "./table-status"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardList, LayoutGrid, RefreshCw, Bike, UtensilsCrossed, Bell, Store } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Order } from "@/types/order"
import { useOrderNotifications } from "@/hooks/use-order-notifications"

type OrderItem = {
  id: string
  product_name: string
  product_price: number
  quantity: number
  subtotal: number
  notes: string | null
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
  restaurantInfo,
}: {
  orders: Order[]
  tables: Table[]
  restaurantInfo?: {
    name: string
    phone?: string
    address?: string
    cnpj?: string
  }
}) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())
  const [deletedOrderIds, setDeletedOrderIds] = useState<Set<string>>(new Set())
  const isPrintingRef = useRef(false)
  const isRefreshingRef = useRef(false)
  
  // Escutar eventos de pedidos deletados para removê-los da lista imediatamente
  useEffect(() => {
    const handleOrderDeleted = (event: CustomEvent<{ orderId: string }>) => {
      setDeletedOrderIds((prev) => new Set([...prev, event.detail.orderId]))
    }

    window.addEventListener("order-deleted", handleOrderDeleted as EventListener)

    return () => {
      window.removeEventListener("order-deleted", handleOrderDeleted as EventListener)
    }
  }, [])
  
  // Função para atualizar a página quando detectar novo pedido (com debounce)
  const handleNewOrder = useCallback(() => {
    try {
      // Não atualizar se estiver imprimindo ou já atualizando
      if (isPrintingRef.current || isRefreshingRef.current) {
        return
      }
      
      isRefreshingRef.current = true
      setLastUpdateTime(new Date())
      // Usar setTimeout para garantir que não haja conflito com impressões em andamento
      setTimeout(() => {
        if (!isPrintingRef.current) {
          try {
            const refreshResult = router.refresh()
            // Se retornar uma Promise, tratar erros
            if (refreshResult && typeof refreshResult.catch === 'function') {
              refreshResult.catch((error) => {
                console.warn("Erro ao atualizar página:", error)
              }).finally(() => {
                setTimeout(() => {
                  isRefreshingRef.current = false
                }, 500)
              })
            } else {
              // Se não retornar Promise, apenas resetar o flag após um delay
              setTimeout(() => {
                isRefreshingRef.current = false
              }, 500)
            }
          } catch (error) {
            console.warn("Erro ao atualizar página:", error)
            isRefreshingRef.current = false
          }
        } else {
          isRefreshingRef.current = false
        }
      }, 100)
    } catch (error) {
      console.warn("Erro ao atualizar página:", error)
      isRefreshingRef.current = false
    }
  }, [router])
  
  const { permission, isEnabled, requestPermission } = useOrderNotifications(handleNewOrder)

  // Escutar cliques em notificações para atualizar a página
  useEffect(() => {
    const handleNotificationClick = () => {
      if (!isRefreshingRef.current) {
        isRefreshingRef.current = true
        try {
          const refreshResult = router.refresh()
          if (refreshResult && typeof refreshResult.catch === 'function') {
            refreshResult.catch((error) => {
              console.warn("Erro ao atualizar após notificação:", error)
            }).finally(() => {
              setTimeout(() => {
                isRefreshingRef.current = false
              }, 500)
            })
          } else {
            setTimeout(() => {
              isRefreshingRef.current = false
            }, 500)
          }
        } catch (error) {
          console.warn("Erro ao atualizar após notificação:", error)
          isRefreshingRef.current = false
        }
      }
    }

    window.addEventListener("order-notification-clicked", handleNotificationClick)
    return () => {
      window.removeEventListener("order-notification-clicked", handleNotificationClick)
    }
  }, [router])

  // Atualizar quando a página volta ao foco (com throttle para evitar muitas atualizações)
  useEffect(() => {
    let lastUpdate = 0
    const THROTTLE_MS = 2000 // Só atualizar a cada 2 segundos no máximo

    const handleRefresh = () => {
      try {
        const refreshResult = router.refresh()
        if (refreshResult && typeof refreshResult.catch === 'function') {
          refreshResult.catch((error) => {
            console.warn("Erro ao atualizar:", error)
          }).finally(() => {
            setTimeout(() => {
              isRefreshingRef.current = false
            }, 500)
          })
        } else {
          setTimeout(() => {
            isRefreshingRef.current = false
          }, 500)
        }
      } catch (error) {
        console.warn("Erro ao atualizar:", error)
        isRefreshingRef.current = false
      }
    }

    const handleVisibilityChange = () => {
      const now = Date.now()
      if (!document.hidden && !isRefreshingRef.current && (now - lastUpdate) > THROTTLE_MS) {
        lastUpdate = now
        // Página voltou ao foco, atualizar
        isRefreshingRef.current = true
        handleRefresh()
      }
    }

    const handleFocus = () => {
      const now = Date.now()
      // Janela recebeu foco, atualizar (com throttle)
      if (!isRefreshingRef.current && (now - lastUpdate) > THROTTLE_MS) {
        lastUpdate = now
        isRefreshingRef.current = true
        handleRefresh()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [router])

  const handleRefresh = () => {
    if (isRefreshingRef.current) return
    
    setIsRefreshing(true)
    isRefreshingRef.current = true
    try {
      const refreshResult = router.refresh()
      if (refreshResult && typeof refreshResult.catch === 'function') {
        refreshResult.catch((error) => {
          console.warn("Erro ao atualizar manualmente:", error)
        }).finally(() => {
          setTimeout(() => {
            setIsRefreshing(false)
            isRefreshingRef.current = false
          }, 500)
        })
      } else {
        setTimeout(() => {
          setIsRefreshing(false)
          isRefreshingRef.current = false
        }, 500)
      }
    } catch (error) {
      console.warn("Erro ao atualizar manualmente:", error)
      setIsRefreshing(false)
      isRefreshingRef.current = false
    }
  }

  // Filtrar pedidos deletados da lista
  const visibleOrders = orders.filter((o) => !deletedOrderIds.has(o.id))
  
  // Usar useMemo para evitar recálculos desnecessários
  const { deliveryOrders, dineInOrders, balcaoOrders, pendingOrders, preparingOrders, readyOrders, outForDeliveryOrders, deliveredOrders } = useMemo(() => {
    const delivery = visibleOrders.filter((o) => o.order_type === "delivery")
    const dineIn = visibleOrders.filter((o) => o.order_type === "dine-in" && o.table_number !== 0)
    const balcao = visibleOrders.filter((o) => o.order_type === "dine-in" && o.table_number === 0)
    const pending = visibleOrders.filter((o) => o.status === "pending")
    const preparing = visibleOrders.filter((o) => o.status === "preparing")
    const ready = visibleOrders.filter((o) => o.status === "ready")
    const outForDelivery = visibleOrders.filter((o) => o.status === "out_for_delivery")
    const delivered = visibleOrders.filter((o) => o.status === "delivered")
    
    return {
      deliveryOrders: delivery,
      dineInOrders: dineIn,
      balcaoOrders: balcao,
      pendingOrders: pending,
      preparingOrders: preparing,
      readyOrders: ready,
      outForDeliveryOrders: outForDelivery,
      deliveredOrders: delivered,
    }
  }, [visibleOrders])

  return (
    <div className="orders-full-width min-h-screen w-full bg-gradient-to-br from-stone-50 via-stone-100 to-slate-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm w-full">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-slate-600 p-1.5 sm:p-2 rounded-lg">
                <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Gerenciamento de Pedidos</h1>
                <p className="text-xs sm:text-sm text-slate-700">
                  {visibleOrders.length} pedidos ativos ({deliveryOrders.length} delivery, {dineInOrders.length} mesa, {balcaoOrders.length} balcão)
                  {isEnabled && (
                    <span className="ml-2 text-green-600 text-xs">• Atualização automática ativa</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {permission !== "granted" && (
                <Button
                  onClick={async () => {
                    try {
                      const perm = await requestPermission()
                      if (perm === "granted") {
                        // Pequeno delay para garantir que o estado foi atualizado
                        setTimeout(() => {
                          // Forçar atualização do componente
                          router.refresh()
                        }, 100)
                      } else if (perm === "denied") {
                        alert("Permissão negada. Para ativar notificações, acesse as configurações do navegador e permita notificações para este site.")
                      }
                    } catch (error) {
                      console.error("Erro ao solicitar permissão:", error)
                      alert("Erro ao solicitar permissão de notificações. Tente novamente.")
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-900 hover:bg-slate-50 bg-transparent cursor-pointer"
                  title="Clique para ativar notificações de novos pedidos"
                >
                  <Bell className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Ativar Notificações</span>
                </Button>
              )}
              {permission === "granted" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-50 bg-transparent"
                  title="Notificações ativadas"
                  disabled
                >
                  <Bell className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Ativado</span>
                </Button>
              )}
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-900 hover:bg-slate-50 bg-transparent"
              >
                <RefreshCw className={`h-4 w-4 sm:mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Tabs defaultValue="all" className="space-y-4 sm:space-y-6">
          <TabsList className="bg-white border border-slate-200 w-full sm:w-auto grid grid-cols-2 sm:flex">
            <TabsTrigger value="all" className="data-[state=active]:bg-slate-100 text-xs sm:text-sm">
              <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="delivery" className="data-[state=active]:bg-slate-100 text-xs sm:text-sm">
              <Bike className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Delivery ({deliveryOrders.length})
            </TabsTrigger>
            <TabsTrigger value="dine-in" className="data-[state=active]:bg-slate-100 text-xs sm:text-sm">
              <UtensilsCrossed className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Mesas ({dineInOrders.length})
            </TabsTrigger>
            <TabsTrigger value="balcao" className="data-[state=active]:bg-slate-100 text-xs sm:text-sm">
              <Store className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Balcão ({balcaoOrders.length})
            </TabsTrigger>
            <TabsTrigger value="tables" className="data-[state=active]:bg-slate-100 text-xs sm:text-sm">
              <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6 sm:space-y-8">
            {/* Pending Orders */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="bg-yellow-500 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full"></span>
                Pendentes ({pendingOrders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {pendingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                ))}
                {pendingOrders.length === 0 && (
                  <p className="text-slate-700 col-span-full text-center py-6 sm:py-8 text-sm sm:text-base">
                    Nenhum pedido pendente
                  </p>
                )}
              </div>
            </section>

            {/* Preparing Orders */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="bg-blue-500 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full"></span>
                Em Preparo ({preparingOrders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {preparingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                ))}
                {preparingOrders.length === 0 && (
                  <p className="text-slate-700 col-span-full text-center py-6 sm:py-8 text-sm sm:text-base">
                    Nenhum pedido em preparo
                  </p>
                )}
              </div>
            </section>

            {/* Ready Orders */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="bg-green-500 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full"></span>
                Prontos ({readyOrders.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {readyOrders.map((order) => (
                  <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                ))}
                {readyOrders.length === 0 && (
                  <p className="text-slate-700 col-span-full text-center py-6 sm:py-8 text-sm sm:text-base">
                    Nenhum pedido pronto
                  </p>
                )}
              </div>
            </section>

            {outForDeliveryOrders.length > 0 && (
              <section>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="bg-slate-500 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full"></span>
                  Saiu para Entrega ({outForDeliveryOrders.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {outForDeliveryOrders.map((order) => (
                    <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                  ))}
                </div>
              </section>
            )}

            {/* Delivered Orders */}
            {deliveredOrders.length > 0 && (
              <section>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="bg-emerald-500 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full"></span>
                  Entregues ({deliveredOrders.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {deliveredOrders.map((order) => (
                    <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                  ))}
                </div>
              </section>
            )}
          </TabsContent>

          <TabsContent value="delivery" className="space-y-6 sm:space-y-8">
            {deliveryOrders.length === 0 ? (
              <p className="text-slate-700 text-center py-8 sm:py-12 text-sm sm:text-base">Nenhum pedido de delivery</p>
            ) : (
              <>
                {deliveryOrders.filter((o) => o.status === "pending").length > 0 && (
                  <section>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Pendentes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {deliveryOrders
                        .filter((o) => o.status === "pending")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                        ))}
                    </div>
                  </section>
                )}
                {deliveryOrders.filter((o) => o.status === "preparing").length > 0 && (
                  <section>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Em Preparo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {deliveryOrders
                        .filter((o) => o.status === "preparing")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                        ))}
                    </div>
                  </section>
                )}
                {deliveryOrders.filter((o) => o.status === "ready" || o.status === "out_for_delivery").length > 0 && (
                  <section>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Prontos / Em Entrega</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {deliveryOrders
                        .filter((o) => o.status === "ready" || o.status === "out_for_delivery")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                        ))}
                    </div>
                  </section>
                )}
                {deliveryOrders.filter((o) => o.status === "delivered").length > 0 && (
                  <section>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Entregues</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {deliveryOrders
                        .filter((o) => o.status === "delivered")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                        ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="dine-in" className="space-y-6 sm:space-y-8">
            {dineInOrders.length === 0 ? (
              <p className="text-slate-700 text-center py-8 sm:py-12 text-sm sm:text-base">Nenhum pedido de mesa</p>
            ) : (
              <>
                {dineInOrders.filter((o) => o.status === "pending").length > 0 && (
                  <section>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Pendentes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {dineInOrders
                        .filter((o) => o.status === "pending")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                        ))}
                    </div>
                  </section>
                )}
                {dineInOrders.filter((o) => o.status === "preparing").length > 0 && (
                  <section>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Em Preparo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {dineInOrders
                        .filter((o) => o.status === "preparing")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                        ))}
                    </div>
                  </section>
                )}
                {dineInOrders.filter((o) => o.status === "ready").length > 0 && (
                  <section>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Prontos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {dineInOrders
                        .filter((o) => o.status === "ready")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                        ))}
                    </div>
                  </section>
                )}
                {dineInOrders.filter((o) => o.status === "delivered").length > 0 && (
                  <section>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Entregues</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {dineInOrders
                        .filter((o) => o.status === "delivered")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                        ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="balcao" className="space-y-6 sm:space-y-8">
            {balcaoOrders.length === 0 ? (
              <p className="text-slate-700 text-center py-8 sm:py-12 text-sm sm:text-base">Nenhum pedido do balcão</p>
            ) : (
              <>
                {balcaoOrders.filter((o) => o.status === "pending").length > 0 && (
                  <section>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Pendentes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {balcaoOrders
                        .filter((o) => o.status === "pending")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                        ))}
                    </div>
                  </section>
                )}
                {balcaoOrders.filter((o) => o.status === "preparing").length > 0 && (
                  <section>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Em Preparo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {balcaoOrders
                        .filter((o) => o.status === "preparing")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                        ))}
                    </div>
                  </section>
                )}
                {balcaoOrders.filter((o) => o.status === "ready").length > 0 && (
                  <section>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Prontos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {balcaoOrders
                        .filter((o) => o.status === "ready")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                        ))}
                    </div>
                  </section>
                )}
                {balcaoOrders.filter((o) => o.status === "delivered").length > 0 && (
                  <section>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Entregues</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {balcaoOrders
                        .filter((o) => o.status === "delivered")
                        .map((order) => (
                          <OrderCard key={order.id} order={order} restaurantInfo={restaurantInfo} />
                        ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="tables">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
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
