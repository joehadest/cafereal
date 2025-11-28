"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MapPin, Phone, Mail, Instagram, Facebook, MessageCircle, Clock, CheckCircle2, XCircle, DollarSign, Info } from "lucide-react"

type RestaurantInfo = {
  name: string
  logoUrl: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  opening_hours?: string | null
  instagram?: string | null
  facebook?: string | null
  whatsapp?: string | null
  delivery_fee?: number | null
  min_order_value?: number | null
  accepts_delivery?: boolean | null
  accepts_pickup?: boolean | null
  accepts_dine_in?: boolean | null
}

type RestaurantInfoDialogProps = {
  info: RestaurantInfo
  showButton?: boolean
  onLogoClick?: () => void
}

export function RestaurantInfoDialog({ info, showButton = false, onLogoClick }: RestaurantInfoDialogProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Renderizar apenas no cliente para evitar problemas de hidratação
  if (!isMounted) {
    if (onLogoClick) {
      return (
        <button
          type="button"
          onClick={onLogoClick}
          className="relative h-8 w-8 sm:h-12 sm:w-12 rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
          aria-label="Voltar para seleção de tipo de pedido"
        >
          {info.logoUrl ? (
            <Image src={info.logoUrl} alt={info.name} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-600 to-slate-500">
              <Info className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
          )}
        </button>
      )
    }
    if (showButton) {
      return (
        <Button variant="outline" size="sm" className="gap-2" disabled>
          <Info className="h-4 w-4" />
          <span className="hidden sm:inline">Informações</span>
        </Button>
      )
    }
    return (
      <button
        type="button"
        className="relative h-8 w-8 sm:h-12 sm:w-12 rounded-lg overflow-hidden shadow-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
        aria-label="Informações do estabelecimento"
        disabled
      >
        {info.logoUrl ? (
          <Image src={info.logoUrl} alt={info.name} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-600 to-slate-500">
            <Info className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
          </div>
        )}
      </button>
    )
  }

  return (
    <Dialog>
      {showButton ? (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Informações</span>
          </Button>
        </DialogTrigger>
      ) : (
        <>
          {onLogoClick ? (
            <button
              type="button"
              onClick={onLogoClick}
              className="relative h-8 w-8 sm:h-12 sm:w-12 rounded-lg overflow-hidden shadow-lg hover:shadow-xl hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
              aria-label="Voltar para seleção de tipo de pedido"
            >
              {info.logoUrl ? (
                <Image src={info.logoUrl} alt={info.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-600 to-slate-500">
                  <Info className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
              )}
            </button>
          ) : (
            <DialogTrigger asChild>
              <button
                type="button"
                className="relative h-8 w-8 sm:h-12 sm:w-12 rounded-lg overflow-hidden shadow-lg hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
                aria-label="Informações do estabelecimento"
              >
                {info.logoUrl ? (
                  <Image src={info.logoUrl} alt={info.name} fill className="object-cover" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-600 to-slate-500">
                    <Info className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  </div>
                )}
              </button>
            </DialogTrigger>
          )}
        </>
      )}
      <DialogContent className="sm:max-w-2xl border-slate-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden shadow-lg flex-shrink-0 ring-2 ring-slate-100">
              {info.logoUrl ? (
                <Image src={info.logoUrl} alt={info.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-slate-600 to-slate-500">
                  <Info className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{info.name}</DialogTitle>
              <p className="text-sm text-slate-600">Informações do estabelecimento</p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Endereço */}
          {info.address && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg p-4 border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="bg-slate-600 rounded-lg p-2 flex-shrink-0">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-1">Endereço</h3>
                  <p className="text-slate-700 leading-relaxed mb-2">{info.address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 hover:underline transition-colors"
                  >
                    <MapPin className="h-4 w-4" />
                    Ver no mapa
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Contato */}
          {(info.phone || info.email || info.whatsapp || info.instagram || info.facebook) && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-slate-400"></div>
                Contato
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {info.phone && (
                  <a
                    href={`tel:${info.phone}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all group"
                  >
                    <div className="bg-emerald-500 rounded-lg p-2 group-hover:scale-110 transition-transform">
                      <Phone className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-slate-800 font-medium group-hover:text-slate-900">{info.phone}</span>
                  </a>
                )}
                {info.email && (
                  <a
                    href={`mailto:${info.email}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all group"
                  >
                    <div className="bg-slate-600 rounded-lg p-2 group-hover:scale-110 transition-transform">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-slate-800 font-medium group-hover:text-slate-900 truncate">{info.email}</span>
                  </a>
                )}
                {info.whatsapp && (
                  <a
                    href={`https://wa.me/${info.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all group"
                  >
                    <div className="bg-green-500 rounded-lg p-2 group-hover:scale-110 transition-transform">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-slate-800 font-medium group-hover:text-slate-900">WhatsApp</span>
                  </a>
                )}
                {info.instagram && (
                  <a
                    href={info.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all group"
                  >
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-2 group-hover:scale-110 transition-transform">
                      <Instagram className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-slate-800 font-medium group-hover:text-slate-900">Instagram</span>
                  </a>
                )}
                {info.facebook && (
                  <a
                    href={info.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all group"
                  >
                    <div className="bg-slate-600 rounded-lg p-2 group-hover:scale-110 transition-transform">
                      <Facebook className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-slate-800 font-medium group-hover:text-slate-900">Facebook</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Valores */}
          {(typeof info.delivery_fee === "number" || typeof info.min_order_value === "number") && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-slate-400"></div>
                Valores
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {typeof info.delivery_fee === "number" && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-200">
                    <div className="bg-orange-500 rounded-lg p-2">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Taxa de entrega</p>
                      <p className="text-lg font-bold text-slate-900">R$ {Number(info.delivery_fee).toFixed(2)}</p>
                    </div>
                  </div>
                )}
                {typeof info.min_order_value === "number" && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200">
                    <div className="bg-purple-500 rounded-lg p-2">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">Pedido mínimo</p>
                      <p className="text-lg font-bold text-slate-900">R$ {Number(info.min_order_value).toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Horário de funcionamento */}
          {info.opening_hours && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-slate-400"></div>
                Horário de funcionamento
              </h3>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-lg p-4 border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-500 rounded-lg p-2 flex-shrink-0">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 font-medium leading-relaxed">{info.opening_hours}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Serviços disponíveis */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-slate-400"></div>
              Serviços disponíveis
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                info.accepts_delivery
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-slate-50 border-slate-200 opacity-60"
              }`}>
                {info.accepts_delivery ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-slate-400 flex-shrink-0" />
                )}
                <span className={`font-medium ${info.accepts_delivery ? "text-emerald-900" : "text-slate-600"}`}>
                  Delivery
                </span>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                info.accepts_pickup
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-slate-50 border-slate-200 opacity-60"
              }`}>
                {info.accepts_pickup ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-slate-400 flex-shrink-0" />
                )}
                <span className={`font-medium ${info.accepts_pickup ? "text-emerald-900" : "text-slate-600"}`}>
                  Retirada
                </span>
              </div>
              <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                info.accepts_dine_in
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-slate-50 border-slate-200 opacity-60"
              }`}>
                {info.accepts_dine_in ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-slate-400 flex-shrink-0" />
                )}
                <span className={`font-medium ${info.accepts_dine_in ? "text-emerald-900" : "text-slate-600"}`}>
                  No local
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
