"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { OrderCard } from "./order-card"
import { TableStatus } from "./table-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ClipboardList, LayoutGrid, RefreshCw, Bike, UtensilsCrossed, Bell, Store, Trash2, Search, X, Calendar, CheckSquare, Square, Merge } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { Order, OrderItem, OrderItemExtra } from "@/types/order"
import { useOrderNotifications } from "@/hooks/use-order-notifications"
import { AutoPrintSettings, useAutoPrintSettings } from "./auto-print-settings"
import { autoPrintOrder } from "./auto-print-utils"

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
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilterState] = useState<string>("all")
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false)
  
  // Carregar filtro do localStorage após a hidratação
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedFilter = localStorage.getItem("ordersDateFilter")
      if (savedFilter) {
        setDateFilterState(savedFilter)
      }
    }
  }, [])
  
  // Função para atualizar o filtro de data e salvar no localStorage
  const setDateFilter = useCallback((value: string) => {
    setDateFilterState(value)
    if (typeof window !== "undefined") {
      localStorage.setItem("ordersDateFilter", value)
    }
  }, [])
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())
  const [isMerging, setIsMerging] = useState(false)
  // Estado local para manter os pedidos mesmo durante refresh
  const [localOrders, setLocalOrders] = useState<Order[]>(orders)
  const isPrintingRef = useRef(false)
  const isRefreshingRef = useRef(false)
  const printedOrderIdsRef = useRef<Set<string>>(new Set())
  const previousOrderStatusesRef = useRef<Map<string, string>>(new Map())
  const previousOrderItemsRef = useRef<Map<string, OrderItem[]>>(new Map())
  const isInitialLoadRef = useRef(true)
  
  // Configurações de impressão automática
  const autoPrintSettings = useAutoPrintSettings()

  // Função para identificar itens novos (adicionados)
  const getNewItemIds = useCallback((previousItems: OrderItem[], currentItems: OrderItem[]): Set<string> => {
    const newItemIds = new Set<string>()
    const previousItemIds = new Set(previousItems.map(item => item.id))
    
    currentItems.forEach(item => {
      if (!previousItemIds.has(item.id)) {
        newItemIds.add(item.id)
      }
    })
    
    return newItemIds
  }, [])

  // Função para comparar itens de pedido e detectar mudanças
  const hasItemsChanged = useCallback((previousItems: OrderItem[], currentItems: OrderItem[]): boolean => {
    // Se a quantidade de itens mudou, houve mudança
    if (previousItems.length !== currentItems.length) {
      return true
    }

    // Criar mapas para facilitar a comparação
    const previousMap = new Map(previousItems.map(item => [item.id, item]))
    const currentMap = new Map(currentItems.map(item => [item.id, item]))

    // Verificar se algum item foi removido ou adicionado
    for (const id of previousMap.keys()) {
      if (!currentMap.has(id)) {
        return true // Item foi removido
      }
    }

    for (const id of currentMap.keys()) {
      if (!previousMap.has(id)) {
        return true // Item foi adicionado
      }
    }

    // Comparar cada item individualmente
    for (const [id, currentItem] of currentMap.entries()) {
      const previousItem = previousMap.get(id)
      if (!previousItem) continue

      // Comparar propriedades principais
      if (
        previousItem.quantity !== currentItem.quantity ||
        previousItem.product_price !== currentItem.product_price ||
        previousItem.subtotal !== currentItem.subtotal ||
        previousItem.product_name !== currentItem.product_name ||
        previousItem.notes !== currentItem.notes ||
        previousItem.variety_id !== currentItem.variety_id ||
        previousItem.variety_name !== currentItem.variety_name ||
        previousItem.variety_price !== currentItem.variety_price
      ) {
        return true
      }

      // Comparar extras
      const previousExtras = previousItem.order_item_extras || []
      const currentExtras = currentItem.order_item_extras || []

      if (previousExtras.length !== currentExtras.length) {
        return true
      }

      // Comparar cada extra
      const previousExtrasMap = new Map(previousExtras.map((extra: OrderItemExtra) => [extra.id, extra]))
      const currentExtrasMap = new Map(currentExtras.map((extra: OrderItemExtra) => [extra.id, extra]))

      for (const [extraId, currentExtra] of currentExtrasMap.entries()) {
        const previousExtra = previousExtrasMap.get(extraId)
        if (!previousExtra) {
          return true // Extra foi adicionado
        }
        if (
          previousExtra.extra_id !== currentExtra.extra_id ||
          previousExtra.extra_name !== currentExtra.extra_name ||
          previousExtra.extra_price !== currentExtra.extra_price ||
          previousExtra.quantity !== currentExtra.quantity
        ) {
          return true // Extra foi modificado
        }
      }

      // Verificar se algum extra foi removido
      for (const extraId of previousExtrasMap.keys()) {
        if (!currentExtrasMap.has(extraId)) {
          return true // Extra foi removido
        }
      }
    }

    return false // Nenhuma mudança detectada
  }, [])
  
  // Atualizar estado local quando os pedidos do servidor mudarem
  useEffect(() => {
    if (orders) {
      // Detectar novos pedidos e mudanças de status/itens para impressão automática
      // Não imprimir na primeira carga da página (apenas em atualizações subsequentes)
      if (autoPrintSettings.enabled && orders.length > 0 && !isInitialLoadRef.current) {
        orders.forEach((order) => {
          const orderId = order.id
          const previousStatus = previousOrderStatusesRef.current.get(orderId)
          const previousItems = previousOrderItemsRef.current.get(orderId) || []
          const isNewOrder = !printedOrderIdsRef.current.has(orderId)
          const statusChanged = previousStatus && previousStatus !== order.status
          const itemsChanged = hasItemsChanged(previousItems, order.order_items || [])

          // Imprimir se for novo pedido e estiver configurado para imprimir em novos pedidos
          if (isNewOrder && autoPrintSettings.printOnNewOrder && autoPrintSettings.printType !== "none") {
            printedOrderIdsRef.current.add(orderId)
            setTimeout(() => {
              autoPrintOrder(order, autoPrintSettings.printType as "kitchen" | "customer" | "receipt", restaurantInfo)
            }, 500)
          }
          // Imprimir se o status mudou e estiver configurado para imprimir em mudanças de status
          else if (statusChanged && autoPrintSettings.printOnStatusChange && autoPrintSettings.printType !== "none") {
            setTimeout(() => {
              autoPrintOrder(order, autoPrintSettings.printType as "kitchen" | "customer" | "receipt", restaurantInfo)
            }, 500)
          }
          // Imprimir se os itens mudaram e estiver configurado para imprimir em mudanças de itens
          else if (itemsChanged && autoPrintSettings.printOnItemsChange && autoPrintSettings.printType !== "none") {
            // Identificar itens novos para destacar na impressão
            const newItemIds = getNewItemIds(previousItems, order.order_items || [])
            setTimeout(() => {
              autoPrintOrder(order, autoPrintSettings.printType as "kitchen" | "customer" | "receipt", restaurantInfo, newItemIds)
            }, 500)
          }

          // Atualizar status e itens anteriores
          previousOrderStatusesRef.current.set(orderId, order.status)
          previousOrderItemsRef.current.set(orderId, [...(order.order_items || [])])
        })
      }

      // Marcar pedidos existentes como já processados na primeira carga
      if (isInitialLoadRef.current && orders.length > 0) {
        orders.forEach((order) => {
          printedOrderIdsRef.current.add(order.id)
          previousOrderStatusesRef.current.set(order.id, order.status)
          previousOrderItemsRef.current.set(order.id, [...(order.order_items || [])])
        })
        // Marcar que a carga inicial foi concluída após um pequeno delay
        setTimeout(() => {
          isInitialLoadRef.current = false
        }, 1000)
      }

      // Sempre atualizar quando houver dados do servidor
      // Mas só limpar se o servidor retornar array vazio E não estivermos em refresh
      if (orders.length > 0) {
        setLocalOrders(orders)
      } else if (orders.length === 0 && localOrders.length > 0 && !isRefreshingRef.current) {
        // Se o servidor retornar array vazio mas temos dados locais E não estamos em refresh,
        // manter os dados locais (pode ser um erro temporário ou problema de autenticação)
        console.warn("Servidor retornou array vazio, mantendo dados locais para evitar perda de dados")
      } else if (orders.length === 0 && localOrders.length === 0) {
        // Se ambos estão vazios, atualizar normalmente
        setLocalOrders([])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, autoPrintSettings, hasItemsChanged])
  
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
            router.refresh()
            // Resetar o flag após um delay
            setTimeout(() => {
              isRefreshingRef.current = false
            }, 500)
          } catch (error) {
            console.warn("Erro ao atualizar página:", error)
            // Em caso de erro, não limpar os dados locais
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
          router.refresh()
          // Resetar o flag após um delay
          setTimeout(() => {
            isRefreshingRef.current = false
          }, 500)
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
    const THROTTLE_MS = 5000 // Só atualizar a cada 5 segundos no máximo (otimizado)

    const handleRefresh = () => {
      try {
        router.refresh()
        // Resetar o flag após um delay
        setTimeout(() => {
          isRefreshingRef.current = false
        }, 500)
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
      router.refresh()
      // Resetar os flags após um delay
      setTimeout(() => {
        setIsRefreshing(false)
        isRefreshingRef.current = false
      }, 500)
    } catch (error) {
      console.warn("Erro ao atualizar manualmente:", error)
      setIsRefreshing(false)
      isRefreshingRef.current = false
    }
  }

  const handleDeleteAllOrders = async () => {
    setIsDeletingAll(true)
    const supabase = createClient()

    try {
      // Deletar todos os pedidos (cascade vai deletar order_items e order_item_extras automaticamente)
      const { error } = await supabase
        .from("orders")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000") // Condição que sempre retorna true para deletar todos

      if (error) {
        console.error("Erro ao deletar pedidos:", error)
        alert("Erro ao deletar pedidos. Tente novamente.")
        setIsDeletingAll(false)
        return
      }

      // Fechar modal e atualizar página
      setIsDeleteAllModalOpen(false)
      router.refresh()
      alert("Todos os pedidos foram deletados com sucesso!")
    } catch (error) {
      console.error("Erro ao deletar pedidos:", error)
      alert("Erro ao deletar pedidos. Tente novamente.")
    } finally {
      setIsDeletingAll(false)
    }
  }

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const handleOpenMergeModal = () => {
    setSelectedOrderIds(new Set())
    setIsMergeModalOpen(true)
  }

  const handleCloseMergeModal = () => {
    setIsMergeModalOpen(false)
    setSelectedOrderIds(new Set())
  }

  const handleMergeOrders = async () => {
    if (selectedOrderIds.size < 2) {
      alert("Selecione pelo menos 2 pedidos para juntar")
      return
    }

    if (!confirm(`Tem certeza que deseja juntar ${selectedOrderIds.size} pedidos em um único pedido? Os pedidos originais serão cancelados.`)) {
      return
    }

    setIsMerging(true)
    const supabase = createClient()

    try {
      // Buscar todos os pedidos selecionados com seus itens
      const selectedOrders = localOrders.filter((o) => selectedOrderIds.has(o.id))
      
      if (selectedOrders.length < 2) {
        alert("Erro: Não foi possível encontrar os pedidos selecionados")
        setIsMerging(false)
        return
      }

      // Usar o primeiro pedido como base
      const baseOrder = selectedOrders[0]
      
      // Coletar todos os itens de todos os pedidos
      const allItems: any[] = []
      let totalSum = 0
      const allNotes: string[] = []

      for (const order of selectedOrders) {
        totalSum += order.total
        if (order.notes) {
          allNotes.push(`Pedido #${order.id.slice(0, 8).toUpperCase()}: ${order.notes}`)
        }
        
        for (const item of order.order_items || []) {
          allItems.push({
            order_id: null, // Será preenchido após criar o novo pedido
            product_id: (item as any).product_id || null,
            product_name: item.product_name,
            product_price: item.product_price,
            quantity: item.quantity,
            subtotal: item.subtotal || (item.product_price * item.quantity),
            variety_id: (item as any).variety_id || null,
            variety_name: (item as any).variety_name || null,
            variety_price: (item as any).variety_price || null,
            notes: item.notes,
            category_name: (item as any).category_name || null,
            order_item_extras: (item as any).order_item_extras || [],
          })
        }
      }

      // Criar novo pedido com os dados do primeiro pedido
      const newOrderData: any = {
        order_type: baseOrder.order_type,
        status: baseOrder.status, // Manter o status do primeiro pedido
        table_number: baseOrder.table_number,
        total: totalSum,
        customer_name: baseOrder.customer_name,
        customer_phone: baseOrder.customer_phone,
        delivery_address: baseOrder.delivery_address,
        reference_point: baseOrder.reference_point,
        delivery_fee: baseOrder.delivery_fee || 0,
        payment_method: baseOrder.payment_method,
        notes: allNotes.length > 0 ? `Pedidos juntados:\n${allNotes.join('\n')}` : `Pedidos juntados: ${selectedOrders.map(o => `#${o.id.slice(0, 8).toUpperCase()}`).join(', ')}`,
      }

      // Inserir novo pedido
      const { data: newOrder, error: orderError } = await supabase
        .from("orders")
        .insert(newOrderData)
        .select()
        .single()

      if (orderError) throw orderError

      // Inserir todos os itens
      const itemsToInsert = allItems.map((item) => ({
        order_id: newOrder.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: item.product_price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        variety_id: item.variety_id,
        variety_name: item.variety_name,
        variety_price: item.variety_price,
        notes: item.notes,
        category_name: item.category_name,
      }))

      const { data: insertedItems, error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert)
        .select()

      if (itemsError) throw itemsError

      // Inserir extras dos itens
      // Mapear extras aos itens inseridos usando product_name e quantity como chave
      const extrasToInsert: any[] = []
      if (insertedItems) {
        allItems.forEach((item, index) => {
          if (item.order_item_extras && item.order_item_extras.length > 0 && insertedItems[index]) {
            item.order_item_extras.forEach((extra: any) => {
              extrasToInsert.push({
                order_item_id: insertedItems[index].id,
                extra_id: extra.extra_id || null,
                extra_name: extra.extra_name,
                extra_price: extra.extra_price,
                quantity: extra.quantity,
              })
            })
          }
        })
      }

      if (extrasToInsert.length > 0) {
        const { error: extrasError } = await supabase
          .from("order_item_extras")
          .insert(extrasToInsert)

        if (extrasError) throw extrasError
      }

      // Cancelar os pedidos originais
      const { error: cancelError } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .in("id", Array.from(selectedOrderIds))

      if (cancelError) throw cancelError

      // Limpar seleção e fechar modal
      setSelectedOrderIds(new Set())
      setIsMergeModalOpen(false)

      // Atualizar página
      router.refresh()
      alert(`${selectedOrders.length} pedidos foram juntados com sucesso em um único pedido!`)
    } catch (error) {
      console.error("Erro ao juntar pedidos:", error)
      alert("Erro ao juntar pedidos. Tente novamente.")
    } finally {
      setIsMerging(false)
    }
  }

  // Filtrar pedidos deletados da lista (usar localOrders para manter dados durante refresh)
  const visibleOrders = localOrders.filter((o) => !deletedOrderIds.has(o.id))
  
  // Função para filtrar pedidos por data
  const filterOrdersByDate = useCallback((orders: Order[], filter: string): Order[] => {
    if (filter === "all") return orders
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    today.setHours(0, 0, 0, 0)
    
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)
    
    switch (filter) {
      case "today": {
        return orders.filter((order) => {
          const orderDate = new Date(order.created_at)
          return orderDate >= today && orderDate <= todayEnd
        })
      }
      case "yesterday": {
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayEnd = new Date(yesterday)
        yesterdayEnd.setHours(23, 59, 59, 999)
        
        return orders.filter((order) => {
          const orderDate = new Date(order.created_at)
          return orderDate >= yesterday && orderDate <= yesterdayEnd
        })
      }
      case "last7days": {
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        
        return orders.filter((order) => {
          const orderDate = new Date(order.created_at)
          return orderDate >= sevenDaysAgo && orderDate <= todayEnd
        })
      }
      case "last30days": {
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        return orders.filter((order) => {
          const orderDate = new Date(order.created_at)
          return orderDate >= thirtyDaysAgo && orderDate <= todayEnd
        })
      }
      default:
        return orders
    }
  }, [])
  
  // Filtrar por data primeiro
  const dateFilteredOrders = useMemo(() => {
    return filterOrdersByDate(visibleOrders, dateFilter)
  }, [visibleOrders, dateFilter, filterOrdersByDate])
  
  // Filtrar por busca de mesa
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return dateFilteredOrders
    
    const searchNum = parseInt(searchTerm.trim())
    if (isNaN(searchNum)) return dateFilteredOrders
    
    return dateFilteredOrders.filter((o) => o.table_number === searchNum)
  }, [dateFilteredOrders, searchTerm])
  
  // Usar useMemo para evitar recálculos desnecessários
  const { deliveryOrders, dineInOrders, balcaoOrders, pendingOrders, preparingOrders, readyOrders, outForDeliveryOrders, deliveredOrders } = useMemo(() => {
    const delivery = filteredOrders.filter((o) => o.order_type === "delivery")
    const dineIn = filteredOrders.filter((o) => o.order_type === "dine-in" && o.table_number !== 0)
    const balcao = filteredOrders.filter((o) => o.order_type === "dine-in" && o.table_number === 0)
    const pending = filteredOrders.filter((o) => o.status === "pending")
    const preparing = filteredOrders.filter((o) => o.status === "preparing")
    const ready = filteredOrders.filter((o) => o.status === "ready")
    const outForDelivery = filteredOrders.filter((o) => o.status === "out_for_delivery")
    const delivered = filteredOrders.filter((o) => o.status === "delivered")
    
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
  }, [filteredOrders])

  return (
    <div className="orders-full-width min-h-screen w-full bg-gradient-to-br from-stone-50 via-stone-100 to-slate-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm w-full">
        <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2.5 sm:py-3 md:py-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Primeira linha: Título e Botões */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1">
                <div className="bg-slate-600 p-1 sm:p-1.5 md:p-2 rounded-lg flex-shrink-0">
                  <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-900 truncate">Gerenciamento de Pedidos</h1>
                  <p className="text-[10px] xs:text-xs sm:text-sm text-slate-700 break-words">
                    <span className="whitespace-nowrap">
                      {searchTerm ? `${filteredOrders.length} pedido(s) encontrado(s)` : `${dateFilteredOrders.length} pedido(s)${dateFilter !== "all" ? " no período" : " ativos"}`}
                    </span>
                    <span className="hidden xs:inline"> ({deliveryOrders.length} delivery, {dineInOrders.length} mesa, {balcaoOrders.length} retirada local)</span>
                    {isEnabled && (
                      <span className="ml-1 sm:ml-2 text-green-600 text-[10px] xs:text-xs">• Auto</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto flex-shrink-0">
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
                  className="border-slate-300 text-slate-900 hover:bg-slate-50 bg-transparent cursor-pointer text-xs sm:text-sm px-2 sm:px-3"
                  title="Clique para ativar notificações de novos pedidos"
                >
                  <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 md:mr-2" />
                  <span className="hidden sm:inline text-xs md:text-sm">Ativar Notificações</span>
                </Button>
              )}
              {permission === "granted" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-50 bg-transparent text-xs sm:text-sm px-2 sm:px-3"
                  title="Notificações ativadas"
                  disabled
                >
                  <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 md:mr-2" />
                  <span className="hidden sm:inline text-xs md:text-sm">Ativado</span>
                </Button>
              )}
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-900 hover:bg-slate-50 bg-transparent text-xs sm:text-sm px-2 sm:px-3"
              >
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 md:mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline text-xs md:text-sm">Atualizar</span>
              </Button>
              <AutoPrintSettings />
              {filteredOrders.length > 0 && (
                <Button
                  onClick={handleOpenMergeModal}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 bg-transparent text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Merge className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 md:mr-2" />
                  <span className="hidden sm:inline text-xs md:text-sm">Juntar Pedidos</span>
                </Button>
              )}
              {filteredOrders.length > 0 && (
                <Button
                  onClick={() => setIsDeleteAllModalOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-50 bg-transparent text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 md:mr-2" />
                  <span className="hidden sm:inline text-xs md:text-sm">Limpar Todos</span>
                </Button>
              )}
              </div>
            </div>
            
            {/* Segunda linha: Barra de Pesquisa e Filtro de Data */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-auto sm:max-w-xs">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    placeholder="Buscar por número da mesa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-9 w-full border-slate-300 focus:border-slate-500"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 hover:bg-slate-100"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-3 w-3 text-slate-500" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="w-full sm:w-auto sm:min-w-[180px]">
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full sm:w-auto border-slate-300 focus:border-slate-500">
                    <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Filtrar por data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os pedidos</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="yesterday">Ontem</SelectItem>
                    <SelectItem value="last7days">Últimos 7 dias</SelectItem>
                    <SelectItem value="last30days">Últimos 30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
        <Tabs defaultValue="all" className="space-y-3 sm:space-y-6">
          <TabsList className="bg-white border border-slate-200 w-full sm:w-auto grid grid-cols-2 sm:flex gap-1 sm:gap-0 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-slate-100 text-[10px] xs:text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 whitespace-nowrap">
              <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span>Todos</span>
            </TabsTrigger>
            <TabsTrigger value="delivery" className="data-[state=active]:bg-slate-100 text-[10px] xs:text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 whitespace-nowrap">
              <Bike className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span>Delivery ({deliveryOrders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="dine-in" className="data-[state=active]:bg-slate-100 text-[10px] xs:text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 whitespace-nowrap">
              <UtensilsCrossed className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span>Mesas ({dineInOrders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="balcao" className="data-[state=active]:bg-slate-100 text-[10px] xs:text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 whitespace-nowrap">
              <Store className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span>Retirada Local ({balcaoOrders.length})</span>
            </TabsTrigger>
            <TabsTrigger value="tables" className="data-[state=active]:bg-slate-100 text-[10px] xs:text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2 whitespace-nowrap">
              <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span>Status</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 sm:space-y-8">
            {/* Pending Orders */}
            <section>
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 flex items-center gap-2">
                <span className="bg-yellow-500 h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 rounded-full flex-shrink-0"></span>
                <span className="whitespace-nowrap">Pendentes ({pendingOrders.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                {pendingOrders.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
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
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 flex items-center gap-2">
                <span className="bg-blue-500 h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 rounded-full flex-shrink-0"></span>
                <span className="whitespace-nowrap">Em Preparo ({preparingOrders.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                {preparingOrders.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
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
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 flex items-center gap-2">
                <span className="bg-green-500 h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 rounded-full flex-shrink-0"></span>
                <span className="whitespace-nowrap">Prontos ({readyOrders.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                {readyOrders.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
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
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 flex items-center gap-2">
                  <span className="bg-slate-500 h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 rounded-full flex-shrink-0"></span>
                  <span className="whitespace-nowrap">Saiu para Entrega ({outForDeliveryOrders.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  {outForDeliveryOrders.map((order) => (
                    <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
                  ))}
                </div>
              </section>
            )}

            {/* Delivered Orders */}
            {deliveredOrders.length > 0 && (
              <section>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 flex items-center gap-2">
                  <span className="bg-emerald-500 h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 rounded-full flex-shrink-0"></span>
                  <span className="whitespace-nowrap">Entregues ({deliveredOrders.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  {deliveredOrders.map((order) => (
                    <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
                  ))}
                </div>
              </section>
            )}
          </TabsContent>

          <TabsContent value="delivery" className="space-y-4 sm:space-y-8">
            {deliveryOrders.length === 0 ? (
              <p className="text-slate-700 text-center py-6 sm:py-12 text-xs sm:text-sm md:text-base">Nenhum pedido de delivery</p>
            ) : (
              <>
                {deliveryOrders.filter((o) => o.status === "pending").length > 0 && (
                  <section>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 whitespace-nowrap">Pendentes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {deliveryOrders
                        .filter((o) => o.status === "pending")
                        .map((order) => (
                          <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
                        ))}
                    </div>
                  </section>
                )}
                {deliveryOrders.filter((o) => o.status === "preparing").length > 0 && (
                  <section>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 whitespace-nowrap">Em Preparo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {deliveryOrders
                        .filter((o) => o.status === "preparing")
                        .map((order) => (
                          <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
                        ))}
                    </div>
                  </section>
                )}
                {deliveryOrders.filter((o) => o.status === "ready" || o.status === "out_for_delivery").length > 0 && (
                  <section>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 whitespace-nowrap">Prontos / Em Entrega</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {deliveryOrders
                        .filter((o) => o.status === "ready" || o.status === "out_for_delivery")
                        .map((order) => (
                          <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
                        ))}
                    </div>
                  </section>
                )}
                {deliveryOrders.filter((o) => o.status === "delivered").length > 0 && (
                  <section>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 whitespace-nowrap">Entregues</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {deliveryOrders
                        .filter((o) => o.status === "delivered")
                        .map((order) => (
                          <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
                        ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="dine-in" className="space-y-4 sm:space-y-8">
            {dineInOrders.length === 0 ? (
              <p className="text-slate-700 text-center py-6 sm:py-12 text-xs sm:text-sm md:text-base">Nenhum pedido de mesa</p>
            ) : (
              <>
                {dineInOrders.filter((o) => o.status === "pending").length > 0 && (
                  <section>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 whitespace-nowrap">Pendentes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {dineInOrders
                        .filter((o) => o.status === "pending")
                        .map((order) => (
                          <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
                        ))}
                    </div>
                  </section>
                )}
                {dineInOrders.filter((o) => o.status === "preparing").length > 0 && (
                  <section>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 whitespace-nowrap">Em Preparo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {dineInOrders
                        .filter((o) => o.status === "preparing")
                        .map((order) => (
                          <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
                        ))}
                    </div>
                  </section>
                )}
                {dineInOrders.filter((o) => o.status === "ready").length > 0 && (
                  <section>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 whitespace-nowrap">Prontos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {dineInOrders
                        .filter((o) => o.status === "ready")
                        .map((order) => (
                          <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
                        ))}
                    </div>
                  </section>
                )}
                {dineInOrders.filter((o) => o.status === "delivered").length > 0 && (
                  <section>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 whitespace-nowrap">Entregues</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {dineInOrders
                        .filter((o) => o.status === "delivered")
                        .map((order) => (
                          <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
                        ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="balcao" className="space-y-4 sm:space-y-8">
            {balcaoOrders.length === 0 ? (
              <p className="text-slate-700 text-center py-6 sm:py-12 text-xs sm:text-sm md:text-base">Nenhum pedido de retirada local</p>
            ) : (
              <>
                {balcaoOrders.filter((o) => o.status === "pending").length > 0 && (
                  <section>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 whitespace-nowrap">Pendentes</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {balcaoOrders
                        .filter((o) => o.status === "pending")
                        .map((order) => (
                          <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
                        ))}
                    </div>
                  </section>
                )}
                {balcaoOrders.filter((o) => o.status === "preparing").length > 0 && (
                  <section>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 whitespace-nowrap">Em Preparo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {balcaoOrders
                        .filter((o) => o.status === "preparing")
                        .map((order) => (
                          <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
                        ))}
                    </div>
                  </section>
                )}
                {balcaoOrders.filter((o) => o.status === "ready").length > 0 && (
                  <section>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 whitespace-nowrap">Prontos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {balcaoOrders
                        .filter((o) => o.status === "ready")
                        .map((order) => (
                          <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
                        ))}
                    </div>
                  </section>
                )}
                {balcaoOrders.filter((o) => o.status === "delivered").length > 0 && (
                  <section>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 mb-2 sm:mb-4 whitespace-nowrap">Entregues</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                      {balcaoOrders
                        .filter((o) => o.status === "delivered")
                        .map((order) => (
                          <OrderCard 
                    key={order.id} 
                    order={order} 
                    restaurantInfo={restaurantInfo}
                  />
                        ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="tables">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              {tables.map((table) => {
                const tableOrders = dineInOrders.filter((o) => o.table_number === table.table_number)
                return <TableStatus key={table.id} table={table} orders={tableOrders} />
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modal de confirmação para deletar todos os pedidos */}
      <Dialog open={isDeleteAllModalOpen} onOpenChange={setIsDeleteAllModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Limpar Todos os Pedidos</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar todos os pedidos? Esta ação não pode ser desfeita.
              <br />
              <span className="font-semibold text-red-600 mt-2 block">
                {filteredOrders.length} pedido(s) serão deletados permanentemente.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteAllModalOpen(false)}
              disabled={isDeletingAll}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAllOrders}
              disabled={isDeletingAll}
              className="w-full sm:w-auto"
            >
              {isDeletingAll ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar Todos
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Juntar Pedidos */}
      <Dialog open={isMergeModalOpen} onOpenChange={handleCloseMergeModal}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl md:text-2xl">Juntar Pedidos</DialogTitle>
            <DialogDescription>
              Selecione pelo menos 2 pedidos para juntar em um único pedido. Os pedidos originais serão cancelados.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                <p>Nenhum pedido disponível para juntar</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredOrders.map((order) => {
                  const isSelected = selectedOrderIds.has(order.id)
                  const isDelivery = order.order_type === "delivery"
                  const orderTime = new Date(order.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  
                  return (
                    <div
                      key={order.id}
                      onClick={() => toggleOrderSelection(order.id)}
                      className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-slate-900">
                              Pedido #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            {isDelivery ? (
                              <Badge className="bg-blue-500 text-white">Delivery</Badge>
                            ) : order.table_number === 0 ? (
                              <Badge className="bg-slate-500 text-white">Retirada Local</Badge>
                            ) : (
                              <Badge className="bg-green-500 text-white">Mesa {order.table_number}</Badge>
                            )}
                            <Badge className={`${
                              order.status === "pending" ? "bg-yellow-500" :
                              order.status === "preparing" ? "bg-blue-500" :
                              order.status === "ready" ? "bg-green-500" :
                              order.status === "out_for_delivery" ? "bg-purple-500" :
                              "bg-emerald-500"
                            } text-white`}>
                              {order.status === "pending" ? "Pendente" :
                               order.status === "preparing" ? "Em Preparo" :
                               order.status === "ready" ? "Pronto" :
                               order.status === "out_for_delivery" ? "Saiu para Entrega" :
                               "Entregue"}
                            </Badge>
                            <span className="text-xs text-slate-600">{orderTime}</span>
                          </div>
                          {order.customer_name && (
                            <p className="text-sm text-slate-700 mb-1">
                              <span className="font-semibold">Cliente:</span> {order.customer_name}
                            </p>
                          )}
                          {order.payment_method && (
                            <p className="text-sm text-slate-700 mb-1">
                              <span className="font-semibold">Pagamento:</span> {order.payment_method}
                            </p>
                          )}
                          <div className="text-sm text-slate-600 mb-1">
                            <span className="font-semibold">Itens:</span> {order.order_items.length} item(s)
                          </div>
                          <p className="text-base font-bold text-slate-900">
                            Total: R$ {order.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-3 flex-col sm:flex-row border-t pt-4 mt-4">
            <Button
              variant="outline"
              onClick={handleCloseMergeModal}
              disabled={isMerging}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleMergeOrders}
              disabled={selectedOrderIds.size < 2 || isMerging}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {isMerging ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Juntando...
                </>
              ) : (
                <>
                  <Merge className="h-4 w-4 mr-2" />
                  Juntar {selectedOrderIds.size} Pedido(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
