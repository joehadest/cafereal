"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    try {
      // Cria o usuário no auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/admin`,
          data: {
            full_name: fullName,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Aguarda um pouco para os triggers executarem
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Garante que o perfil admin foi criado
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", authData.user.id)
          .maybeSingle()

        // Se o trigger não criou, cria manualmente
        if (!profile) {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: authData.user.id,
            email: authData.user.email || email,
            full_name: fullName,
            role: "admin",
          })

          if (profileError) {
            console.error("Erro ao criar perfil admin:", profileError)
            // Tenta novamente após mais um segundo
            await new Promise((resolve) => setTimeout(resolve, 1000))
            const { error: retryError } = await supabase.from("profiles").upsert({
              id: authData.user.id,
              email: authData.user.email || email,
              full_name: fullName,
              role: "admin",
            })
            if (retryError) {
              console.error("Erro ao criar perfil admin (tentativa 2):", retryError)
            }
          }
        }

        // Garante que NÃO está na tabela customer_profiles
        // (remove se o trigger de cliente tiver criado por engano)
        const { data: customerProfile } = await supabase
          .from("customer_profiles")
          .select("id")
          .eq("user_id", authData.user.id)
          .maybeSingle()

        if (customerProfile) {
          // Remove da tabela de clientes se estiver lá
          await supabase.from("customer_profiles").delete().eq("user_id", authData.user.id)
        }
      }

      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Erro ao criar conta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-stone-50">
      <div className="w-full max-w-sm">
        <Card className="border-slate-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-slate-900">Criar Conta Admin</CardTitle>
            <CardDescription className="text-slate-700">Crie uma conta de administrador</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName" className="text-slate-900">
                    Nome Completo
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="João Silva"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="border-slate-200 focus:border-slate-400"
                  />
                </div>
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
                <div className="grid gap-2">
                  <Label htmlFor="repeat-password" className="text-slate-900">
                    Repetir Senha
                  </Label>
                  <Input
                    id="repeat-password"
                    type="password"
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="border-slate-200 focus:border-slate-400"
                  />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
                <Button type="submit" className="w-full bg-slate-600 hover:bg-slate-700" disabled={isLoading}>
                  {isLoading ? "Criando conta..." : "Criar Conta"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
