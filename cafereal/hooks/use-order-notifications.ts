"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

type OnNewOrderCallback = () => void

export function useOrderNotifications(onNewOrder?: OnNewOrderCallback) {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isEnabled, setIsEnabled] = useState(false)
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
  useEffect(() => {
    if (!isEnabled) return

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
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)

        if (error) {
          console.error("Erro ao verificar pedidos:", error)
          return
        }

        if (!orders || orders.length === 0) return

        const latestOrder = orders[0]

        // Se é o primeiro check, apenas armazenar o ID
        if (!lastOrderIdRef.current) {
          lastOrderIdRef.current = latestOrder.id
          console.log("✅ Notificações de pedidos ativadas (modo polling)")
          return
        }

        // Se encontrou um pedido novo
        if (latestOrder.id !== lastOrderIdRef.current) {
          lastOrderIdRef.current = latestOrder.id

          // Criar notificação
          const isDelivery = latestOrder.order_type === "delivery"
          const title = isDelivery
            ? "🍕 Novo Pedido de Delivery!"
            : `🍽️ Novo Pedido - Mesa ${latestOrder.table_number}`
          const itemsCount = latestOrder.order_items?.length || 0
          const total = latestOrder.total.toFixed(2)

          const body = isDelivery
            ? `${latestOrder.customer_name || "Cliente"} • ${itemsCount} item(ns) • R$ ${total}`
            : `${itemsCount} item(ns) • R$ ${total}`

          // Mostrar notificação
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

          // Tocar som de notificação usando Web Audio API (opcional)
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

          // Atualizar a página automaticamente quando detectar novo pedido
          if (onNewOrder) {
            onNewOrder()
          } else {
            // Fallback: disparar evento para atualizar
            window.dispatchEvent(new CustomEvent("order-notification-clicked"))
          }
        }
      } catch (error) {
        console.error("Erro ao verificar novos pedidos:", error)
      }
    }

    // Verificar imediatamente
    checkNewOrders()

    // Verificar a cada 2 segundos para resposta mais rápida
    intervalRef.current = setInterval(checkNewOrders, 2000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isEnabled])

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
    isEnabled,
    requestPermission,
  }
}

