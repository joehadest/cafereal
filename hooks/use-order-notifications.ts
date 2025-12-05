"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

type OnNewOrderCallback = () => void

export function useOrderNotifications(onNewOrder?: OnNewOrderCallback) {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isEnabled, setIsEnabled] = useState(false)
  const [isPollingActive, setIsPollingActive] = useState(false)
  const lastOrderIdRef = useRef<string | null>(null)
  const lastOrderTimestampRef = useRef<string | null>(null)
  const knownOrderIdsRef = useRef<Set<string>>(new Set())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onNewOrderRef = useRef(onNewOrder)

  // Verificar permissão atual (sem solicitar automaticamente)
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission)
      setIsEnabled(Notification.permission === "granted")
    }
  }, [])

  // Atualizar a referência do callback quando mudar
  useEffect(() => {
    onNewOrderRef.current = onNewOrder
  }, [onNewOrder])

  // Verificar novos pedidos periodicamente (polling - GRATUITO)
  // Sempre verificar, mesmo sem permissão de notificações, para atualizar a lista
  // O polling funciona sempre, as notificações são opcionais
  useEffect(() => {
    const supabase = createClient()

    // Função para verificar novos pedidos
    const checkNewOrders = async () => {
      try {
        // Buscar pedidos ativos (últimos 10 para garantir que não perdemos nenhum)
        const { data: orders, error } = await supabase
          .from("orders")
          .select(
            `
            *,
            order_items(
              *,
              order_item_extras(*)
            )
          `
          )
          .in("status", ["pending", "preparing", "ready", "out_for_delivery"])
          .order("created_at", { ascending: false })
          .limit(10)

        if (error) {
          // Verificar se há uma mensagem de erro real antes de logar
          const hasErrorMessage = error.message && error.message.trim() !== ""
          const hasErrorCode = error.code && error.code.trim() !== ""
          
          if (hasErrorMessage || hasErrorCode) {
            console.error("Erro ao verificar pedidos:", error.message || error.code || error)
          }
          // Se não houver mensagem nem código, provavelmente é um objeto vazio e não há erro real
          return
        }

        if (!orders || orders.length === 0) {
          // Se não há pedidos, resetar os refs para detectar quando aparecer um novo
          if (lastOrderIdRef.current !== null || knownOrderIdsRef.current.size > 0) {
            lastOrderIdRef.current = null
            lastOrderTimestampRef.current = null
            knownOrderIdsRef.current.clear()
          }
          // Atualizar a lista mesmo sem novos pedidos (para atualizar status de pedidos existentes)
          if (onNewOrderRef.current) {
            try {
              onNewOrderRef.current()
            } catch (callbackError) {
              console.warn("Erro ao executar callback:", callbackError)
            }
          }
          return
        }

        // Se é o primeiro check, inicializar os refs
        if (!lastOrderIdRef.current && orders.length > 0) {
          const latestOrder = orders[0]
          lastOrderIdRef.current = latestOrder.id
          lastOrderTimestampRef.current = latestOrder.created_at
          // Adicionar todos os pedidos conhecidos ao set
          orders.forEach((order: any) => {
            knownOrderIdsRef.current.add(order.id)
          })
          console.log("✅ Atualização automática de pedidos ativada (modo polling)")
          // Atualizar a lista na primeira verificação
          if (onNewOrderRef.current) {
            try {
              onNewOrderRef.current()
            } catch (callbackError) {
              console.warn("Erro ao executar callback inicial:", callbackError)
            }
          }
          return
        }

        // Verificar se há novos pedidos comparando IDs e timestamps
        let hasNewOrder = false
        let newestOrder: any = null

        for (const order of orders) {
          // Se o pedido não está no set de conhecidos, é novo
          if (!knownOrderIdsRef.current.has(order.id)) {
            hasNewOrder = true
            if (!newestOrder || new Date(order.created_at) > new Date(newestOrder.created_at)) {
              newestOrder = order
            }
            knownOrderIdsRef.current.add(order.id)
          }
        }

        // Verificar também se o pedido mais recente mudou (pode ter sido criado entre checks)
        const latestOrder = orders[0]
        if (latestOrder && latestOrder.id !== lastOrderIdRef.current) {
          // Se o ID mudou, pode ser um novo pedido ou o último foi deletado
          if (!knownOrderIdsRef.current.has(latestOrder.id)) {
            hasNewOrder = true
            newestOrder = latestOrder
            knownOrderIdsRef.current.add(latestOrder.id)
          }
          lastOrderIdRef.current = latestOrder.id
          lastOrderTimestampRef.current = latestOrder.created_at
        }

        // Limpar IDs antigos que não estão mais na lista (pedidos entregues/cancelados)
        const currentOrderIds = new Set(orders.map((o: any) => o.id))
        knownOrderIdsRef.current.forEach((id) => {
          if (!currentOrderIds.has(id)) {
            knownOrderIdsRef.current.delete(id)
          }
        })

        if (hasNewOrder && newestOrder) {
          // Criar notificação apenas se tiver permissão
          if (isEnabled && "Notification" in window && Notification.permission === "granted") {
            const isDelivery = newestOrder.order_type === "delivery"
            const title = isDelivery
              ? "🍕 Novo Pedido de Delivery!"
              : `🍽️ Novo Pedido - Mesa ${newestOrder.table_number}`
            const itemsCount = newestOrder.order_items?.length || 0
            const total = newestOrder.total.toFixed(2)

            const body = isDelivery
              ? `${newestOrder.customer_name || "Cliente"} • ${itemsCount} item(ns) • R$ ${total}`
              : `${itemsCount} item(ns) • R$ ${total}`

            // Mostrar notificação (funciona mesmo quando a página está em background)
            try {
              const notification = new Notification(title, {
                body,
                icon: "/favicon.ico",
                badge: "/favicon.ico",
                tag: `order-${newestOrder.id}`,
                requireInteraction: false,
                silent: false,
              })

              // Quando a notificação for clicada, focar na janela e atualizar
              notification.onclick = () => {
                window.focus()
                notification.close()
                // Disparar evento customizado para atualizar a página
                window.dispatchEvent(new CustomEvent("order-notification-clicked"))
              }

              // Tocar som de notificação usando Web Audio API
              try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()

                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)

                oscillator.frequency.value = 800
                oscillator.type = "sine"

                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

                oscillator.start(audioContext.currentTime)
                oscillator.stop(audioContext.currentTime + 0.2)
              } catch (e) {
                // Ignorar erros de áudio
              }
            } catch (notificationError) {
              console.warn("Erro ao criar notificação:", notificationError)
            }
          }

          // Atualizar a página automaticamente quando detectar novo pedido
          if (onNewOrderRef.current) {
            try {
              onNewOrderRef.current()
            } catch (callbackError) {
              console.warn("Erro ao executar callback de novo pedido:", callbackError)
            }
          } else {
            // Fallback: disparar evento para atualizar
            try {
              window.dispatchEvent(new CustomEvent("order-notification-clicked"))
            } catch (eventError) {
              // Ignorar erros de evento
            }
          }
        } else {
          // Sem novo pedido, mas atualizar a lista para refletir mudanças de status
          if (onNewOrderRef.current) {
            try {
              onNewOrderRef.current()
            } catch (callbackError) {
              console.warn("Erro ao executar callback de atualização:", callbackError)
            }
          }
        }
      } catch (error) {
        // Verificar se há uma mensagem de erro real antes de logar
        if (error instanceof Error && error.message && error.message.trim() !== "") {
          console.error("Erro ao verificar novos pedidos:", error.message)
        } else if (error && typeof error === "object" && "message" in error) {
          const errorMessage = (error as any).message
          if (errorMessage && errorMessage.trim() !== "") {
            console.error("Erro ao verificar novos pedidos:", errorMessage)
          }
        }
        // Se não houver mensagem de erro, não logar (evitar logs de objetos vazios)
      }
    }

    // Verificar imediatamente
    checkNewOrders()
    setIsPollingActive(true)

    // Verificar a cada 3 segundos para melhor responsividade
    // Usar setInterval com tratamento de erro para garantir que continue funcionando
    intervalRef.current = setInterval(() => {
      try {
        checkNewOrders()
      } catch (error) {
        console.error("Erro no polling de pedidos:", error)
        // Continuar tentando mesmo se houver erro
      }
    }, 3000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsPollingActive(false)
    }
  }, [isEnabled]) // Remover onNewOrder das dependências para evitar recriação do intervalo

  const requestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission()
        setPermission(perm)
        setIsEnabled(perm === "granted")
        
        if (perm === "granted") {
          console.log("✅ Permissão de notificações concedida!")
        } else if (perm === "denied") {
          console.warn("⚠️ Permissão de notificações negada. Você precisará ativar manualmente nas configurações do navegador.")
        }
        
        return perm
      } catch (error) {
        console.error("Erro ao solicitar permissão de notificações:", error)
        return "denied" as NotificationPermission
      }
    }
    return "denied" as NotificationPermission
  }

  return {
    permission,
    isEnabled: isEnabled || isPollingActive, // Polling sempre ativo, notificações opcionais
    requestPermission,
  }
}

