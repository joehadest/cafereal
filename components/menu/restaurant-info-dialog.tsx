"use client"

import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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

export function RestaurantInfoDialog({ info }: { info: RestaurantInfo }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="relative h-8 w-8 sm:h-12 sm:w-12 rounded-lg overflow-hidden shadow-lg hover:scale-110 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
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
      <DialogContent className="sm:max-w-lg border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-lg overflow-hidden shadow-md flex-shrink-0">
              {info.logoUrl ? (
                <Image src={info.logoUrl} alt={info.name} fill className="object-cover" />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-slate-200">
                  <Info className="h-6 w-6 text-slate-600" />
                </div>
              )}
            </div>
            <DialogTitle className="text-slate-900">{info.name}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          {info.address && (
            <div className="flex items-start gap-2 text-slate-800">
              <MapPin className="h-4 w-4 mt-1 text-slate-600" />
              <p className="leading-snug">{info.address}</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {info.phone && (
              <div className="flex items-center gap-2 text-slate-800">
                <Phone className="h-4 w-4 text-slate-600" />
                <a href={`tel:${info.phone}`} className="hover:underline">
                  {info.phone}
                </a>
              </div>
            )}
            {info.email && (
              <div className="flex items-center gap-2 text-slate-800">
                <Mail className="h-4 w-4 text-slate-600" />
                <a href={`mailto:${info.email}`} className="hover:underline">
                  {info.email}
                </a>
              </div>
            )}
            {info.instagram && (
              <div className="flex items-center gap-2 text-slate-800">
                <Instagram className="h-4 w-4 text-slate-600" />
                <a href={info.instagram} target="_blank" rel="noreferrer" className="truncate hover:underline">
                  Instagram
                </a>
              </div>
            )}
            {info.facebook && (
              <div className="flex items-center gap-2 text-slate-800">
                <Facebook className="h-4 w-4 text-slate-600" />
                <a href={info.facebook} target="_blank" rel="noreferrer" className="truncate hover:underline">
                  Facebook
                </a>
              </div>
            )}
            {info.whatsapp && (
              <div className="flex items-center gap-2 text-slate-800">
                <MessageCircle className="h-4 w-4 text-slate-600" />
                <a href={`https://wa.me/${info.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="hover:underline">
                  WhatsApp
                </a>
              </div>
            )}
          </div>

          {typeof info.delivery_fee === "number" || typeof info.min_order_value === "number" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {typeof info.delivery_fee === "number" && (
                <div className="flex items-center gap-2 text-slate-800">
                  <DollarSign className="h-4 w-4 text-slate-600" />
                  <span>
                    Taxa de entrega: R$ {Number(info.delivery_fee).toFixed(2)}
                  </span>
                </div>
              )}
              {typeof info.min_order_value === "number" && (
                <div className="flex items-center gap-2 text-slate-800">
                  <DollarSign className="h-4 w-4 text-slate-600" />
                  <span>
                    Pedido mínimo: R$ {Number(info.min_order_value).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          ) : null}

          {info.opening_hours && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-slate-600" />
                <span className="text-slate-900 font-medium">Horário de funcionamento</span>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-md p-3">{info.opening_hours}</pre>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-center gap-2 text-slate-800">
              {info.accepts_delivery ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <XCircle className="h-4 w-4 text-slate-400" />
              )}
              <span>Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800">
              {info.accepts_pickup ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <XCircle className="h-4 w-4 text-slate-400" />
              )}
              <span>Retirada</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800">
              {info.accepts_dine_in ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <XCircle className="h-4 w-4 text-slate-400" />
              )}
              <span>No local</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
