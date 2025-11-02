"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { CategorySection } from "./category-section"
import { Cart } from "./cart"
import { TableSelector } from "./table-selector"
import { OrderTypeSelector } from "./order-type-selector"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Bike, UtensilsCrossed, LogOut, User, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

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
  restaurantName,
  restaurantLogo,
}: {
  categories: Category[]
  tables: Table[]
  restaurantName: string
  restaurantLogo: string | null
}) {
  const [orderType, setOrderType] = useState<"delivery" | "dinein" | null>(null)
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null)
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoadingUserData, setIsLoadingUserData] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (orderType === "delivery" && user && !deliveryInfo) {
      loadUserDeliveryData()
    }
  }, [orderType, user])

  const loadUserDeliveryData = async () => {
    setIsLoadingUserData(true)
    const supabase = createClient()

    try {
      const { data: profile } = await supabase.from("customer_profiles").select("*").eq("id", user.id).maybeSingle()

      if (profile) {
        const { data: addresses } = await supabase
          .from("customer_addresses")
          .select("*")
          .eq("customer_id", profile.id)
          .order("is_default", { ascending: false })
          .limit(1)

        if (addresses && addresses.length > 0) {
          const address = addresses[0]
          const fullAddress = `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ""}, ${address.neighborhood}, ${address.city} - ${address.state}, CEP: ${address.zip_code}`

          setDeliveryInfo({
            customerName: profile.full_name,
            customerPhone: profile.phone,
            deliveryAddress: fullAddress,
          })
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setIsLoadingUserData(false)
    }
  }

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

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-purple-200 shadow-lg animate-in slide-in-from-top duration-500">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 animate-in fade-in slide-in-from-left duration-700 min-w-0 flex-1">
              {restaurantLogo ? (
                <div className="relative h-8 w-8 sm:h-12 sm:w-12 rounded-lg overflow-hidden shadow-lg hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <Image
                    src={restaurantLogo || "/placeholder.svg"}
                    alt={restaurantName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="bg-gradient-to-br from-purple-600 to-purple-500 p-1.5 sm:p-2 rounded-lg shadow-lg hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  {orderType === "delivery" ? (
                    <Bike className="h-4 w-4 sm:h-6 sm:w-6 text-white animate-bounce" />
                  ) : (
                    <UtensilsCrossed className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-2xl font-bold text-purple-900 bg-gradient-to-r from-purple-900 to-purple-700 bg-clip-text text-transparent truncate">
                  {restaurantName}
                </h1>
                {orderType === "delivery" && deliveryInfo && (
                  <p className="text-xs sm:text-sm text-purple-700 animate-in fade-in duration-500 truncate">
                    Delivery - {deliveryInfo.customerName}
                  </p>
                )}
                {orderType === "dinein" && selectedTable && (
                  <p className="text-xs sm:text-sm text-purple-700 animate-in fade-in duration-500">
                    Mesa {selectedTable}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {user && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/customer/profile")}
                    className="text-purple-700 hover:text-purple-900 hover:bg-purple-100 px-2 sm:px-4"
                  >
                    <User className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Perfil</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-purple-700 hover:text-purple-900 hover:bg-purple-100 px-2 sm:px-4"
                  >
                    <LogOut className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Sair</span>
                  </Button>
                </>
              )}
              {!user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/customer/login")}
                  className="text-purple-700 hover:text-purple-900 hover:bg-purple-100 px-2 sm:px-4"
                >
                  <User className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Entrar</span>
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setIsCartOpen(true)}
                className="relative bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 animate-in fade-in slide-in-from-right duration-700 px-2 sm:px-4"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 sm:h-6 sm:w-6 flex items-center justify-center animate-in zoom-in duration-300 animate-pulse">
                    {totalItems}
                  </span>
                )}
              </Button>
            </div>
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
          {isLoadingUserData ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-purple-700">Carregando seus dados...</p>
            </div>
          ) : !user ? (
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 border-2 border-purple-200">
              <div className="text-center space-y-4">
                <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-purple-900">Login Necessário</h2>
                <p className="text-purple-700">
                  Para fazer pedidos de delivery, você precisa estar logado com seus dados cadastrados.
                </p>
                <div className="space-y-2 pt-4">
                  <Button
                    onClick={() => router.push("/customer/login")}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Fazer Login
                  </Button>
                  <Button
                    onClick={() => router.push("/customer/sign-up")}
                    variant="outline"
                    className="w-full border-purple-300"
                  >
                    Criar Conta
                  </Button>
                  <Button onClick={handleBackToOrderType} variant="ghost" className="w-full text-purple-700">
                    Voltar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 border-2 border-purple-200">
              <div className="text-center space-y-4">
                <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-purple-900">Complete seu Cadastro</h2>
                <p className="text-purple-700">
                  Você precisa completar seu cadastro com nome, telefone e endereço para fazer pedidos de delivery.
                </p>
                <div className="space-y-2 pt-4">
                  <Button
                    onClick={() => router.push("/customer/profile")}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Completar Cadastro
                  </Button>
                  <Button onClick={handleBackToOrderType} variant="ghost" className="w-full text-purple-700">
                    Voltar
                  </Button>
                </div>
              </div>
            </div>
          )}
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
