"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Plus, Minus, Package, Star } from "lucide-react"
import Image from "next/image"
import type { Product, ProductVariety, ProductExtra } from "@/types/product"

type SelectedOptions = {
  variety: ProductVariety | null
  extras: { extra: ProductExtra; quantity: number }[]
}

type ProductOptionsModalProps = {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onAddToCart: (product: Product, options: SelectedOptions) => void
}

export function ProductOptionsModal({ isOpen, onClose, product, onAddToCart }: ProductOptionsModalProps) {
  const [selectedVariety, setSelectedVariety] = useState<ProductVariety | null>(null)
  const [selectedExtras, setSelectedExtras] = useState<{ extra: ProductExtra; quantity: number }[]>([])

  if (!product) return null

  const activeVarieties = (product.varieties || []).filter((v) => v.active)
  const activeExtras = (product.extras || []).filter((e) => e.active)

  // Calcular preço total
  const basePrice = selectedVariety ? selectedVariety.price : product.price
  const extrasPrice = selectedExtras.reduce((sum, item) => sum + item.extra.price * item.quantity, 0)
  const totalPrice = basePrice + extrasPrice

  const handleAddExtra = (extra: ProductExtra) => {
    setSelectedExtras((prev) => {
      const existing = prev.find((item) => item.extra.id === extra.id)
      if (existing) {
        if (existing.quantity < extra.max_quantity) {
          return prev.map((item) =>
            item.extra.id === extra.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        }
        return prev
      }
      return [...prev, { extra, quantity: 1 }]
    })
  }

  const handleRemoveExtra = (extraId: string) => {
    setSelectedExtras((prev) => {
      const existing = prev.find((item) => item.extra.id === extraId)
      if (existing && existing.quantity > 1) {
        return prev.map((item) =>
          item.extra.id === extraId ? { ...item, quantity: item.quantity - 1 } : item
        )
      }
      return prev.filter((item) => item.extra.id !== extraId)
    })
  }

  const handleAddToCart = () => {
    onAddToCart(product, {
      variety: selectedVariety,
      extras: selectedExtras,
    })
    // Reset
    setSelectedVariety(null)
    setSelectedExtras([])
    onClose()
  }

  const handleClose = () => {
    setSelectedVariety(null)
    setSelectedExtras([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white border-slate-200 w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 animate-in zoom-in-95 fade-in duration-300">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-slate-200 flex-shrink-0 animate-in slide-in-from-top duration-500">
          <div className="flex items-start gap-4">
            {product.image_url && (
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 border-slate-200 flex-shrink-0 group">
                <Image src={product.image_url} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900">{product.name}</DialogTitle>
              <DialogDescription className="sr-only">
                {product.description || `Selecione as opções para ${product.name}`}
              </DialogDescription>
              {product.description && (
                <p className="text-xs sm:text-sm text-slate-600 mt-1">{product.description}</p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-6">
          {/* Mensagem quando não há opções */}
          {activeVarieties.length === 0 && activeExtras.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-600 text-sm">
                Este produto não possui opções adicionais. Clique em "Adicionar ao Carrinho" para continuar.
              </p>
            </div>
          )}

          {/* Seleção de Variedade */}
          {activeVarieties.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-600" />
                <Label className="text-base font-semibold text-slate-900">Escolha o tamanho</Label>
              </div>
              <RadioGroup
                value={selectedVariety?.id || ""}
                onValueChange={(value) => {
                  const variety = activeVarieties.find((v) => v.id === value)
                  setSelectedVariety(variety || null)
                }}
                className="space-y-2"
              >
                {activeVarieties.map((variety, index) => (
                  <div
                    key={variety.id}
                    className="flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-400 hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-left duration-500"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <RadioGroupItem value={variety.id} id={variety.id} />
                    <Label htmlFor={variety.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">{variety.name}</span>
                        <span className="text-sm font-semibold text-slate-600">
                          +R$ {variety.price.toFixed(2)}
                        </span>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Seleção de Extras */}
          {activeExtras.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-slate-600" />
                <Label className="text-base font-semibold text-slate-900">Adicionais (opcional)</Label>
              </div>
              <div className="space-y-2">
                {activeExtras.map((extra, index) => {
                  const selected = selectedExtras.find((item) => item.extra.id === extra.id)
                  const quantity = selected?.quantity || 0

                  return (
                    <div
                      key={extra.id}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-400 hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-left duration-500"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={extra.id} className="font-medium text-slate-900 cursor-pointer">
                            {extra.name}
                          </Label>
                          <span className="text-sm font-semibold text-slate-600">
                            R$ {extra.price.toFixed(2)}
                          </span>
                        </div>
                        {extra.max_quantity > 1 && (
                          <p className="text-xs text-slate-500 mt-1">Máximo: {extra.max_quantity}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {quantity > 0 ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 hover:scale-110 hover:bg-red-50 hover:border-red-300 transition-all duration-200"
                              onClick={() => handleRemoveExtra(extra.id)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold text-slate-900">{quantity}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 hover:scale-110 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                              onClick={() => handleAddExtra(extra)}
                              disabled={quantity >= extra.max_quantity}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddExtra(extra)}
                            className="text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Resumo do Preço */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Preço base:</span>
              <span className="font-medium text-slate-900">
                R$ {selectedVariety ? selectedVariety.price.toFixed(2) : product.price.toFixed(2)}
              </span>
            </div>
            {selectedExtras.length > 0 && (
              <div className="space-y-1">
                {selectedExtras.map((item) => (
                  <div key={item.extra.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {item.extra.name} {item.quantity > 1 && `(x${item.quantity})`}:
                    </span>
                    <span className="font-medium text-slate-900">
                      R$ {(item.extra.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-lg font-bold border-t border-slate-200 pt-2 mt-2">
              <span className="text-slate-900">Total:</span>
              <span className="text-slate-600">R$ {totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="border-t border-slate-200 px-4 sm:px-6 py-4 bg-slate-50 flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
          <Button
            type="button"
            onClick={handleClose}
            variant="outline"
            className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 bg-slate-600 hover:bg-slate-700 hover:scale-105 hover:shadow-lg text-white transition-all duration-300"
          >
            Adicionar ao Carrinho - R$ {totalPrice.toFixed(2)}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

