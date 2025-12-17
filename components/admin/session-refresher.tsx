"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

/**
 * Componente que renova automaticamente a sessão do admin
 * para evitar logout automático após períodos de inatividade
 */
export function SessionRefresher() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let refreshInterval: NodeJS.Timeout | null = null

    // Função para renovar a sessão
    const refreshSession = async () => {
      try {
        // Verificar se há uma sessão ativa
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Erro ao obter sessão:", sessionError)
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (!user) {
            router.push("/auth/login")
          }
          return
        }

        if (!session) {
          // Se não houver sessão, verificar se há usuário
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (!user) {
            router.push("/auth/login")
            return
          }
        } else {
          // Se houver sessão, tentar renová-la se necessário
          // O Supabase renova automaticamente quando o token está próximo de expirar
          // Mas vamos garantir que a sessão seja atualizada chamando getUser()
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser()

          if (userError || !user) {
            // Se houver erro ou não houver usuário, redirecionar para login
            router.push("/auth/login")
            return
          }

          // Se a sessão estiver próxima de expirar (menos de 5 minutos), renovar
          const expiresAt = session.expires_at
          if (expiresAt) {
            const expiresIn = expiresAt - Math.floor(Date.now() / 1000)
            if (expiresIn < 300) {
              // Menos de 5 minutos, renovar a sessão
              const { error: refreshError } = await supabase.auth.refreshSession()
              if (refreshError) {
                console.error("Erro ao renovar sessão:", refreshError)
                // Se não conseguir renovar, verificar se ainda há usuário
                const {
                  data: { user: checkUser },
                } = await supabase.auth.getUser()
                if (!checkUser) {
                  router.push("/auth/login")
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Erro ao renovar sessão:", error)
        // Em caso de erro, verificar se o usuário ainda está autenticado
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login")
        }
      }
    }

    // Renovar a sessão imediatamente ao montar o componente
    refreshSession()

    // Renovar a sessão a cada 5 minutos (antes do timeout padrão)
    refreshInterval = setInterval(refreshSession, 5 * 60 * 1000)

    // Renovar quando a página volta ao foco
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshSession()
      }
    }

    // Renovar quando a janela recebe foco
    const handleFocus = () => {
      refreshSession()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", handleFocus)

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [router])

  // Este componente não renderiza nada
  return null
}

