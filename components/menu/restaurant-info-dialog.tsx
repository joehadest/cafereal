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
      <DialogContent className="sm:max-w-2xl border-slate-200 max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative h-14 w-14 sm:h-20 sm:w-20 rounded-lg overflow-hidden shadow-md flex-shrink-0 border-2 border-slate-200">
              {info.logoUrl ? (
                <Image src={info.logoUrl} alt={info.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-slate-600">
                  <Info className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 break-words">{info.name}</DialogTitle>
              <p className="text-xs sm:text-sm text-slate-600">Informações do estabelecimento</p>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6">
          {/* Endereço */}
          {info.address && (
            <div className="bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="bg-slate-600 rounded-lg p-2 flex-shrink-0">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm sm:text-base text-slate-900 mb-1">Endereço</h3>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed mb-2 break-words">{info.address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline transition-colors"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Ver no mapa
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Contato */}
          {(info.phone || info.email || info.whatsapp || info.instagram || info.facebook) && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">Contato</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {info.phone && (
                  <a
                    href={`tel:${info.phone}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <div className="bg-slate-600 rounded-lg p-2 flex-shrink-0">
                      <Phone className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm sm:text-base text-slate-800 font-medium truncate">{info.phone}</span>
                  </a>
                )}
                {info.email && (
                  <a
                    href={`mailto:${info.email}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <div className="bg-slate-600 rounded-lg p-2 flex-shrink-0">
                      <Mail className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm sm:text-base text-slate-800 font-medium truncate">{info.email}</span>
                  </a>
                )}
                {info.whatsapp && (
                  <a
                    href={`https://wa.me/${info.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <div className="bg-slate-600 rounded-lg p-2 flex-shrink-0">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm sm:text-base text-slate-800 font-medium">WhatsApp</span>
                  </a>
                )}
                {info.instagram && (
                  <a
                    href={info.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <div className="bg-slate-600 rounded-lg p-2 flex-shrink-0">
                      <Instagram className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm sm:text-base text-slate-800 font-medium">Instagram</span>
                  </a>
                )}
                {info.facebook && (
                  <a
                    href={info.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <div className="bg-slate-600 rounded-lg p-2 flex-shrink-0">
                      <Facebook className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm sm:text-base text-slate-800 font-medium">Facebook</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Valores */}
          {(typeof info.delivery_fee === "number" || typeof info.min_order_value === "number") && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">Valores</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {typeof info.delivery_fee === "number" && (
                  <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="bg-slate-600 rounded-lg p-2 flex-shrink-0">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600 mb-0.5">Taxa de entrega</p>
                      <p className="text-base sm:text-lg font-bold text-slate-900">R$ {Number(info.delivery_fee).toFixed(2)}</p>
                    </div>
                  </div>
                )}
                {typeof info.min_order_value === "number" && (
                  <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="bg-slate-600 rounded-lg p-2 flex-shrink-0">
                      <DollarSign className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600 mb-0.5">Pedido mínimo</p>
                      <p className="text-base sm:text-lg font-bold text-slate-900">R$ {Number(info.min_order_value).toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Horário de funcionamento */}
          {info.opening_hours && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">Horário de funcionamento</h3>
              <div className="bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="bg-slate-600 rounded-lg p-2 flex-shrink-0">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <pre className="whitespace-pre-wrap text-xs sm:text-sm text-slate-700 font-medium leading-relaxed flex-1">{info.opening_hours}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Serviços disponíveis */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">Serviços disponíveis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className={`flex items-center gap-2 sm:gap-3 p-3 rounded-lg border transition-all ${
                info.accepts_delivery
                  ? "bg-slate-50 border-slate-300"
                  : "bg-slate-50 border-slate-200 opacity-60"
              }`}>
                {info.accepts_delivery ? (
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                )}
                <span className={`text-sm sm:text-base font-medium ${info.accepts_delivery ? "text-slate-900" : "text-slate-600"}`}>
                  Delivery
                </span>
              </div>
              <div className={`flex items-center gap-2 sm:gap-3 p-3 rounded-lg border transition-all ${
                info.accepts_pickup
                  ? "bg-slate-50 border-slate-300"
                  : "bg-slate-50 border-slate-200 opacity-60"
              }`}>
                {info.accepts_pickup ? (
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                )}
                <span className={`text-sm sm:text-base font-medium ${info.accepts_pickup ? "text-slate-900" : "text-slate-600"}`}>
                  Retirada
                </span>
              </div>
              <div className={`flex items-center gap-2 sm:gap-3 p-3 rounded-lg border transition-all ${
                info.accepts_dine_in
                  ? "bg-slate-50 border-slate-300"
                  : "bg-slate-50 border-slate-200 opacity-60"
              }`}>
                {info.accepts_dine_in ? (
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600 flex-shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                )}
                <span className={`text-sm sm:text-base font-medium ${info.accepts_dine_in ? "text-slate-900" : "text-slate-600"}`}>
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
