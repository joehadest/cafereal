"use client"

import type React from "react"

import { useMemo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Store, Clock, DollarSign, Phone, Instagram, Facebook, Upload, ImageIcon, MessageCircle, CreditCard } from "lucide-react"
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
      pix_key: "",
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

  // Estados de texto para números (evitar prefixo 0 e permitir edição fluida)
  const [deliveryFeeText, setDeliveryFeeText] = useState(
    settings.delivery_fee !== undefined && settings.delivery_fee !== null ? String(settings.delivery_fee) : "",
  )
  const [minOrderText, setMinOrderText] = useState(
    settings.min_order_value !== undefined && settings.min_order_value !== null
      ? String(settings.min_order_value)
      : "",
  )

  const sanitizeNumericText = (value: string) => {
    if (value === "") return ""
    // Troca vírgula por ponto
    let v = value.replace(",", ".")
    // Mantém apenas dígitos e no máximo um ponto
    v = v.replace(/[^0-9.]/g, "")
    const parts = v.split(".")
    if (parts.length > 2) {
      v = parts.shift()! + "." + parts.join("") // colapsa pontos extras
    }
    // Remove zeros à esquerda quando não for decimal do tipo 0.x
    if (!v.startsWith("0.")) {
      v = v.replace(/^0+(?=\d)/, "")
    }
    return v
  }

  // ----------------------
  // Horário de funcionamento (UI selecionável)
  // ----------------------
  type DayKey = "Seg" | "Ter" | "Qua" | "Qui" | "Sex" | "Sáb" | "Dom"
  type DaySchedule = { open: boolean; openTime: string; closeTime: string }
  const dayOrder: { key: DayKey; label: string }[] = [
    { key: "Seg", label: "Segunda" },
    { key: "Ter", label: "Terça" },
    { key: "Qua", label: "Quarta" },
    { key: "Qui", label: "Quinta" },
    { key: "Sex", label: "Sexta" },
    { key: "Sáb", label: "Sábado" },
    { key: "Dom", label: "Domingo" },
  ]

  const parseOpeningHoursText = (text: unknown): Record<DayKey, DaySchedule> => {
    const base: Record<DayKey, DaySchedule> = {
      Seg: { open: false, openTime: "09:00", closeTime: "18:00" },
      Ter: { open: false, openTime: "09:00", closeTime: "18:00" },
      Qua: { open: false, openTime: "09:00", closeTime: "18:00" },
      Qui: { open: false, openTime: "09:00", closeTime: "18:00" },
      Sex: { open: false, openTime: "09:00", closeTime: "18:00" },
      Sáb: { open: false, openTime: "10:00", closeTime: "18:00" },
      Dom: { open: false, openTime: "10:00", closeTime: "16:00" },
    }
    if (typeof text !== "string" || !text) return base
    const lines = text.split(/\r?\n/)
    const map: Partial<Record<DayKey, DaySchedule>> = {}
    for (const line of lines) {
      // Ex: "Seg: 11:00-23:00" ou "Sáb: Fechado"
      const m = line.match(/^(Seg|Ter|Qua|Qui|Sex|Sáb|Dom)\s*:\s*(.*)$/)
      if (!m) continue
      const key = m[1] as DayKey
      const rest = m[2].trim()
      if (/fechad[oa]/i.test(rest)) {
        map[key] = { open: false, openTime: base[key].openTime, closeTime: base[key].closeTime }
      } else {
        const t = rest.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/)
        if (t) {
          map[key] = { open: true, openTime: t[1], closeTime: t[2] }
        }
      }
    }
    return { ...base, ...(map as Record<DayKey, DaySchedule>) }
  }

  const [hoursByDay, setHoursByDay] = useState<Record<DayKey, DaySchedule>>(
    parseOpeningHoursText(settings.opening_hours),
  )

  const formatOpeningHoursText = (hours: Record<DayKey, DaySchedule>) => {
    return dayOrder
      .map(({ key }) => {
        const d = hours[key]
        return `${key}: ${d.open ? `${d.openTime}-${d.closeTime}` : "Fechado"}`
      })
      .join("\n")
  }

  // Sincroniza textarea sempre que o usuário muda os seletores
  useEffect(() => {
    const text = formatOpeningHoursText(hoursByDay)
    setSettings((s: any) => ({ ...s, opening_hours: text }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoursByDay])

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-600 via-slate-500 to-slate-400 p-6 sm:p-8 shadow-2xl">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-lg">
            <Store className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
              Configurações do Restaurante
            </h1>
            <p className="text-slate-50 text-sm sm:text-base lg:text-lg">
              Personalize as informações e preferências do seu estabelecimento
            </p>
          </div>
        </div>
      </div>

      <Card className="p-4 sm:p-6 lg:p-8 border-slate-200 bg-gradient-to-br from-white to-stone-50/30 hover:shadow-xl transition-all duration-300">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center gap-3">
          <div className="bg-gradient-to-br from-slate-600 to-slate-500 p-2 rounded-lg">
            <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          Logo do Restaurante
        </h2>
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
          <div className="flex-1 space-y-3 sm:space-y-4 w-full">
            <Label htmlFor="logo-upload" className="text-sm sm:text-base font-medium text-slate-900">
              Fazer Upload do Logo
            </Label>
            <div className="flex gap-3">
              <Input
                id="logo-upload"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleLogoChange}
                className="border-slate-200 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-colors"
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-600">Formatos aceitos: PNG, JPEG, JPG</p>
          </div>
          {logoPreview && (
            <div className="flex-shrink-0 animate-in zoom-in duration-300">
              <Label className="text-sm font-medium text-slate-900 mb-2 block">Preview</Label>
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-xl overflow-hidden border-4 border-slate-200 shadow-lg hover:shadow-xl transition-shadow">
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

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card className="p-4 sm:p-6 lg:p-8 border-slate-200 bg-gradient-to-br from-white to-stone-50/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center gap-3">
            <div className="bg-gradient-to-br from-slate-600 to-slate-500 p-2 rounded-lg">
              <Store className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Informações Básicas
          </h2>
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm sm:text-base font-medium text-slate-900">
                Nome do Restaurante
              </Label>
              <Input
                id="name"
                value={settings.name || ""}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 h-10 sm:h-12 text-sm sm:text-base"
                placeholder="Ex: Restaurante Sabor & Arte"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm sm:text-base font-medium text-slate-900">
                Endereço Completo
              </Label>
              <Textarea
                id="address"
                value={settings.address || ""}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                placeholder="Rua, número, bairro, cidade - estado"
                rows={3}
              />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 lg:p-8 border-slate-200 bg-gradient-to-br from-white to-stone-50/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center gap-3">
            <div className="bg-gradient-to-br from-slate-600 to-slate-500 p-2 rounded-lg">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Contato
          </h2>
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm sm:text-base font-medium text-slate-900">
                Telefone
              </Label>
              <Input
                id="phone"
                value={settings.phone || ""}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 h-10 sm:h-12 text-sm sm:text-base"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm sm:text-base font-medium text-slate-900">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={settings.email || ""}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 h-10 sm:h-12 text-sm sm:text-base"
                placeholder="contato@restaurante.com"
              />
            </div>
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm sm:text-base font-medium text-slate-900">
                <Clock className="h-4 w-4" />
                Horário de Funcionamento (selecionável)
              </Label>
              <div className="space-y-2 sm:space-y-3">
                {dayOrder.map(({ key, label }) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 rounded-lg">
                    <div className="w-full sm:w-24 lg:w-28 text-slate-800 text-xs sm:text-sm lg:text-base font-medium">{label}</div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`open-${key}`}
                        checked={hoursByDay[key].open}
                        onCheckedChange={(checked) =>
                          setHoursByDay((prev) => ({ ...prev, [key]: { ...prev[key], open: checked } }))
                        }
                      />
                      {!hoursByDay[key].open && (
                        <span className="text-slate-500 text-xs sm:text-sm">Fechado</span>
                      )}
                    </div>
                    {hoursByDay[key].open && (
                      <div className="flex flex-wrap items-center gap-2 flex-1 w-full sm:w-auto min-w-0">
                        <div className="flex-1 min-w-[100px] sm:min-w-[120px]">
                          <Input
                            type="time"
                            value={hoursByDay[key].openTime}
                            onChange={(e) =>
                              setHoursByDay((prev) => ({ ...prev, [key]: { ...prev[key], openTime: e.target.value } }))
                            }
                            className="h-9 sm:h-10 border-slate-200 w-full text-sm"
                          />
                        </div>
                        <span className="text-slate-600 text-xs sm:text-sm">até</span>
                        <div className="flex-1 min-w-[100px] sm:min-w-[120px]">
                          <Input
                            type="time"
                            value={hoursByDay[key].closeTime}
                            onChange={(e) =>
                              setHoursByDay((prev) => ({ ...prev, [key]: { ...prev[key], closeTime: e.target.value } }))
                            }
                            className="h-9 sm:h-10 border-slate-200 w-full text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <Label htmlFor="hours" className="text-xs font-medium text-slate-700">
                  Resumo (somente leitura)
                </Label>
                <Textarea
                  id="hours"
                  value={settings.opening_hours || ""}
                  readOnly
                  className="border-slate-200 bg-slate-50 focus-visible:ring-0 min-h-[100px] text-xs sm:text-sm"
                  rows={5}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 lg:p-8 border-slate-200 bg-gradient-to-br from-white to-stone-50/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center gap-3">
            <div className="bg-gradient-to-br from-slate-600 to-slate-500 p-2 rounded-lg">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Valores e Taxas
          </h2>
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label htmlFor="deliveryFee" className="text-sm sm:text-base font-medium text-slate-900">
                Taxa de Entrega (R$)
              </Label>
              <Input
                id="deliveryFee"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={deliveryFeeText}
                onChange={(e) => {
                  const v = sanitizeNumericText(e.target.value)
                  setDeliveryFeeText(v)
                  const n = parseFloat(v)
                  setSettings({ ...settings, delivery_fee: isNaN(n) ? 0 : n })
                }}
                onBlur={() => {
                  const n = parseFloat(deliveryFeeText)
                  const normalized = isNaN(n) ? "" : String(n)
                  setDeliveryFeeText(normalized)
                }}
                className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 h-10 sm:h-12 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minOrder" className="text-sm sm:text-base font-medium text-slate-900">
                Pedido Mínimo (R$)
              </Label>
              <Input
                id="minOrder"
                type="number"
                step="0.01"
                inputMode="decimal"
                value={minOrderText}
                onChange={(e) => {
                  const v = sanitizeNumericText(e.target.value)
                  setMinOrderText(v)
                  const n = parseFloat(v)
                  setSettings({ ...settings, min_order_value: isNaN(n) ? 0 : n })
                }}
                onBlur={() => {
                  const n = parseFloat(minOrderText)
                  const normalized = isNaN(n) ? "" : String(n)
                  setMinOrderText(normalized)
                }}
                className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 h-10 sm:h-12 text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pixKey" className="text-sm sm:text-base font-medium text-slate-900 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Chave PIX
              </Label>
              <Input
                id="pixKey"
                type="text"
                value={settings.pix_key || ""}
                onChange={(e) => setSettings({ ...settings, pix_key: e.target.value })}
                className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 h-10 sm:h-12 text-sm sm:text-base"
                placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatória"
              />
              <p className="text-xs text-slate-600">
                Chave PIX para pagamento. Pode ser CPF, CNPJ, email, telefone ou chave aleatória.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 lg:p-8 border-slate-200 bg-gradient-to-br from-white to-stone-50/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center gap-3">
            <div className="bg-gradient-to-br from-slate-600 to-slate-500 p-2 rounded-lg">
              <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            Redes Sociais
          </h2>
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="instagram"
                className="flex items-center gap-2 text-sm sm:text-base font-medium text-slate-900"
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </Label>
              <Input
                id="instagram"
                value={settings.instagram || ""}
                onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 h-10 sm:h-12 text-sm sm:text-base"
                placeholder="https://instagram.com/seurestaurante"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="facebook"
                className="flex items-center gap-2 text-sm sm:text-base font-medium text-slate-900"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Label>
              <Input
                id="facebook"
                value={settings.facebook || ""}
                onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
                className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 h-10 sm:h-12 text-sm sm:text-base"
                placeholder="https://facebook.com/seurestaurante"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="whatsapp"
                className="flex items-center gap-2 text-sm sm:text-base font-medium text-slate-900"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Label>
              <Input
                id="whatsapp"
                value={settings.whatsapp || ""}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                className="border-slate-200 focus:border-slate-400 focus:ring-slate-400 h-10 sm:h-12 text-sm sm:text-base"
                placeholder="5511999999999 (apenas números com código do país)"
              />
              <p className="text-xs text-slate-600">
                Digite apenas números com código do país (ex: 5511999999999 para Brasil)
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 sm:p-6 lg:p-8 border-slate-200 bg-gradient-to-br from-white to-stone-50/30 hover:shadow-xl transition-all duration-300">
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-4 sm:mb-6 flex items-center gap-3">
          <div className="bg-gradient-to-br from-slate-600 to-slate-500 p-2 rounded-lg">
            <Store className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          Tipos de Pedido Aceitos
        </h2>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
          <div className="flex flex-col gap-3 p-4 rounded-lg bg-white border-2 border-slate-100 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <Label htmlFor="delivery" className="cursor-pointer text-sm sm:text-base font-medium text-slate-900">
                Delivery
              </Label>
              <Switch
                id="delivery"
                checked={settings.accepts_delivery}
                onCheckedChange={(checked) => setSettings({ ...settings, accepts_delivery: checked })}
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-600">Entregas no endereço do cliente</p>
          </div>
          <div className="flex flex-col gap-3 p-4 rounded-lg bg-white border-2 border-slate-100 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <Label htmlFor="pickup" className="cursor-pointer text-sm sm:text-base font-medium text-slate-900">
                Retirada
              </Label>
              <Switch
                id="pickup"
                checked={settings.accepts_pickup}
                onCheckedChange={(checked) => setSettings({ ...settings, accepts_pickup: checked })}
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-600">Cliente retira no local</p>
          </div>
          <div className="flex flex-col gap-3 p-4 rounded-lg bg-white border-2 border-slate-100 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between">
              <Label htmlFor="dineIn" className="cursor-pointer text-sm sm:text-base font-medium text-slate-900">
                No Local
              </Label>
              <Switch
                id="dineIn"
                checked={settings.accepts_dine_in}
                onCheckedChange={(checked) => setSettings({ ...settings, accepts_dine_in: checked })}
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-600">Pedidos nas mesas</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-end sticky bottom-4 sm:bottom-8 z-10">
        <Button
          onClick={handleSave}
          disabled={isSaving || isUploading}
          className="bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-700 hover:to-slate-600 text-white px-6 sm:px-8 lg:px-10 py-4 sm:py-5 lg:py-6 text-sm sm:text-base lg:text-lg font-semibold shadow-xl hover:shadow-slate-500/50 transition-all duration-300 hover:scale-105 rounded-lg sm:rounded-xl"
        >
          {isSaving || isUploading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {isUploading ? "Fazendo upload..." : "Salvando..."}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              Salvar
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
