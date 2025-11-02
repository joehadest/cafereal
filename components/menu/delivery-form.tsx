"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { MapPin, Phone, User } from "lucide-react"

type DeliveryInfo = {
  customerName: string
  customerPhone: string
  deliveryAddress: string
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.customerName && formData.customerPhone && formData.deliveryAddress) {
      onSubmit(formData)
    }
  }

  const isValid = formData.customerName && formData.customerPhone && formData.deliveryAddress

  return (
    <Card className="max-w-2xl mx-auto p-8 border-2 border-orange-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-orange-900 mb-2">Informações para Entrega</h2>
        <p className="text-orange-700">Preencha seus dados para receber o pedido</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-orange-900 flex items-center gap-2">
            <User className="h-4 w-4" />
            Nome Completo
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Seu nome"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            className="border-orange-200 focus:border-orange-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-orange-900 flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Telefone
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(00) 00000-0000"
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
            className="border-orange-200 focus:border-orange-500"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-orange-900 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Endereço Completo
          </Label>
          <Input
            id="address"
            type="text"
            placeholder="Rua, número, bairro, cidade"
            value={formData.deliveryAddress}
            onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
            className="border-orange-200 focus:border-orange-500"
            required
          />
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1 border-orange-300 bg-transparent">
            Voltar
          </Button>
          <Button
            type="submit"
            disabled={!isValid}
            className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
          >
            Continuar para o Cardápio
          </Button>
        </div>
      </form>
    </Card>
  )
}
