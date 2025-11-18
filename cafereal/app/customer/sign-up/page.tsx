"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Lock, User, ArrowLeft, Home } from "lucide-react"

export default function CustomerSignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [street, setStreet] = useState("")
  const [number, setNumber] = useState("")
  const [complement, setComplement] = useState("")
  const [neighborhood, setNeighborhood] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")
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
      console.log("[v0] Starting sign up process for email:", email)

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
        },
      })

      if (authError) {
        console.log("[v0] Auth error:", authError.message)
        throw authError
      }

      console.log("[v0] User created successfully:", authData.user?.id)

      if (authData.user) {
        console.log("[v0] Creating customer profile...")
        const { error: profileError } = await supabase.from("customer_profiles").insert({
          id: authData.user.id,
          user_id: authData.user.id,
          full_name: fullName,
          phone: phone,
        })

        if (profileError) {
          console.log("[v0] Profile creation error:", profileError)
          throw profileError
        }

        console.log("[v0] Profile created successfully")

        if (street && number && neighborhood && city && state && zipCode) {
          console.log("[v0] Creating customer address...")
          const { error: addressError } = await supabase.from("customer_addresses").insert({
            customer_id: authData.user.id,
            street,
            number,
            complement: complement || null,
            neighborhood,
            city,
            state,
            zip_code: zipCode,
            is_default: true,
          })

          if (addressError) {
            console.log("[v0] Address error:", addressError)
            throw addressError
          }

          console.log("[v0] Address created successfully")
        }
      }

      console.log("[v0] Sign up completed, redirecting...")
      router.push("/customer/sign-up-success")
    } catch (error: unknown) {
      console.log("[v0] Error during sign up:", error)

      let errorMessage = "Erro ao criar conta"

      if (error instanceof Error) {
        const message = error.message.toLowerCase()

        if (message.includes("user already registered") || message.includes("already exists")) {
          errorMessage = "Este email já está cadastrado. Tente fazer login ou use outro email."
        } else if (message.includes("password")) {
          errorMessage = "A senha deve ter pelo menos 6 caracteres."
        } else if (message.includes("invalid email")) {
          errorMessage = "Email inválido. Verifique e tente novamente."
        } else if (message.includes("network")) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente."
        } else if (message.includes("database error")) {
          errorMessage = "Erro ao salvar dados. Por favor, tente novamente."
        } else {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-4 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Cardápio
        </Button>

        <Card className="border-2 border-slate-200 shadow-xl animate-in fade-in slide-in-from-bottom duration-500">
          <CardHeader className="space-y-1 bg-gradient-to-br from-slate-50 to-stone-50">
            <CardTitle className="text-3xl font-bold text-slate-900">Criar Conta</CardTitle>
            <CardDescription className="text-slate-700">
              Crie sua conta e cadastre seu endereço para facilitar pedidos futuros
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSignUp}>
              <div className="flex flex-col gap-4">
                {/* Dados Pessoais */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Dados Pessoais
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="fullName" className="text-slate-900">
                        Nome Completo
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Seu nome completo"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="border-slate-200 focus:border-slate-500"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone" className="text-slate-900">
                        Telefone
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="border-slate-200 focus:border-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Endereço de Entrega
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="street" className="text-slate-900">
                        Rua
                      </Label>
                      <Input
                        id="street"
                        type="text"
                        placeholder="Nome da rua"
                        required
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="border-slate-200 focus:border-slate-500"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="number" className="text-slate-900">
                        Número
                      </Label>
                      <Input
                        id="number"
                        type="text"
                        placeholder="123"
                        required
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        className="border-slate-200 focus:border-slate-500"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="complement" className="text-slate-900">
                      Complemento (opcional)
                    </Label>
                    <Input
                      id="complement"
                      type="text"
                      placeholder="Apto, bloco, etc."
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      className="border-slate-200 focus:border-slate-500"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="neighborhood" className="text-slate-900">
                        Bairro
                      </Label>
                      <Input
                        id="neighborhood"
                        type="text"
                        placeholder="Nome do bairro"
                        required
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        className="border-slate-200 focus:border-slate-500"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="city" className="text-slate-900">
                        Cidade
                      </Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="Nome da cidade"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="border-slate-200 focus:border-slate-500"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="state" className="text-slate-900">
                        Estado
                      </Label>
                      <Input
                        id="state"
                        type="text"
                        placeholder="UF"
                        required
                        maxLength={2}
                        value={state}
                        onChange={(e) => setState(e.target.value.toUpperCase())}
                        className="border-slate-200 focus:border-slate-500"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="zipCode" className="text-slate-900">
                        CEP
                      </Label>
                      <Input
                        id="zipCode"
                        type="text"
                        placeholder="00000-000"
                        required
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="border-slate-200 focus:border-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Dados de Acesso */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Dados de Acesso
                  </h3>
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-slate-900">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-slate-200 focus:border-slate-500"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
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
                        className="border-slate-200 focus:border-slate-500"
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
                        className="border-slate-200 focus:border-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-in fade-in duration-300">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-700 hover:to-slate-600 shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Criando conta..." : "Criar Conta"}
                </Button>
              </div>
              <div className="mt-6 text-center text-sm text-slate-700">
                Já tem uma conta?{" "}
                <Link href="/customer/login" className="font-semibold text-slate-900 hover:underline">
                  Entrar
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
