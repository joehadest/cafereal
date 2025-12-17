"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

/**
 * Componente que renova automaticamente a sessão do admin
 * para evitar logout automático após períodos de inatividade
 */
export function SessionRefresher() {
  const router = useRouter()
  const isCheckingRef = useRef(false)
  const redirectingRef = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    let refreshInterval: NodeJS.Timeout | null = null

    // Função para renovar a sessão silenciosamente
    const refreshSession = async () => {
      // Evitar múltiplas verificações simultâneas
      if (isCheckingRef.current || redirectingRef.current) {
        return
      }

      try {
        isCheckingRef.current = true

        // Usar getUser() que é mais confiável e sincronizado com o servidor
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        // Só redirecionar se realmente não houver usuário E não houver erro de rede
        // Erros de rede não devem causar logout
        if (userError) {
          // Se for erro de autenticação (não de rede), verificar novamente
          if (userError.message.includes("JWT") || userError.message.includes("token")) {
            // Token inválido, verificar se realmente expirou
            const {
              data: { session },
            } = await supabase.auth.getSession()
            
            if (!session) {
              // Só redirecionar se realmente não houver sessão
              if (!redirectingRef.current) {
                redirectingRef.current = true
                router.push("/auth/login")
              }
            }
          }
          // Se for erro de rede, ignorar e tentar novamente depois
          return
        }

        if (!user) {
          // Só redirecionar se realmente não houver usuário após múltiplas tentativas
          if (!redirectingRef.current) {
            redirectingRef.current = true
            router.push("/auth/login")
          }
          return
        }

        // Se chegou aqui, há usuário válido
        // Verificar se a sessão precisa ser renovada
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          // Se a sessão estiver próxima de expirar (menos de 10 minutos), renovar
          const expiresAt = session.expires_at
          if (expiresAt) {
            const expiresIn = expiresAt - Math.floor(Date.now() / 1000)
            if (expiresIn < 600) {
              // Menos de 10 minutos, renovar a sessão silenciosamente
              await supabase.auth.refreshSession().catch((error) => {
                // Ignorar erros de refresh, não causar logout
                console.warn("Erro ao renovar sessão (não crítico):", error)
              })
            }
          }
        }
      } catch (error) {
        // Erros não devem causar logout imediato
        console.warn("Erro ao verificar sessão (não crítico):", error)
      } finally {
        isCheckingRef.current = false
      }
    }

    // Listener para mudanças de estado de autenticação do Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Só redirecionar em eventos específicos de logout
      if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session)) {
        if (!redirectingRef.current) {
          redirectingRef.current = true
          router.push("/auth/login")
        }
      }
    })

    // Renovar a sessão imediatamente ao montar o componente
    refreshSession()

    // Renovar a sessão a cada 10 minutos (menos frequente para evitar sobrecarga)
    refreshInterval = setInterval(refreshSession, 10 * 60 * 1000)

    // Renovar quando a página volta ao foco (com debounce)
    let visibilityTimeout: NodeJS.Timeout | null = null
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Aguardar um pouco antes de verificar para evitar múltiplas verificações
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout)
        }
        visibilityTimeout = setTimeout(() => {
          refreshSession()
        }, 1000)
      }
    }

    // Renovar quando a janela recebe foco (com debounce)
    let focusTimeout: NodeJS.Timeout | null = null
    const handleFocus = () => {
      if (focusTimeout) {
        clearTimeout(focusTimeout)
      }
      focusTimeout = setTimeout(() => {
        refreshSession()
      }, 1000)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout)
      }
      if (focusTimeout) {
        clearTimeout(focusTimeout)
      }
      subscription.unsubscribe()
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [router])

  // Este componente não renderiza nada
  return null
}

