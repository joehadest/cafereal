"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Tentando fazer login com:", email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("[v0] Resposta do login:", { data, error })

      if (error) {
        console.log("[v0] Erro no login:", error.message)
        throw error
      }

      console.log("[v0] Login bem-sucedido, redirecionando para /admin")
      window.location.href = "/admin"
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao fazer login"
      console.log("[v0] Erro capturado:", errorMessage)

      if (errorMessage.includes("Email not confirmed")) {
        setError(
          "⚠️ Email não confirmado. Para usar o sistema em desenvolvimento, desabilite a confirmação de email no Supabase: Authentication → Providers → Email → Desmarque 'Confirm email'",
        )
      } else if (errorMessage.includes("Invalid login credentials")) {
        setError("Email ou senha incorretos. Verifique suas credenciais e tente novamente.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-stone-50">
      <div className="w-full max-w-sm">
        <Card className="border-slate-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-slate-900">Painel Administrativo</CardTitle>
            <CardDescription className="text-slate-700">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-stone-50 border border-stone-200 rounded-lg">
              <p className="text-xs text-stone-800">
                <strong>💡 Dica:</strong> Se você não consegue fazer login, pode ser necessário desabilitar a
                confirmação de email no Supabase para desenvolvimento.
              </p>
            </div>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-slate-900">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@restaurante.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-slate-200 focus:border-slate-400"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-slate-900">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-slate-200 focus:border-slate-400"
                  />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
                <Button type="submit" className="w-full bg-slate-600 hover:bg-slate-700" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
