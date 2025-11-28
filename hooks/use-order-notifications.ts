"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

type OnNewOrderCallback = () => void

export function useOrderNotifications(onNewOrder?: OnNewOrderCallback) {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isEnabled, setIsEnabled] = useState(false)
  const [isPollingActive, setIsPollingActive] = useState(false)
  const lastOrderIdRef = useRef<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Verificar permissão atual (sem solicitar automaticamente)
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission)
      setIsEnabled(Notification.permission === "granted")
    }
  }, [])

  // Verificar novos pedidos periodicamente (polling - GRATUITO)
  // Sempre verificar, mesmo sem permissão de notificações, para atualizar a lista
  // O polling funciona sempre, as notificações são opcionais
  useEffect(() => {
    const supabase = createClient()

    // Função para verificar novos pedidos
    const checkNewOrders = async () => {
      try {
        // Buscar o último pedido pendente
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
          .limit(1)

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
          // Se não há pedidos, resetar o último ID para detectar quando aparecer um novo
          if (lastOrderIdRef.current !== null) {
            lastOrderIdRef.current = null
          }
          // Atualizar a lista mesmo sem novos pedidos (para atualizar status de pedidos existentes)
          if (onNewOrder) {
            try {
              onNewOrder()
            } catch (callbackError) {
              // Se o callback falhar, apenas logar e continuar
              console.warn("Erro ao executar callback:", callbackError)
            }
          }
          return
        }

        const latestOrder = orders[0]

        // Se é o primeiro check, apenas armazenar o ID
        if (!lastOrderIdRef.current) {
          lastOrderIdRef.current = latestOrder.id
          console.log("✅ Atualização automática de pedidos ativada (modo polling)")
          // Atualizar a lista na primeira verificação
          if (onNewOrder) {
            try {
              onNewOrder()
            } catch (callbackError) {
              // Se o callback falhar, apenas logar e continuar
              console.warn("Erro ao executar callback inicial:", callbackError)
            }
          }
          return
        }

        // Se encontrou um pedido novo OU o status mudou (verificar por ID e status)
        const hasNewOrder = latestOrder.id !== lastOrderIdRef.current
        const hasStatusChange = latestOrder.status !== "delivered" // Se ainda está ativo, pode ter mudado de status

        if (hasNewOrder) {
          lastOrderIdRef.current = latestOrder.id

          // Criar notificação apenas se tiver permissão
          if (isEnabled && "Notification" in window && Notification.permission === "granted") {
          const isDelivery = latestOrder.order_type === "delivery"
          const title = isDelivery
            ? "🍕 Novo Pedido de Delivery!"
            : `🍽️ Novo Pedido - Mesa ${latestOrder.table_number}`
          const itemsCount = latestOrder.order_items?.length || 0
          const total = latestOrder.total.toFixed(2)

          const body = isDelivery
            ? `${latestOrder.customer_name || "Cliente"} • ${itemsCount} item(ns) • R$ ${total}`
            : `${itemsCount} item(ns) • R$ ${total}`

            // Mostrar notificação (funciona mesmo quando a página está em background)
          const notification = new Notification(title, {
            body,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag: `order-${latestOrder.id}`,
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
          }

          // Atualizar a página automaticamente quando detectar novo pedido
          if (onNewOrder) {
            try {
            onNewOrder()
            } catch (callbackError) {
              // Se o callback falhar, apenas logar e continuar
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
        } else if (hasStatusChange) {
          // Atualizar a lista mesmo sem novo pedido (para atualizar status de pedidos existentes)
          if (onNewOrder) {
            try {
              onNewOrder()
            } catch (callbackError) {
              // Se o callback falhar, apenas logar e continuar
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

    // Verificar a cada 5 segundos para balancear responsividade e performance
    intervalRef.current = setInterval(checkNewOrders, 5000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      setIsPollingActive(false)
    }
  }, [isEnabled, onNewOrder])

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

