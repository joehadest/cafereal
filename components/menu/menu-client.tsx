"use client"

import { useState } from "react"
import { CategorySection } from "./category-section"
import { Cart } from "./cart"
import { TableSelector } from "./table-selector"
import { OrderTypeSelector } from "./order-type-selector"
import { DeliveryForm } from "./delivery-form"
import { Button } from "@/components/ui/button"
import { ShoppingCart, UtensilsCrossed, Bike } from "lucide-react"

type Product = {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  active: boolean
}

type Category = {
  id: string
  name: string
  description: string
  products: Product[]
}

type Table = {
  id: string
  table_number: number
  capacity: number
  status: string
}

type CartItem = Product & {
  quantity: number
}

type DeliveryInfo = {
  customerName: string
  customerPhone: string
  deliveryAddress: string
}

export function MenuClient({
  categories,
  tables,
}: {
  categories: Category[]
  tables: Table[]
}) {
  const [orderType, setOrderType] = useState<"delivery" | "dinein" | null>(null)
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null)
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(productId)
      return
    }
    setCart((prev) => prev.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const deliveryFee = orderType === "delivery" ? 5.0 : 0

  const handleDeliverySubmit = (info: DeliveryInfo) => {
    setDeliveryInfo(info)
  }

  const handleBackToOrderType = () => {
    setOrderType(null)
    setDeliveryInfo(null)
    setSelectedTable(null)
  }

  const canShowMenu = orderType === "delivery" ? deliveryInfo !== null : selectedTable !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-200 shadow-lg animate-in slide-in-from-top duration-500">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left duration-700">
              <div className="bg-gradient-to-br from-orange-600 to-orange-500 p-2 rounded-lg shadow-lg hover:scale-110 transition-transform duration-300">
                {orderType === "delivery" ? (
                  <Bike className="h-6 w-6 text-white animate-bounce" />
                ) : (
                  <UtensilsCrossed className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-orange-900 bg-gradient-to-r from-orange-900 to-orange-700 bg-clip-text text-transparent">
                  Cardápio Digital
                </h1>
                {orderType === "delivery" && deliveryInfo && (
                  <p className="text-sm text-orange-700 animate-in fade-in duration-500">
                    Delivery - {deliveryInfo.customerName}
                  </p>
                )}
                {orderType === "dinein" && selectedTable && (
                  <p className="text-sm text-orange-700 animate-in fade-in duration-500">Mesa {selectedTable}</p>
                )}
              </div>
            </div>
            <Button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 animate-in fade-in slide-in-from-right duration-700"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-in zoom-in duration-300 animate-pulse">
                  {totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {!orderType && (
        <div className="container mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom duration-700">
          <OrderTypeSelector onSelectType={setOrderType} />
        </div>
      )}

      {orderType === "delivery" && !deliveryInfo && (
        <div className="container mx-auto px-4 py-8 animate-in fade-in slide-in-from-right duration-500">
          <DeliveryForm onSubmit={handleDeliverySubmit} onBack={handleBackToOrderType} />
        </div>
      )}

      {orderType === "dinein" && !selectedTable && (
        <div className="container mx-auto px-4 py-8 animate-in fade-in slide-in-from-left duration-500">
          <TableSelector tables={tables} onSelectTable={setSelectedTable} onBack={handleBackToOrderType} />
        </div>
      )}

      {canShowMenu && (
        <main className="container mx-auto px-4 py-8 animate-in fade-in duration-700">
          <div className="space-y-12">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="animate-in slide-in-from-bottom duration-700"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CategorySection category={category} onAddToCart={addToCart} />
              </div>
            ))}
          </div>
        </main>
      )}

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        orderType={orderType}
        tableNumber={selectedTable}
        deliveryInfo={deliveryInfo}
        deliveryFee={deliveryFee}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        totalPrice={totalPrice}
      />
    </div>
  )
}
