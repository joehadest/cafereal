"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Store, Clock, DollarSign, Phone, Instagram, Facebook, Upload, ImageIcon } from "lucide-react"
import Image from "next/image"

export function RestaurantSettingsClient({ initialSettings }: { initialSettings: any }) {
  const [settings, setSettings] = useState(
    initialSettings || {
      name: "",
      logo_url: "",
      phone: "",
      email: "",
      address: "",
      opening_hours: "",
      instagram: "",
      facebook: "",
      whatsapp: "",
      delivery_fee: 5.0,
      min_order_value: 20.0,
      accepts_delivery: true,
      accepts_pickup: true,
      accepts_dine_in: true,
    },
  )
  const [isSaving, setIsSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logo_url || null)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadLogo = async () => {
    if (!logoFile) return settings.logo_url

    setIsUploading(true)
    const supabase = createClient()

    try {
      const fileExt = logoFile.name.split(".").pop()
      const fileName = `logo-${Date.now()}.${fileExt}`
      const filePath = `logos/${fileName}`

      const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, logoFile)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(filePath)

      return publicUrl
    } catch (error) {
      console.error("Error uploading logo:", error)
      alert("Erro ao fazer upload do logo")
      return settings.logo_url
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    const supabase = createClient()

    try {
      let logoUrl = settings.logo_url
      if (logoFile) {
        logoUrl = await uploadLogo()
      }

      const updatedSettings = {
        ...settings,
        logo_url: logoUrl,
        delivery_fee: Number(settings.delivery_fee) || 0,
        min_order_value: Number(settings.min_order_value) || 0,
      }

      if (initialSettings) {
        const { error } = await supabase
          .from("restaurant_settings")
          .update(updatedSettings)
          .eq("id", initialSettings.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("restaurant_settings").insert(updatedSettings)
        if (error) throw error
      }

      alert("Configurações salvas com sucesso!")
      router.refresh()
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Erro ao salvar configurações")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl shadow-lg">
            <Store className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Configurações do Restaurante</h1>
            <p className="text-purple-50 text-lg">Personalize as informações e preferências do seu estabelecimento</p>
          </div>
        </div>
      </div>

      <Card className="p-8 border-purple-200 bg-gradient-to-br from-white to-stone-50/30 hover:shadow-xl transition-all duration-300">
        <h2 className="text-2xl font-semibold text-purple-900 mb-6 flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-600 to-purple-500 p-2 rounded-lg">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          Logo do Restaurante
        </h2>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 space-y-4">
            <Label htmlFor="logo-upload" className="text-base font-medium text-purple-900">
              Fazer Upload do Logo
            </Label>
            <div className="flex gap-3">
              <Input
                id="logo-upload"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleLogoChange}
                className="border-purple-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 transition-colors"
              />
            </div>
            <p className="text-sm text-purple-600">Formatos aceitos: PNG, JPEG, JPG</p>
          </div>
          {logoPreview && (
            <div className="flex-shrink-0 animate-in zoom-in duration-300">
              <Label className="text-sm font-medium text-purple-900 mb-2 block">Preview</Label>
              <div className="relative w-48 h-48 rounded-xl overflow-hidden border-4 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
                <Image
                  src={logoPreview || "/placeholder.svg"}
                  alt="Logo preview"
                  fill
                  className="object-contain bg-white p-2"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-8 border-purple-200 bg-gradient-to-br from-white to-stone-50/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <h2 className="text-2xl font-semibold text-purple-900 mb-6 flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-600 to-purple-500 p-2 rounded-lg">
              <Store className="h-5 w-5 text-white" />
            </div>
            Informações Básicas
          </h2>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium text-purple-900">
                Nome do Restaurante
              </Label>
              <Input
                id="name"
                value={settings.name || ""}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-12"
                placeholder="Ex: Restaurante Sabor & Arte"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-base font-medium text-purple-900">
                Endereço Completo
              </Label>
              <Textarea
                id="address"
                value={settings.address || ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 min-h-[100px]"
                placeholder="Rua, número, bairro, cidade - estado"
                rows={3}
              />
            </div>
          </div>
        </Card>

        <Card className="p-8 border-purple-200 bg-gradient-to-br from-white to-stone-50/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <h2 className="text-2xl font-semibold text-purple-900 mb-6 flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-600 to-purple-500 p-2 rounded-lg">
              <Phone className="h-5 w-5 text-white" />
            </div>
            Contato
          </h2>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-base font-medium text-purple-900">
                Telefone
              </Label>
              <Input
                id="phone"
                value={settings.phone || ""}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-12"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium text-purple-900">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={settings.email || ""}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-12"
                placeholder="contato@restaurante.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hours" className="flex items-center gap-2 text-base font-medium text-purple-900">
                <Clock className="h-4 w-4" />
                Horário de Funcionamento
              </Label>
              <Textarea
                id="hours"
                value={settings.opening_hours || ""}
                onChange={(e) => setSettings({ ...settings, opening_hours: e.target.value })}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 min-h-[100px]"
                placeholder="Seg-Sex: 11h-23h&#10;Sáb-Dom: 11h-00h"
                rows={3}
              />
            </div>
          </div>
        </Card>

        <Card className="p-8 border-purple-200 bg-gradient-to-br from-white to-stone-50/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <h2 className="text-2xl font-semibold text-purple-900 mb-6 flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-600 to-purple-500 p-2 rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            Valores e Taxas
          </h2>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="deliveryFee" className="text-base font-medium text-purple-900">
                Taxa de Entrega (R$)
              </Label>
              <Input
                id="deliveryFee"
                type="number"
                step="0.01"
                value={settings.delivery_fee || 0}
                onChange={(e) => setSettings({ ...settings, delivery_fee: Number.parseFloat(e.target.value) })}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minOrder" className="text-base font-medium text-purple-900">
                Pedido Mínimo (R$)
              </Label>
              <Input
                id="minOrder"
                type="number"
                step="0.01"
                value={settings.min_order_value || 0}
                onChange={(e) => setSettings({ ...settings, min_order_value: Number.parseFloat(e.target.value) })}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-12"
              />
            </div>
          </div>
        </Card>

        <Card className="p-8 border-purple-200 bg-gradient-to-br from-white to-stone-50/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <h2 className="text-2xl font-semibold text-purple-900 mb-6 flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-600 to-purple-500 p-2 rounded-lg">
              <Instagram className="h-5 w-5 text-white" />
            </div>
            Redes Sociais
          </h2>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2 text-base font-medium text-purple-900">
                <Instagram className="h-4 w-4" />
                Instagram
              </Label>
              <Input
                id="instagram"
                value={settings.instagram || ""}
                onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-12"
                placeholder="https://instagram.com/seurestaurante"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook" className="flex items-center gap-2 text-base font-medium text-purple-900">
                <Facebook className="h-4 w-4" />
                Facebook
              </Label>
              <Input
                id="facebook"
                value={settings.facebook || ""}
                onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400 h-12"
                placeholder="https://facebook.com/seurestaurante"
              />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-8 border-purple-200 bg-gradient-to-br from-white to-stone-50/30 hover:shadow-xl transition-all duration-300">
        <h2 className="text-2xl font-semibold text-purple-900 mb-6 flex items-center gap-3">
          <div className="bg-gradient-to-br from-purple-600 to-purple-500 p-2 rounded-lg">
            <Store className="h-5 w-5 text-white" />
          </div>
          Tipos de Pedido Aceitos
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-3 p-4 rounded-lg bg-white border-2 border-purple-100 hover:border-purple-300 transition-colors">
            <div className="flex items-center justify-between">
              <Label htmlFor="delivery" className="cursor-pointer text-base font-medium text-purple-900">
                Delivery
              </Label>
              <Switch
                id="delivery"
                checked={settings.accepts_delivery}
                onCheckedChange={(checked) => setSettings({ ...settings, accepts_delivery: checked })}
              />
            </div>
            <p className="text-sm text-purple-600">Entregas no endereço do cliente</p>
          </div>
          <div className="flex flex-col gap-3 p-4 rounded-lg bg-white border-2 border-purple-100 hover:border-purple-300 transition-colors">
            <div className="flex items-center justify-between">
              <Label htmlFor="pickup" className="cursor-pointer text-base font-medium text-purple-900">
                Retirada
              </Label>
              <Switch
                id="pickup"
                checked={settings.accepts_pickup}
                onCheckedChange={(checked) => setSettings({ ...settings, accepts_pickup: checked })}
              />
            </div>
            <p className="text-sm text-purple-600">Cliente retira no local</p>
          </div>
          <div className="flex flex-col gap-3 p-4 rounded-lg bg-white border-2 border-purple-100 hover:border-purple-300 transition-colors">
            <div className="flex items-center justify-between">
              <Label htmlFor="dineIn" className="cursor-pointer text-base font-medium text-purple-900">
                No Local
              </Label>
              <Switch
                id="dineIn"
                checked={settings.accepts_dine_in}
                onCheckedChange={(checked) => setSettings({ ...settings, accepts_dine_in: checked })}
              />
            </div>
            <p className="text-sm text-purple-600">Pedidos nas mesas</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end sticky bottom-8 z-10">
        <Button
          onClick={handleSave}
          disabled={isSaving || isUploading}
          className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-12 py-7 text-lg font-semibold shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 rounded-xl"
        >
          {isSaving || isUploading ? (
            <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isUploading ? "Fazendo upload..." : "Salvando..."}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Salvar Configurações
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
