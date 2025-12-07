"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { CategorySection } from "./category-section"
import { Cart } from "./cart"
import { OrderTypeSelector } from "./order-type-selector"
import { ProductOptionsModal } from "./product-options-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingCart, Bike, UtensilsCrossed, LogOut, User, AlertCircle, Package, Search, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { CategoryNavBar } from "./category-nav-bar"
import { RestaurantInfoDialog } from "./restaurant-info-dialog"
import type { Product, ProductVariety, ProductExtra } from "@/types/product"

type Category = {
  id: string
  name: string
  description: string
  products: Product[]
}


type SelectedOptions = {
  variety: ProductVariety | null
  extras: { extra: ProductExtra; quantity: number }[]
}

type CartItem = Product & {
  quantity: number
  selectedVariety?: ProductVariety | null
  selectedExtras?: { extra: ProductExtra; quantity: number }[]
  finalPrice: number
}

type DeliveryInfo = {
  customerName: string
  customerPhone: string
  deliveryAddress: string
}

export function MenuClient({
  categories,
  restaurantName,
  restaurantLogo,
  deliveryFeeSetting,
  restaurantInfo,
}: {
  categories: Category[]
  restaurantName: string
  restaurantLogo: string | null
  deliveryFeeSetting?: number
  restaurantInfo?: {
    name: string
    logoUrl: string | null
    address?: string | null
    phone?: string | null
    email?: string | null
    opening_hours?: string | null
    instagram?: string | null
    facebook?: string | null
    whatsapp?: string | null
    pix_key?: string | null
    delivery_fee?: number | null
    min_order_value?: number | null
    accepts_delivery?: boolean | null
    accepts_pickup?: boolean | null
    accepts_dine_in?: boolean | null
  }
}) {
  const [orderType, setOrderType] = useState<"delivery" | "pickup" | null>(null)
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoadingUserData, setIsLoadingUserData] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedProductCategory, setSelectedProductCategory] = useState<string | undefined>(undefined)
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false)
  const [hasChosenContinueWithoutLogin, setHasChosenContinueWithoutLogin] = useState(false)
  const router = useRouter()

  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const categoryRefs = useRef<Map<string, HTMLElement>>(new Map())
  const visibleSections = useRef<Map<string, number>>(new Map())

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

  const handleProductClick = (product: Product, categoryName?: string) => {
    if (!orderType) {
      alert("Por favor, selecione o tipo de pedido primeiro (Delivery ou Comer no Local)")
      return
    }

    // Mostrar modal de login se não estiver logado e for delivery, mas permitir continuar sem login
    // Não mostrar se o usuário já escolheu continuar sem login
    if (orderType === "delivery" && !user && !hasChosenContinueWithoutLogin) {
      setSelectedProduct(product)
      setSelectedProductCategory(categoryName)
      setShowLoginModal(true)
      return
    }

    // Sempre abrir o modal, mesmo se não tiver variedades ou extras
      setSelectedProduct(product)
      setSelectedProductCategory(categoryName)
      setIsOptionsModalOpen(true)
  }

  const addToCart = (product: Product, options: SelectedOptions) => {
    const basePrice = options.variety ? options.variety.price : product.price
    const extrasPrice = options.extras.reduce((sum, item) => sum + item.extra.price * item.quantity, 0)
    const finalPrice = basePrice + extrasPrice
    const categoryName = selectedProductCategory

    setCart((prev) => {
      // Criar uma chave única baseada no produto + variedade + extras
      const itemKey = `${product.id}-${options.variety?.id || 'base'}-${options.extras.map(e => `${e.extra.id}:${e.quantity}`).join(',') || 'no-extras'}`
      
      const existing = prev.find((item) => {
        const itemKey2 = `${item.id}-${item.selectedVariety?.id || 'base'}-${item.selectedExtras?.map(e => `${e.extra.id}:${e.quantity}`).join(',') || 'no-extras'}`
        return itemKey === itemKey2
      })

      if (existing) {
        return prev.map((item) => {
          const itemKey2 = `${item.id}-${item.selectedVariety?.id || 'base'}-${item.selectedExtras?.map(e => `${e.extra.id}:${e.quantity}`).join(',') || 'no-extras'}`
          if (itemKey === itemKey2) {
            return { ...item, quantity: item.quantity + 1 }
          }
          return item
        })
      }
      
      return [...prev, { 
        ...product,
        description: product.description,
        categoryName: categoryName,
        quantity: 1,
        selectedVariety: options.variety,
        selectedExtras: options.extras,
        finalPrice
      }]
    })
  }

  const removeFromCart = (itemKey: string) => {
    setCart((prev) => prev.filter((item) => {
      const currentKey = `${item.id}-${item.selectedVariety?.id || 'base'}-${item.selectedExtras?.map(e => `${e.extra.id}:${e.quantity}`).join(',') || 'no-extras'}`
      return currentKey !== itemKey
    }))
  }

  const updateQuantity = (itemKey: string, quantity: number) => {
    if (quantity === 0) {
      removeFromCart(itemKey)
      return
    }
    setCart((prev) => prev.map((item) => {
      const currentKey = `${item.id}-${item.selectedVariety?.id || 'base'}-${item.selectedExtras?.map(e => `${e.extra.id}:${e.quantity}`).join(',') || 'no-extras'}`
      if (currentKey === itemKey) {
        return { ...item, quantity }
      }
      return item
    }))
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0)

  const deliveryFee = orderType === "delivery" ? Number(deliveryFeeSetting ?? 0) : 0

  const handleDeliverySubmit = (info: DeliveryInfo) => {
    setDeliveryInfo(info)
  }

  const handleBackToOrderType = () => {
    setOrderType(null)
    setDeliveryInfo(null)
  }

  // O cardápio só aparece quando orderType está definido (delivery ou pickup)
  const showMenu = orderType === "delivery" || orderType === "pickup"

  // Filtrar categorias e produtos baseado no termo de busca
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return categories
    }

    const searchLower = searchTerm.toLowerCase().trim()
    
    return categories
      .map((category) => {
        // Filtrar apenas produtos ativos que correspondem à busca
        const filteredProducts = category.products
          .filter((product) => product.active !== false)
          .filter((product) => {
            const productName = (product.name || "").toLowerCase()
            const productDescription = (product.description || "").toLowerCase()
            return productName.includes(searchLower) || productDescription.includes(searchLower)
          })

        // Retornar categoria apenas se tiver produtos filtrados
        if (filteredProducts.length > 0) {
          return {
            ...category,
            products: filteredProducts,
          }
        }
        return null
      })
      .filter((category): category is Category => category !== null)
  }, [categories, searchTerm])

  // Limpar categoria ativa quando houver busca
  useEffect(() => {
    if (searchTerm.trim()) {
      setActiveCategory(null)
    }
  }, [searchTerm])

  useEffect(() => {
    if (!showMenu) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const categoryId = entry.target.getAttribute("data-category-id")
          if (!categoryId) return

          if (entry.isIntersecting) {
            visibleSections.current.set(categoryId, entry.intersectionRatio)
          } else {
            visibleSections.current.delete(categoryId)
          }
        })

        let maxRatio = 0
        let mostVisibleCategory: string | null = null

        visibleSections.current.forEach((ratio, categoryId) => {
          if (ratio > maxRatio) {
            maxRatio = ratio
            mostVisibleCategory = categoryId
          }
        })

        if (mostVisibleCategory && maxRatio > 0.15) {
          setActiveCategory(mostVisibleCategory)
        }
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: "-110px 0px -40% 0px",
      },
    )

    categoryRefs.current.forEach((element) => {
      observer.observe(element)
    })

    return () => {
      observer.disconnect()
      visibleSections.current.clear()
    }
  }, [showMenu, categories])

  const handleCategoryClick = useCallback((categoryId: string) => {
    const element = categoryRefs.current.get(categoryId)
    if (element) {
      const headerOffset = 110 // Header + category nav height ajustado
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
      setActiveCategory(categoryId)
    }
  }, [])

  const registerCategoryRef = useCallback((categoryId: string, element: HTMLElement | null) => {
    if (element) {
      categoryRefs.current.set(categoryId, element)
    } else {
      categoryRefs.current.delete(categoryId)
    }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-stone-50">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-lg animate-in slide-in-from-top duration-500">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 animate-in fade-in slide-in-from-left duration-700 min-w-0 flex-1">
              <RestaurantInfoDialog
                info={{
                  name: restaurantName,
                  logoUrl: restaurantLogo,
                  address: restaurantInfo?.address ?? undefined,
                  phone: restaurantInfo?.phone ?? undefined,
                  email: restaurantInfo?.email ?? undefined,
                  opening_hours: restaurantInfo?.opening_hours ?? undefined,
                  instagram: restaurantInfo?.instagram ?? undefined,
                  facebook: restaurantInfo?.facebook ?? undefined,
                  whatsapp: restaurantInfo?.whatsapp ?? undefined,
                  delivery_fee: restaurantInfo?.delivery_fee ?? undefined,
                  min_order_value: restaurantInfo?.min_order_value ?? undefined,
                  accepts_delivery: restaurantInfo?.accepts_delivery ?? undefined,
                  accepts_pickup: restaurantInfo?.accepts_pickup ?? undefined,
                  accepts_dine_in: restaurantInfo?.accepts_dine_in ?? undefined,
                }}
                onLogoClick={handleBackToOrderType}
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-2xl font-bold text-slate-900 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent truncate">
                  {restaurantName}
                </h1>
                {orderType === "delivery" && deliveryInfo && (
                  <p className="text-xs sm:text-sm text-slate-700 animate-in fade-in duration-500 truncate">
                    Delivery - {deliveryInfo.customerName}
                  </p>
                )}
                {orderType === "pickup" && (
                  <p className="text-xs sm:text-sm text-slate-700 animate-in fade-in duration-500 truncate">
                    Retirada no Local
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <RestaurantInfoDialog
                info={{
                  name: restaurantName,
                  logoUrl: restaurantLogo,
                  address: restaurantInfo?.address ?? undefined,
                  phone: restaurantInfo?.phone ?? undefined,
                  email: restaurantInfo?.email ?? undefined,
                  opening_hours: restaurantInfo?.opening_hours ?? undefined,
                  instagram: restaurantInfo?.instagram ?? undefined,
                  facebook: restaurantInfo?.facebook ?? undefined,
                  whatsapp: restaurantInfo?.whatsapp ?? undefined,
                  delivery_fee: restaurantInfo?.delivery_fee ?? undefined,
                  min_order_value: restaurantInfo?.min_order_value ?? undefined,
                  accepts_delivery: restaurantInfo?.accepts_delivery ?? undefined,
                  accepts_pickup: restaurantInfo?.accepts_pickup ?? undefined,
                  accepts_dine_in: restaurantInfo?.accepts_dine_in ?? undefined,
                }}
                showButton={true}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/customer/orders")}
                className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-2 sm:px-4 cursor-pointer"
              >
                <Package className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                <span className="hidden sm:inline">Meus Pedidos</span>
              </Button>
              {user && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/customer/profile")}
                    className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-2 sm:px-4 cursor-pointer"
                  >
                    <User className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Perfil</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-2 sm:px-4 cursor-pointer"
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
                  className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-2 sm:px-4 cursor-pointer"
                >
                  <User className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                  <span className="hidden sm:inline">Entrar</span>
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setIsCartOpen(true)}
                className="relative bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-700 hover:to-slate-600 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 animate-in fade-in slide-in-from-right duration-700 px-2 sm:px-4 cursor-pointer"
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

      {orderType === "delivery" && !deliveryInfo && user && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800 text-sm">
              Complete seu cadastro com endereço para finalizar pedidos de delivery.{" "}
              <button
                onClick={() => router.push("/customer/profile")}
                className="underline font-semibold hover:text-yellow-900"
              >
                Ir para perfil
              </button>
            </p>
          </div>
        </div>
      )}


      {showMenu && (
        <div className="sticky top-[48px] sm:top-[63px] z-30 bg-white">
          <div className="border-b border-slate-200 shadow-sm">
            <div className="container mx-auto px-4 py-3 sm:py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 sm:pl-12 sm:pr-12 h-10 sm:h-12 text-sm sm:text-base border-slate-300 focus:border-slate-500 focus:ring-slate-500 rounded-lg"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Limpar busca"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
          {filteredCategories.length > 0 && !searchTerm && (
            <CategoryNavBar
              categories={filteredCategories
                .filter((cat) => cat.active !== false)
                .sort((a: any, b: any) => {
                  // Ordenar categorias por display_order, e se for igual, por ID para garantir ordem consistente
                  if (a.display_order !== b.display_order) {
                    return (a.display_order || 0) - (b.display_order || 0)
                  }
                  return a.id.localeCompare(b.id)
                })
                .map((cat) => ({ id: cat.id, name: cat.name }))}
              activeCategory={activeCategory}
              onCategoryClick={handleCategoryClick}
            />
          )}
        </div>
      )}

      {showMenu && (
        <main className="container mx-auto px-4 py-8">
          {filteredCategories.length > 0 ? (
            <div className="space-y-12">
              {filteredCategories
                .sort((a: any, b: any) => {
                  // Ordenar categorias por display_order, e se for igual, por ID para garantir ordem consistente
                  if (a.display_order !== b.display_order) {
                    return (a.display_order || 0) - (b.display_order || 0)
                  }
                  return a.id.localeCompare(b.id)
                })
                .map((category) => (
                  <div
                    key={category.id}
                    ref={(el) => registerCategoryRef(category.id, el)}
                    data-category-id={category.id}
                  >
                    <CategorySection category={category} onAddToCart={(product, categoryName) => handleProductClick(product, categoryName)} />
                  </div>
                ))}
            </div>
          ) : searchTerm ? (
            <div className="text-center py-16">
              <div className="mb-4 inline-block p-6 bg-slate-100 rounded-full">
                <Search className="h-16 w-16 text-slate-300" />
              </div>
              <p className="text-lg font-medium text-slate-700">Nenhum produto encontrado</p>
              <p className="text-sm text-slate-600 mt-2">
                Tente buscar com outros termos ou{" "}
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-slate-700 font-medium hover:underline"
                >
                  limpar a busca
                </button>
              </p>
            </div>
          ) : null}
        </main>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full animate-in zoom-in duration-300">
            <div className="text-center space-y-4">
              <div className="bg-slate-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-slate-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Login Necessário</h2>
              <p className="text-slate-700">
                Faça login para usar seus dados salvos e facilitar seus pedidos. Ou continue sem login e preencha seus dados no carrinho.
              </p>
              <div className="space-y-2 pt-4">
                <Button
                  onClick={() => router.push("/customer/login")}
                  className="w-full bg-slate-600 hover:bg-slate-700"
                >
                  Fazer Login
                </Button>
                <Button
                  onClick={() => router.push("/customer/sign-up")}
                  variant="outline"
                  className="w-full border-slate-300"
                >
                  Criar Conta
                </Button>
                <Button 
                  onClick={() => {
                    setShowLoginModal(false)
                    setHasChosenContinueWithoutLogin(true) // Marcar que escolheu continuar sem login
                    // Permitir continuar sem login - o produto será adicionado ao carrinho
                    if (selectedProduct) {
                      const hasVarieties = (selectedProduct.varieties && Array.isArray(selectedProduct.varieties) && selectedProduct.varieties.length > 0) || 
                                         (selectedProduct.varieties && typeof selectedProduct.varieties === 'object' && Object.keys(selectedProduct.varieties).length > 0)
                      const hasExtras = (selectedProduct.extras && Array.isArray(selectedProduct.extras) && selectedProduct.extras.length > 0) ||
                                       (selectedProduct.extras && typeof selectedProduct.extras === 'object' && Object.keys(selectedProduct.extras).length > 0)
                      
                      if (hasVarieties || hasExtras) {
                        setIsOptionsModalOpen(true)
                      } else {
                        addToCart(selectedProduct, { variety: null, extras: [] })
                      }
                      setSelectedProduct(null)
                      setSelectedProductCategory(undefined)
                    }
                  }} 
                  variant="outline" 
                  className="w-full border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Continuar sem Login
                </Button>
                <Button onClick={() => {
                  setShowLoginModal(false)
                  setSelectedProduct(null)
                  setSelectedProductCategory(undefined)
                }} variant="ghost" className="w-full text-slate-700">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProductOptionsModal
        isOpen={isOptionsModalOpen}
        onClose={() => {
          setIsOptionsModalOpen(false)
          setSelectedProduct(null)
          setSelectedProductCategory(undefined)
        }}
        product={selectedProduct}
        onAddToCart={addToCart}
      />

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        orderType={orderType}
        deliveryInfo={deliveryInfo}
        deliveryFee={deliveryFee}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        totalPrice={totalPrice}
        whatsapp={restaurantInfo?.whatsapp || null}
        restaurantInfo={restaurantInfo}
      />
    </div>
  )
}
