"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ShoppingCart, Plus, Minus, X, UtensilsCrossed, CheckCircle, Search, ChevronUp, ChevronDown, Edit, ClipboardList } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ProductOptionsModal } from "@/components/menu/product-options-modal"
import { EditOrderModal } from "@/components/orders/edit-order-modal"
import type { Product, ProductVariety, ProductExtra } from "@/types/product"
import type { Order } from "@/types/order"
import Image from "next/image"

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
  selectedVariety?: ProductVariety | null
  selectedExtras?: { extra: ProductExtra; quantity: number }[]
  finalPrice: number
}

type SelectedOptions = {
  variety: ProductVariety | null
  extras: { extra: ProductExtra; quantity: number }[]
}

export function StaffOrdersClient({
  categories,
  tables,
  orders,
  restaurantInfo,
}: {
  categories: Category[]
  tables: Table[]
  orders?: Order[]
  restaurantInfo?: {
    name: string
    phone?: string
    address?: string
    cnpj?: string
  }
}) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [customerName, setCustomerName] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [isCreatingTable, setIsCreatingTable] = useState(false)
  const [isCartMinimized, setIsCartMinimized] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [showOrdersList, setShowOrdersList] = useState(false)

  const totalPrice = cart.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Filtrar categorias e produtos baseado no termo de busca
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return categories
    }

    const searchLower = searchTerm.toLowerCase().trim()
    
    return categories
      .map((category) => ({
        ...category,
        products: category.products?.filter((product: Product) => {
          return (
            product.name.toLowerCase().includes(searchLower) ||
            product.description?.toLowerCase().includes(searchLower)
          )
        }) || [],
      }))
      .filter((category) => category.products && category.products.length > 0)
  }, [categories, searchTerm])

  // Categorias visíveis (filtradas por busca ou categoria ativa)
  const visibleCategories = activeCategory
    ? filteredCategories.filter((cat) => cat.id === activeCategory)
    : filteredCategories

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }

  const addToCart = (product: Product, options: SelectedOptions) => {
    const basePrice = options.variety ? options.variety.price : product.price
    const extrasPrice = options.extras.reduce((sum, item) => sum + item.extra.price * item.quantity, 0)
    const finalPrice = basePrice + extrasPrice

    setCart((prev) => {
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
        quantity: 1,
        selectedVariety: options.variety,
        selectedExtras: options.extras,
        finalPrice
      }]
    })
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

  const removeFromCart = (itemKey: string) => {
    setCart((prev) => prev.filter((item) => {
      const currentKey = `${item.id}-${item.selectedVariety?.id || 'base'}-${item.selectedExtras?.map(e => `${e.extra.id}:${e.quantity}`).join(',') || 'no-extras'}`
      return currentKey !== itemKey
    }))
  }

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      alert("Adicione pelo menos um item ao pedido")
      return
    }

    if (!selectedTable || selectedTable.trim() === "") {
      alert("Selecione uma mesa")
      return
    }

    if (!paymentMethod || !paymentMethod.trim()) {
      alert("Selecione a forma de pagamento")
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const tableNumber = parseInt(selectedTable)
      const orderData: any = {
        order_type: "dine-in",
        status: "pending",
        table_number: tableNumber,
        total: totalPrice,
        notes: notes?.trim() || null,
        payment_method: paymentMethod.trim(),
      }

      if (customerName.trim()) {
        orderData.customer_name = customerName.trim()
      }

      const { data: order, error: orderError } = await supabase.from("orders").insert(orderData).select().single()

      if (orderError) {
        console.error("Erro ao criar pedido:", orderError)
        throw orderError
      }

      // Inserir itens do pedido
      const orderItems = cart.map((item) => {
        return {
          order_id: order.id,
          product_id: item.id,
          product_name: item.name,
          product_price: item.selectedVariety ? item.selectedVariety.price : item.price,
          quantity: item.quantity,
          subtotal: item.finalPrice * item.quantity,
          variety_id: item.selectedVariety?.id || null,
          variety_name: item.selectedVariety?.name || null,
          variety_price: item.selectedVariety?.price || null,
        }
      })

      const { data: insertedItems, error: itemsError } = await supabase.from("order_items").insert(orderItems).select()

      if (itemsError) throw itemsError

      // Inserir extras de cada item
      if (insertedItems) {
        const extrasToInsert: any[] = []
        cart.forEach((item, cartIndex) => {
          const orderItem = insertedItems[cartIndex]
          if (item.selectedExtras && item.selectedExtras.length > 0 && orderItem) {
            item.selectedExtras.forEach((extraItem) => {
              extrasToInsert.push({
                order_item_id: orderItem.id,
                extra_id: extraItem.extra.id,
                extra_name: extraItem.extra.name,
                extra_price: extraItem.extra.price,
                quantity: extraItem.quantity,
              })
            })
          }
        })

        if (extrasToInsert.length > 0) {
          const { error: extrasError } = await supabase.from("order_item_extras").insert(extrasToInsert)
          if (extrasError) throw extrasError
        }
      }

      // Limpar carrinho e resetar formulário
      setCart([])
      // Incrementar mesa automaticamente
      if (selectedTable) {
        const currentTableNum = parseInt(selectedTable)
        const nextTable = tables.find(t => t.table_number === currentTableNum + 1)
        if (nextTable) {
          setSelectedTable(nextTable.table_number.toString())
        } else {
          // Se não houver próxima mesa, manter a atual ou voltar para a primeira
          const firstTable = tables[0]
          if (firstTable) {
            setSelectedTable(firstTable.table_number.toString())
          } else {
            setSelectedTable("")
          }
        }
      }
      setCustomerName("")
      setPaymentMethod("")
      setNotes("")
      setShowSuccessModal(true)
      router.refresh()
    } catch (error: any) {
      console.error("Error creating order:", error)
      console.error("Error details:", JSON.stringify(error, null, 2))
      alert(`Erro ao criar pedido: ${error.message || error.details || 'Erro desconhecido'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtrar pedidos por status ativo
  const activeOrders = (orders || []).filter(
    (o) => !["cancelled"].includes(o.status)
  )

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header fixo */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700 flex-shrink-0" />
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">Anotar Pedido</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {activeOrders.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowOrdersList(!showOrdersList)}
                className="relative text-xs sm:text-sm px-2 sm:px-3"
              >
                <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Pedidos</span>
                <span className="sm:hidden">({activeOrders.length})</span>
                <span className="hidden sm:inline">({activeOrders.length})</span>
              </Button>
            )}
            <div className="relative">
              <Button
                size="sm"
                onClick={() => {
                  if (cart.length > 0) {
                    // Expandir o carrinho se estiver minimizado
                    setIsCartMinimized(false)
                    // Fazer scroll suave para o carrinho
                    setTimeout(() => {
                      document.getElementById("cart-section")?.scrollIntoView({ behavior: "smooth" })
                    }, 100)
                  }
                }}
                className="relative bg-slate-600 hover:bg-slate-700 p-2 sm:px-3"
              >
                <ShoppingCart className="h-4 w-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] sm:text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Pedidos Existentes */}
      {showOrdersList && activeOrders.length > 0 && (
        <div className="bg-white border-b border-slate-200 p-2 sm:p-4 max-h-[50vh] overflow-y-auto">
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-semibold text-slate-900 mb-2 sm:mb-3">Pedidos Existentes</h2>
            <div className="space-y-2">
              {activeOrders.map((order) => {
                const isDelivery = order.order_type === "delivery"
                const orderTime = new Date(order.created_at).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
                const statusColors: Record<string, string> = {
                  pending: "bg-yellow-500",
                  preparing: "bg-blue-500",
                  ready: "bg-green-500",
                  out_for_delivery: "bg-purple-500",
                  delivered: "bg-emerald-500",
                }
                const statusLabels: Record<string, string> = {
                  pending: "Pendente",
                  preparing: "Em Preparo",
                  ready: "Pronto",
                  out_for_delivery: "Saiu para Entrega",
                  delivered: "Entregue",
                }

                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                        {isDelivery ? (
                          <span className="text-xs sm:text-sm font-semibold text-slate-900">Delivery</span>
                        ) : order.table_number === 0 ? (
                          <span className="text-xs sm:text-sm font-semibold text-slate-900">Retirada Local</span>
                        ) : (
                          <span className="text-xs sm:text-sm font-semibold text-slate-900">Mesa {order.table_number}</span>
                        )}
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs text-white ${statusColors[order.status] || "bg-gray-500"}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                        <span className="text-[10px] sm:text-xs text-slate-600">{orderTime}</span>
                      </div>
                      {order.customer_name && (
                        <p className="text-[10px] sm:text-xs text-slate-600 truncate">{order.customer_name}</p>
                      )}
                      <p className="text-xs sm:text-sm font-bold text-slate-900">R$ {order.total.toFixed(2)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingOrder(order)}
                      className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Seleção de Mesa */}
      <div className="bg-white border-b border-slate-200 p-2 sm:p-4">
        <div className="space-y-2">
          <Label htmlFor="table-select" className="text-xs sm:text-sm font-semibold text-slate-900">
            Mesa
          </Label>
          <div className="flex gap-2">
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger id="table-select" className="flex-1 text-sm sm:text-base">
                <SelectValue placeholder="Selecione a mesa" />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table.id} value={table.table_number.toString()}>
                    Mesa {table.table_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={async () => {
                if (isCreatingTable) return
                
                setIsCreatingTable(true)
                const supabase = createClient()

                try {
                  // Encontrar o maior número de mesa
                  const maxTableNumber = tables.length > 0 
                    ? Math.max(...tables.map(t => t.table_number))
                    : 0
                  
                  const newTableNumber = maxTableNumber + 1

                  // Criar nova mesa
                  const { data: newTable, error } = await supabase
                    .from("restaurant_tables")
                    .insert({
                      table_number: newTableNumber,
                      capacity: 4,
                      status: "available",
                      active: true,
                    })
                    .select()
                    .single()

                  if (error) throw error

                  // Selecionar a nova mesa criada
                  if (newTable) {
                    setSelectedTable(newTable.table_number.toString())
                  }

                  // Atualizar a lista de mesas
                  router.refresh()
                } catch (error: any) {
                  console.error("Erro ao criar mesa:", error)
                  alert(`Erro ao criar mesa: ${error.message || 'Erro desconhecido'}`)
                } finally {
                  setIsCreatingTable(false)
                }
              }}
              disabled={isCreatingTable}
              className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap px-2 sm:px-3 text-xs sm:text-sm disabled:opacity-50"
              title="Criar nova mesa (+1)"
            >
              {isCreatingTable ? "..." : "+1"}
            </Button>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="bg-white border-b border-slate-200 p-2 sm:p-4">
        <div className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 sm:pl-10 text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Filtros de Categoria */}
      {!searchTerm && (
        <div className="bg-white border-b border-slate-200 p-2 sm:p-4 overflow-x-auto">
          <div className="flex gap-2 min-w-max sm:min-w-0">
            <Button
              variant={activeCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(null)}
              className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4"
            >
              Todas
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Lista de Produtos */}
      <div className="p-2 sm:p-4 space-y-3 sm:space-y-4 pb-24 sm:pb-4">
        {visibleCategories.map((category) => (
          <div key={category.id} className="space-y-2 sm:space-y-3">
            {!activeCategory && (
              <h2 className="text-base sm:text-lg font-bold text-slate-900 px-2 sm:px-0">{category.name}</h2>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {category.products.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-slate-200 flex flex-col"
                  onClick={() => handleProductClick(product)}
                >
                  <CardContent className="p-2 sm:p-3 flex flex-col flex-1">
                    {product.image_url && (
                      <div className="relative w-full aspect-square mb-1.5 sm:mb-2 rounded-lg overflow-hidden bg-slate-100">
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        />
                      </div>
                    )}
                    <h3 className="font-semibold text-xs sm:text-sm text-slate-900 mb-1 line-clamp-2 flex-1">
                      {product.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-600 mb-1.5 sm:mb-2 line-clamp-2 hidden sm:block">
                      {product.description}
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-slate-900 mt-auto">
                      R$ {product.price.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
        {visibleCategories.length === 0 && (
          <div className="text-center py-12 text-slate-600">
            <p>Nenhum produto encontrado</p>
          </div>
        )}
      </div>

      {/* Carrinho Fixo na Parte Inferior */}
      {cart.length > 0 && (
        <div
          id="cart-section"
          className={`fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50 transition-all duration-300 ${
            isCartMinimized ? "max-h-20" : "max-h-[70vh]"
          } overflow-hidden`}
        >
          {/* Header do Carrinho - Sempre Visível */}
          <div className="p-2 sm:p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCartMinimized(!isCartMinimized)}
                  className="p-1 h-auto flex-shrink-0"
                >
                  {isCartMinimized ? (
                    <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                  )}
                </Button>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-lg font-bold text-slate-900 truncate">Carrinho ({totalItems})</h3>
                  {isCartMinimized && (
                    <p className="text-xs sm:text-sm text-slate-600">Total: R$ {totalPrice.toFixed(2)}</p>
                  )}
                </div>
              </div>
              {!isCartMinimized && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCart([])}
                  className="text-red-600 hover:text-red-700 text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>

          {/* Conteúdo do Carrinho - Visível quando expandido */}
          {!isCartMinimized && (
            <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
              <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cart.map((item) => {
                const itemKey = `${item.id}-${item.selectedVariety?.id || 'base'}-${item.selectedExtras?.map(e => `${e.extra.id}:${e.quantity}`).join(',') || 'no-extras'}`
                return (
                  <div key={itemKey} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        {item.name}
                      </p>
                      {item.selectedVariety && (
                        <p className="text-[10px] sm:text-xs text-slate-600">{item.selectedVariety.name}</p>
                      )}
                      {item.selectedExtras && item.selectedExtras.length > 0 && (
                        <p className="text-[10px] sm:text-xs text-slate-600 line-clamp-1">
                          {item.selectedExtras.map(e => e.extra.name).join(", ")}
                        </p>
                      )}
                      <p className="text-xs sm:text-sm font-bold text-slate-900">
                        R$ {(item.finalPrice * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(itemKey, item.quantity - 1)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="w-6 sm:w-8 text-center font-bold text-xs sm:text-sm">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                  )
                  })}
                </div>

            <div className="space-y-2 sm:space-y-3 pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-base sm:text-lg font-bold text-slate-900">Total:</span>
                <span className="text-lg sm:text-xl font-bold text-slate-900">R$ {totalPrice.toFixed(2)}</span>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="customer-name" className="text-xs sm:text-sm font-semibold">
                  Nome do Cliente (opcional)
                </Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="payment-method" className="text-xs sm:text-sm font-semibold">
                  Forma de Pagamento <span className="text-red-500">*</span>
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method" className="w-full text-xs sm:text-sm">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Não informado">Não informado</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
                {!paymentMethod && (
                  <p className="text-[10px] sm:text-xs text-red-600">Selecione a forma de pagamento</p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="notes" className="text-xs sm:text-sm font-semibold">
                  Observações (opcional)
                </Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Sem cebola, ponto da carne..."
                  className="text-xs sm:text-sm"
                />
              </div>

              {(!selectedTable || !paymentMethod) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3 text-xs sm:text-sm text-yellow-800">
                  {!selectedTable && <p>⚠️ Selecione uma mesa</p>}
                  {!paymentMethod && <p>⚠️ Selecione a forma de pagamento</p>}
                </div>
              )}
              <Button
                onClick={handleCreateOrder}
                disabled={isSubmitting || !selectedTable || !paymentMethod || cart.length === 0}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-4 sm:py-6 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {isSubmitting ? "Enviando..." : "Finalizar Pedido"}
              </Button>
            </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* Modal de Produto */}
      <ProductOptionsModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false)
          setSelectedProduct(null)
        }}
        product={selectedProduct}
        onAddToCart={addToCart}
      />

      {/* Modal de Sucesso */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-white border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Pedido Enviado!</h3>
                  <p className="text-sm text-slate-600 mt-2">O pedido foi criado com sucesso.</p>
                </div>
                <Button
                  onClick={() => {
                    setShowSuccessModal(false)
                    router.refresh()
                  }}
                  className="w-full bg-slate-600 hover:bg-slate-700"
                >
                  Fazer Novo Pedido
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Pedido */}
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          onSuccess={() => {
            router.refresh()
            setEditingOrder(null)
            setShowOrdersList(true) // Manter a lista aberta após editar
          }}
        />
      )}
    </div>
  )
}

