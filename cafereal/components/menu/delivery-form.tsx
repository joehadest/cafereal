"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { MapPin, Phone, User, Plus, Home, LogIn } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type DeliveryInfo = {
  customerName: string
  customerPhone: string
  deliveryAddress: string
}

type SavedAddress = {
  id: string
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  zip_code: string
}

type DeliveryFormProps = {
  onSubmit: (info: DeliveryInfo) => void
  onBack: () => void
}

export function DeliveryForm({ onSubmit, onBack }: DeliveryFormProps) {
  const [formData, setFormData] = useState<DeliveryInfo>({
    customerName: "",
    customerPhone: "",
    deliveryAddress: "",
  })
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [customerProfile, setCustomerProfile] = useState<any>(null)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadCustomerData()
  }, [])

  const loadCustomerData = async () => {
    const supabase = createClient()

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    setUser(authUser)
    setIsLoading(false)

    if (!authUser) return

    const { data: profile } = await supabase.from("customer_profiles").select("*").eq("user_id", authUser.id).single()

    if (profile) {
      setCustomerProfile(profile)
      setFormData({
        customerName: profile.full_name,
        customerPhone: profile.phone,
        deliveryAddress: "",
      })

      const { data: addresses } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", profile.id)
        .order("is_default", { ascending: false })

      if (addresses) {
        setSavedAddresses(addresses)
      }
    }
  }

  const selectAddress = (address: SavedAddress) => {
    const fullAddress = `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ""}, ${address.neighborhood}, ${address.city} - ${address.state}, CEP: ${address.zip_code}`
    setFormData({ ...formData, deliveryAddress: fullAddress })
    setShowNewAddress(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.customerName && formData.customerPhone && formData.deliveryAddress) {
      if (user && !customerProfile) {
        const supabase = createClient()
        await supabase.from("customer_profiles").insert({
          user_id: user.id,
          full_name: formData.customerName,
          phone: formData.customerPhone,
        })
      }

      onSubmit(formData)
    }
  }

  const isValid = formData.customerName && formData.customerPhone && formData.deliveryAddress

  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto p-8 border-2 border-purple-200">
        <div className="text-center text-purple-700">Carregando...</div>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto p-8 border-2 border-purple-200 animate-in fade-in duration-500">
        <div className="text-center space-y-6">
          <div className="bg-purple-50 rounded-full p-4 w-fit mx-auto">
            <LogIn className="h-12 w-12 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-purple-900 mb-2">Faça Login</h2>
            <p className="text-purple-700">Entre na sua conta para usar seus dados salvos e facilitar seus pedidos</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push("/customer/login")}
              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600"
            >
              Entrar
            </Button>
            <Button
              onClick={() => router.push("/customer/sign-up")}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              Criar Conta
            </Button>
            <Button variant="ghost" onClick={onBack} className="text-purple-700">
              Voltar
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto p-8 border-2 border-purple-200 animate-in fade-in duration-500">
      <div className="mb-6">
        {user && customerProfile ? (
          <>
            <h2 className="text-2xl font-bold text-purple-900 mb-2">Confirme suas Informações</h2>
            <p className="text-purple-700">Seus dados estão salvos e prontos para uso</p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-purple-900 mb-2">Informações para Entrega</h2>
            <p className="text-purple-700">Preencha seus dados para receber o pedido</p>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-purple-900 flex items-center gap-2">
            <User className="h-4 w-4" />
            Nome Completo
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Seu nome"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            className="border-purple-200 focus:border-purple-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-purple-900 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Telefone
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(00) 00000-0000"
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            className="border-purple-200 focus:border-purple-500"
            required
          />
        </div>

        {savedAddresses.length > 0 && !showNewAddress && (
          <div className="space-y-2">
            <Label className="text-purple-900 flex items-center gap-2">
              <Home className="h-4 w-4" />
              Endereços Salvos
            </Label>
            <div className="space-y-2">
              {savedAddresses.map((address) => (
                <Button
                  key={address.id}
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 border-purple-200 hover:bg-purple-50 hover:border-purple-400 bg-transparent"
                  onClick={() => selectAddress(address)}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-purple-600" />
                    <div className="text-sm">
                      <div className="font-medium text-purple-900">
                        {address.street}, {address.number}
                      </div>
                      <div className="text-purple-700">
                        {address.neighborhood}, {address.city} - {address.state}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-50 bg-transparent"
                onClick={() => setShowNewAddress(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Usar novo endereço
              </Button>
            </div>
          </div>
        )}

        {(savedAddresses.length === 0 || showNewAddress) && (
          <div className="space-y-2">
            <Label htmlFor="address" className="text-purple-900 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço Completo
            </Label>
            <Input
              id="address"
              type="text"
              placeholder="Rua, número, bairro, cidade"
              value={formData.deliveryAddress}
              onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
              className="border-purple-200 focus:border-purple-500"
              required
            />
            {savedAddresses.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-purple-700"
                onClick={() => setShowNewAddress(false)}
              >
                Voltar para endereços salvos
              </Button>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1 border-purple-300 bg-transparent">
            Voltar
          </Button>
          <Button
            type="submit"
            disabled={!isValid}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
          >
            Continuar para o Cardápio
          </Button>
        </div>
      </form>
    </Card>
  )
}
