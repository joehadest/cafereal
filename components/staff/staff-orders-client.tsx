"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ShoppingCart, Plus, Minus, X, UtensilsCrossed, CheckCircle, Search, ChevronUp, ChevronDown, Edit, ClipboardList, ArrowLeft, Bike, MapPin, Phone, ShoppingBag, DollarSign, Copy, History } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ProductOptionsModal } from "@/components/menu/product-options-modal"
import { EditOrderModal } from "@/components/orders/edit-order-modal"
import type { Product, ProductVariety, ProductExtra } from "@/types/product"
import type { Order } from "@/types/order"
import Image from "next/image"
import { toast } from "sonner"

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
  weight?: number // Peso em kg para produtos vendidos por peso
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
  const [orderType, setOrderType] = useState<"dine-in" | "delivery" | "pickup">("dine-in")
  const [selectedTable, setSelectedTable] = useState<string>("")
  const [customerName, setCustomerName] = useState<string>("")
  const [customerPhone, setCustomerPhone] = useState<string>("")
  const [deliveryAddress, setDeliveryAddress] = useState<string>("")
  const [referencePoint, setReferencePoint] = useState<string>("")
  const [deliveryFee, setDeliveryFee] = useState<number>(0)
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
  const [selectedItemsForPayment, setSelectedItemsForPayment] = useState<Set<string>>(new Set())
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false)
  const [productWeight, setProductWeight] = useState<string>("")
  const [productDescription, setProductDescription] = useState<string>("")
  const [pricePerKg, setPricePerKg] = useState<string>("")
  const [deliveryZones, setDeliveryZones] = useState<Array<{ id: string; name: string; fee: number; active: boolean; display_order: number }>>([])
  const [selectedDeliveryZoneId, setSelectedDeliveryZoneId] = useState<string>("")
  const [customerHistory, setCustomerHistory] = useState<Array<{ customer_name: string; customer_phone: string; delivery_address: string; reference_point: string | null; delivery_zone_id: string | null }>>([])
  const [showCustomerHistory, setShowCustomerHistory] = useState(false)

  // Função auxiliar para calcular o preço unitário final de um item
  const calculateFinalPrice = (item: CartItem): number => {
    if (!item) return 0
    // Se for item por peso, o preço já está calculado (peso * preço/kg)
    if (item.weight && item.weight > 0) {
      return (item.price || 0) * item.weight
    }
    const basePrice = item.selectedVariety?.price ?? item.price ?? 0
    const extrasPrice = (item.selectedExtras || []).reduce((sum, extraItem) => {
      if (!extraItem || !extraItem.extra) return sum
      return sum + ((extraItem.extra.price || 0) * (extraItem.quantity || 0))
    }, 0)
    return basePrice + extrasPrice
  }

  // Calcular o total garantindo que o finalPrice seja sempre o preço unitário correto
  const totalPrice = (Array.isArray(cart) ? cart : []).reduce((sum, item) => {
    if (!item) return sum
    // Para itens por peso, o finalPrice já é o total (peso * preço/kg)
    if (item.weight && item.weight > 0) {
      return sum + calculateFinalPrice(item)
    }
    const unitPrice = calculateFinalPrice(item)
    return sum + (unitPrice * (item.quantity || 0))
  }, 0)
  const totalItems = (Array.isArray(cart) ? cart : []).reduce((sum, item) => sum + (item?.quantity || 0), 0)

  // Função para obter o itemKey de um item
  const getItemKey = (item: CartItem): string => {
    // Para itens por peso, usar apenas o id
    if (item.weight && item.weight > 0) {
      return item.id
    }
    return `${item.id}-${item.selectedVariety?.id || 'base'}-${item.selectedExtras?.map(e => `${e.extra.id}:${e.quantity}`).join(',') || 'no-extras'}`
  }

  // Calcular o total dos itens selecionados para pagamento
  const selectedTotalPrice = useMemo(() => {
    return (Array.isArray(cart) ? cart : []).reduce((sum, item) => {
      if (!item) return sum
      const itemKey = getItemKey(item)
      if (selectedItemsForPayment.has(itemKey)) {
        // Para itens por peso, o finalPrice já é o total
        if (item.weight && item.weight > 0) {
          return sum + calculateFinalPrice(item)
        }
        const unitPrice = calculateFinalPrice(item)
        return sum + (unitPrice * (item.quantity || 0))
      }
      return sum
    }, 0)
  }, [cart, selectedItemsForPayment])

  // Função para alternar seleção de item
  const toggleItemSelection = (itemKey: string) => {
    setSelectedItemsForPayment((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey)
      } else {
        newSet.add(itemKey)
      }
      return newSet
    })
  }

  // Função para selecionar/desselecionar todos
  const toggleSelectAll = () => {
    if (selectedItemsForPayment.size === cart.length) {
      setSelectedItemsForPayment(new Set())
    } else {
      const allKeys = cart.map(item => getItemKey(item))
      setSelectedItemsForPayment(new Set(allKeys))
    }
  }

  // Carregar zonas de entrega
  useEffect(() => {
    const loadDeliveryZones = async () => {
      const supabase = createClient()
      try {
        const { data, error } = await supabase
          .from("delivery_zones")
          .select("*")
          .eq("active", true)
          .order("display_order", { ascending: true })
          .order("name", { ascending: true })

        if (error) throw error
        setDeliveryZones(data || [])
        
        // Selecionar a primeira zona por padrão
        if (data && data.length > 0) {
          setSelectedDeliveryZoneId(data[0].id)
        }
      } catch (error) {
        console.error("Erro ao carregar zonas de entrega:", error)
      }
    }
    loadDeliveryZones()
  }, [])

  // Atualizar deliveryFee quando a zona mudar
  useEffect(() => {
    if (selectedDeliveryZoneId && deliveryZones.length > 0 && orderType === "delivery") {
      const selectedZone = deliveryZones.find(z => z.id === selectedDeliveryZoneId)
      if (selectedZone) {
        setDeliveryFee(selectedZone.fee)
      }
    }
  }, [selectedDeliveryZoneId, deliveryZones, orderType])

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Enter para finalizar pedido (quando o carrinho está aberto e não está em um input)
      if (e.key === "Enter" && !e.shiftKey && cart.length > 0 && !isSubmitting) {
        const target = e.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && !target.isContentEditable) {
          const canSubmit = 
            paymentMethod && 
            (orderType !== "dine-in" || selectedTable) &&
            (orderType !== "delivery" || (customerName.trim() && customerPhone.trim() && deliveryAddress.trim()))
          
          if (canSubmit) {
            e.preventDefault()
            handleCreateOrder()
          }
        }
      }
      
      // Esc para fechar modais
      if (e.key === "Escape") {
        if (isProductModalOpen) {
          setIsProductModalOpen(false)
          setSelectedProduct(null)
        }
        if (isWeightModalOpen) {
          setIsWeightModalOpen(false)
        }
        if (showSuccessModal) {
          setShowSuccessModal(false)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length, paymentMethod, orderType, selectedTable, customerName, customerPhone, deliveryAddress, isSubmitting, isProductModalOpen, isWeightModalOpen, showSuccessModal])

  // Função para formatar telefone
  const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, (match, p1, p2, p3) => {
        if (p3) return `(${p1}) ${p2}-${p3}`
        if (p2) return `(${p1}) ${p2}`
        if (p1) return `(${p1}`
        return numbers
      })
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, (match, p1, p2, p3) => {
        if (p3) return `(${p1}) ${p2}-${p3}`
        if (p2) return `(${p1}) ${p2}`
        if (p1) return `(${p1}`
        return numbers
      })
    }
  }

  // Buscar histórico de clientes quando telefone mudar (delivery)
  useEffect(() => {
    const searchCustomerHistory = async () => {
      if (orderType === "delivery" && customerPhone.trim().length >= 10) {
        const phoneNumbers = customerPhone.replace(/\D/g, "")
        if (phoneNumbers.length >= 10) {
          const supabase = createClient()
          try {
            const { data, error } = await supabase
              .from("orders")
              .select("customer_name, customer_phone, delivery_address, reference_point, delivery_zone_id")
              .eq("order_type", "delivery")
              .not("customer_phone", "is", null)
              .ilike("customer_phone", `%${phoneNumbers}%`)
              .order("created_at", { ascending: false })
              .limit(5)

            if (!error && data) {
              // Remover duplicatas e manter apenas o mais recente de cada combinação
              const uniqueHistory = data.reduce((acc: any[], order: any) => {
                const exists = acc.find(
                  (o) =>
                    o.customer_phone === order.customer_phone &&
                    o.delivery_address === order.delivery_address
                )
                if (!exists) {
                  acc.push(order)
                }
                return acc
              }, [])
              setCustomerHistory(uniqueHistory)
              setShowCustomerHistory(uniqueHistory.length > 0)
            }
          } catch (error) {
            console.error("Erro ao buscar histórico:", error)
          }
        }
      } else {
        setCustomerHistory([])
        setShowCustomerHistory(false)
      }
    }

    const timeoutId = setTimeout(searchCustomerHistory, 500)
    return () => clearTimeout(timeoutId)
  }, [customerPhone, orderType])

  // Função para preencher dados do histórico
  const fillFromHistory = (historyItem: typeof customerHistory[0]) => {
    setCustomerName(historyItem.customer_name || "")
    setCustomerPhone(historyItem.customer_phone || "")
    setDeliveryAddress(historyItem.delivery_address || "")
    setReferencePoint(historyItem.reference_point || "")
    if (historyItem.delivery_zone_id) {
      setSelectedDeliveryZoneId(historyItem.delivery_zone_id)
    }
    setShowCustomerHistory(false)
    toast.success("Dados preenchidos do histórico")
  }

  // Função para duplicar pedido
  const duplicateOrder = async (order: Order) => {
    if (!order.order_items || order.order_items.length === 0) {
      toast.error("Pedido não possui itens para duplicar")
      return
    }

    try {
      const supabase = createClient()
      
      // Buscar produtos completos com variedades e extras
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*, products(*)")
        .eq("active", true)

      const { data: allVarieties } = await supabase
        .from("product_varieties")
        .select("*")
        .eq("active", true)

      const { data: allExtras } = await supabase
        .from("product_extras")
        .select("*")
        .eq("active", true)

      // Mapear produtos com variedades e extras
      const productsMap = new Map<string, Product>()
      if (categoriesData) {
        categoriesData.forEach((cat: any) => {
          if (cat.products) {
            cat.products.forEach((prod: any) => {
              productsMap.set(prod.id, {
                ...prod,
                varieties: allVarieties?.filter((v) => v.product_id === prod.id) || [],
                extras: allExtras?.filter((e) => e.product_id === prod.id) || [],
              })
            })
          }
        })
      }

      // Limpar carrinho atual
      setCart([])
      setSelectedItemsForPayment(new Set())

      // Adicionar itens do pedido ao carrinho
      const newCartItems: CartItem[] = []
      for (const item of order.order_items) {
        const productId = (item as any).product_id
        const product = productId ? productsMap.get(productId) : null
        
        if (product) {
          // Encontrar variedade se houver
          const variety = item.variety_id
            ? product.varieties?.find((v) => v.id === item.variety_id)
            : null

          // Buscar extras do item
          const itemExtras: { extra: ProductExtra; quantity: number }[] = []
          if (item.order_item_extras) {
            for (const extraData of item.order_item_extras) {
              const extraId = (extraData as any).extra_id
              const extra = product.extras?.find((e) => e.id === extraId)
              if (extra) {
                itemExtras.push({ extra, quantity: extraData.quantity })
              }
            }
          }

          const basePrice = variety?.price ?? product.price ?? 0
          const extrasPrice = itemExtras.reduce((sum, e) => sum + e.extra.price * e.quantity, 0)
          const finalPrice = basePrice + extrasPrice

          newCartItems.push({
            ...product,
            quantity: item.quantity,
            selectedVariety: variety || null,
            selectedExtras: itemExtras,
            finalPrice,
          })
        } else {
          // Item por peso ou produto removido - criar item manual
          const weightMatch = item.notes?.match(/Peso:\s*([\d,]+)\s*kg/)
          const priceMatch = item.notes?.match(/Preço\/kg:\s*R\$\s*([\d,]+)/)
          
          if (weightMatch && priceMatch) {
            const weight = parseFloat(weightMatch[1].replace(",", "."))
            const pricePerKg = parseFloat(priceMatch[1].replace(",", "."))
            
            const manualItem: CartItem = {
              id: `weight-${Date.now()}-${Math.random()}`,
              name: item.product_name,
              description: item.notes || "",
              price: pricePerKg,
              quantity: 1,
              finalPrice: pricePerKg * weight,
              weight: weight,
              category_id: null,
              image_url: undefined,
              active: true,
              display_order: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            newCartItems.push(manualItem)
          }
        }
      }

      setCart(newCartItems)
      setSelectedItemsForPayment(new Set(newCartItems.map(item => getItemKey(item))))

      // Preencher dados do pedido
      if (order.order_type === "delivery") {
        setOrderType("delivery")
        setCustomerName(order.customer_name || "")
        setCustomerPhone(order.customer_phone || "")
        setDeliveryAddress(order.delivery_address || "")
        setReferencePoint(order.reference_point || "")
        setDeliveryFee(order.delivery_fee || 0)
        if (order.delivery_zone_id) {
          setSelectedDeliveryZoneId(order.delivery_zone_id)
        }
      } else if (order.order_type === "pickup") {
        setOrderType("pickup")
        setCustomerName(order.customer_name || "")
        setCustomerPhone(order.customer_phone || "")
      } else {
        setOrderType("dine-in")
        setSelectedTable(order.table_number?.toString() || "")
        setCustomerName(order.customer_name || "")
      }

      setPaymentMethod(order.payment_method || "")
      setNotes(order.notes || "")
      
      // Scroll para o carrinho
      setTimeout(() => {
        document.getElementById("cart-section")?.scrollIntoView({ behavior: "smooth" })
      }, 100)

      toast.success("Pedido duplicado com sucesso!")
      setShowOrdersList(false)
    } catch (error) {
      console.error("Erro ao duplicar pedido:", error)
      toast.error("Erro ao duplicar pedido")
    }
  }

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

  const addToCart = (product: Product, options: SelectedOptions, quantity: number = 1) => {
    if (!product) return
    
    const basePrice = options.variety?.price ?? product.price ?? 0
    // Calcular o preço dos extras (soma de todos os extras com suas quantidades)
    const extrasPrice = (options.extras || []).reduce((sum, extraItem) => {
      if (!extraItem || !extraItem.extra) return sum
      return sum + ((extraItem.extra.price || 0) * (extraItem.quantity || 0))
    }, 0)
    // finalPrice é o preço unitário (base + extras)
    const finalPrice = basePrice + extrasPrice

    setCart((prev) => {
      const prevArray = Array.isArray(prev) ? prev : []
      const itemKey = `${product.id}-${options.variety?.id || 'base'}-${(options.extras || []).map(e => `${e?.extra?.id || ''}:${e?.quantity || 0}`).join(',') || 'no-extras'}`
      
      const existing = prevArray.find((item) => {
        if (!item) return false
        const itemKey2 = `${item.id}-${item.selectedVariety?.id || 'base'}-${(item.selectedExtras || []).map(e => `${e?.extra?.id || ''}:${e?.quantity || 0}`).join(',') || 'no-extras'}`
        return itemKey === itemKey2
      })

      if (existing) {
        // Se o item já existe, incrementa a quantidade pela quantidade fornecida
        return prevArray.map((item) => {
          if (!item) return item
          const itemKey2 = `${item.id}-${item.selectedVariety?.id || 'base'}-${(item.selectedExtras || []).map(e => `${e?.extra?.id || ''}:${e?.quantity || 0}`).join(',') || 'no-extras'}`
          if (itemKey === itemKey2) {
            // Recalcular o finalPrice para garantir que está correto
            const recalculatedFinalPrice = calculateFinalPrice({ ...item, selectedVariety: options.variety, selectedExtras: options.extras } as CartItem)
            return { 
              ...item, 
              quantity: (item.quantity || 0) + quantity,
              finalPrice: recalculatedFinalPrice
            }
          }
          return item
        })
      }
      
      const newItem = { 
        ...product,
        quantity: quantity,
        selectedVariety: options.variety || null,
        selectedExtras: options.extras || [],
        finalPrice
      }
      
      // Adicionar automaticamente ao selecionados quando adiciona novo item
      const newItemKey = getItemKey(newItem)
      setSelectedItemsForPayment((prev) => new Set([...prev, newItemKey]))
      
      // Manter o carrinho minimizado quando adiciona item
      setIsCartMinimized(true)
      
      return [...prevArray, newItem]
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
        // Recalcular o finalPrice para garantir que está correto
        const recalculatedFinalPrice = calculateFinalPrice(item)
        return { ...item, quantity, finalPrice: recalculatedFinalPrice }
      }
      return item
    }))
  }

  const removeFromCart = (itemKey: string) => {
    setCart((prev) => prev.filter((item) => {
      // Para itens por peso, usar o id diretamente
      if (item.weight && item.weight > 0) {
        return item.id !== itemKey
      }
      const currentKey = `${item.id}-${item.selectedVariety?.id || 'base'}-${item.selectedExtras?.map(e => `${e.extra.id}:${e.quantity}`).join(',') || 'no-extras'}`
      return currentKey !== itemKey
    }))
    // Remover também da seleção se estiver selecionado
    setSelectedItemsForPayment((prev) => {
      const newSet = new Set(prev)
      newSet.delete(itemKey)
      return newSet
    })
  }

  const handleAddItemByWeight = () => {
    const weight = parseFloat(productWeight.replace(",", "."))
    const price = parseFloat(pricePerKg.replace(",", "."))
    
    if (isNaN(weight) || weight <= 0) {
      toast.error("Por favor, insira um peso válido")
      return
    }
    
    if (isNaN(price) || price <= 0) {
      toast.error("Por favor, insira um preço por kg válido")
      return
    }

    const finalPrice = price * weight
    const description = productDescription.trim() || "Item por peso"
    
    // Criar item por peso
    const newItem: CartItem = {
      id: `weight-${Date.now()}-${Math.random()}`, // ID único para item por peso
      name: description,
      description: `Peso: ${weight.toFixed(3).replace(".", ",")} kg | Preço/kg: R$ ${price.toFixed(2).replace(".", ",")}`,
      price: price, // Preço por kg
      quantity: 1,
      finalPrice: finalPrice, // Preço total já calculado
      weight: weight,
      category_id: null,
      image_url: undefined,
      active: true,
      display_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setCart((prev) => [...prev, newItem])
    // Manter peso e preço/kg, limpar apenas a descrição
    setProductDescription("")
    // Não fechar o modal automaticamente, apenas limpar a descrição para adicionar outro item
  }

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      toast.error("Adicione pelo menos um item ao pedido")
      return
    }

    if (orderType === "dine-in" && (!selectedTable || selectedTable.trim() === "")) {
      toast.error("Selecione uma mesa")
      return
    }

    if (orderType === "delivery") {
      if (!customerName.trim()) {
        toast.error("Preencha o nome do cliente")
        return
      }
      if (!customerPhone.trim()) {
        toast.error("Preencha o telefone do cliente")
        return
      }
      if (!deliveryAddress.trim()) {
        toast.error("Preencha o endereço de entrega")
        return
      }
    }


    if (!paymentMethod || !paymentMethod.trim()) {
      toast.error("Selecione a forma de pagamento")
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const finalTotal = orderType === "delivery" ? totalPrice + deliveryFee : totalPrice
      const orderData: any = {
        order_type: orderType,
        status: "pending",
        total: finalTotal,
        notes: notes?.trim() || null,
        payment_method: paymentMethod.trim(),
      }

      if (orderType === "dine-in") {
        const tableNumber = parseInt(selectedTable)
        orderData.table_number = tableNumber
        if (customerName.trim()) {
          orderData.customer_name = customerName.trim()
        }
      } else if (orderType === "pickup") {
        orderData.table_number = 0
        orderData.customer_name = customerName.trim() || null
        orderData.customer_phone = customerPhone.trim() || null
        orderData.delivery_address = null
        orderData.reference_point = null
        orderData.delivery_fee = 0
      } else       if (orderType === "delivery") {
        orderData.table_number = 0
        orderData.customer_name = customerName.trim()
        orderData.customer_phone = customerPhone.trim()
        orderData.delivery_address = deliveryAddress.trim()
        orderData.reference_point = referencePoint?.trim() || null
        orderData.delivery_fee = deliveryFee || 0
        // Adicionar zone_id se uma zona foi selecionada
        if (selectedDeliveryZoneId) {
          orderData.delivery_zone_id = selectedDeliveryZoneId
        }
      }

      const { data: order, error: orderError } = await supabase.from("orders").insert(orderData).select().single()

      if (orderError) {
        console.error("Erro ao criar pedido:", orderError)
        throw orderError
      }

      // Inserir itens do pedido
      const orderItems = cart.map((item) => {
        let itemNotes = ""
        if (item.weight && item.weight > 0) {
          // Item por peso
          itemNotes = `Peso: ${item.weight.toFixed(3).replace(".", ",")} kg | Preço/kg: R$ ${item.price.toFixed(2).replace(".", ",")}`
        }
        
        const unitPrice = calculateFinalPrice(item)
        // Para itens por peso, o subtotal já está no finalPrice
        const subtotal = item.weight && item.weight > 0 ? unitPrice : unitPrice * item.quantity
        
        return {
          order_id: order.id,
          product_id: item.weight && item.weight > 0 ? undefined : item.id, // Itens por peso não têm product_id
          product_name: item.name,
          product_price: item.selectedVariety ? item.selectedVariety.price : item.price,
          quantity: item.quantity,
          subtotal: subtotal,
          variety_id: item.selectedVariety?.id || null,
          variety_name: item.selectedVariety?.name || null,
          variety_price: item.selectedVariety?.price || null,
          notes: itemNotes || null,
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
      setSelectedItemsForPayment(new Set())
      // Incrementar mesa automaticamente apenas para dine-in
      if (orderType === "dine-in" && selectedTable) {
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
      setCustomerPhone("")
      setDeliveryAddress("")
      setReferencePoint("")
      setDeliveryFee(0)
      setPaymentMethod("")
      setNotes("")
      setShowSuccessModal(true)
      router.refresh()
    } catch (error: any) {
      console.error("Error creating order:", error)
      console.error("Error details:", JSON.stringify(error, null, 2))
      toast.error(`Erro ao criar pedido: ${error.message || error.details || 'Erro desconhecido'}`)
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin")}
              className="p-1.5 sm:p-2 h-auto flex-shrink-0 hover:bg-slate-100"
              title="Voltar ao painel"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
            </Button>
            <UtensilsCrossed className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700 flex-shrink-0" />
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">Anotar Pedido</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowOrdersList(!showOrdersList)}
              className="relative text-xs sm:text-sm px-2 sm:px-3"
            >
              <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Pedidos</span>
              {activeOrders.length > 0 && (
                <>
                  <span className="sm:hidden">({activeOrders.length})</span>
                  <span className="hidden sm:inline">({activeOrders.length})</span>
                </>
              )}
            </Button>
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
      {showOrdersList && (
        <div className="bg-white border-b border-slate-200 p-2 sm:p-4 max-h-[50vh] overflow-y-auto">
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-semibold text-slate-900 mb-2 sm:mb-3">Pedidos Existentes</h2>
            {activeOrders.length === 0 ? (
              <div className="text-center py-6 text-slate-600">
                <p className="text-xs sm:text-sm">Nenhum pedido do dia atual</p>
              </div>
            ) : (
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
                    <div className="flex gap-1 sm:gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => duplicateOrder(order)}
                        className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3 text-blue-600 border-blue-300 hover:bg-blue-50"
                        title="Duplicar pedido"
                      >
                        <Copy className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Duplicar</span>
                      </Button>
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
                  </div>
                )
              })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seleção de Tipo de Pedido */}
      <div className="bg-white border-b border-slate-200 p-2 sm:p-4">
        <div className="space-y-2">
          <Label htmlFor="order-type-select" className="text-xs sm:text-sm font-semibold text-slate-900">
            Tipo de Pedido
          </Label>
          <Select value={orderType} onValueChange={(value) => {
            setOrderType(value as "dine-in" | "delivery" | "pickup")
            if (value === "delivery" || value === "pickup") {
              setSelectedTable("")
            }
            if (value === "dine-in") {
              setCustomerName("")
              setCustomerPhone("")
              setDeliveryAddress("")
              setReferencePoint("")
              setDeliveryFee(0)
            }
            if (value === "pickup") {
              setDeliveryAddress("")
              setReferencePoint("")
              setDeliveryFee(0)
            }
            if (value === "delivery") {
              // Manter nome e telefone se já preenchidos
              // Selecionar primeira zona se disponível
              if (deliveryZones.length > 0 && !selectedDeliveryZoneId) {
                setSelectedDeliveryZoneId(deliveryZones[0].id)
              }
            } else {
              // Limpar zona quando não for delivery
              setSelectedDeliveryZoneId("")
            }
          }}>
            <SelectTrigger id="order-type-select" className="w-full text-sm sm:text-base">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dine-in">Mesa / Balcão</SelectItem>
              <SelectItem value="pickup">Retirada Local</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Seleção de Mesa (apenas para dine-in) */}
      {orderType === "dine-in" && (
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
      )}

      {/* Campos de Retirada Local */}
      {orderType === "pickup" && (
        <div className="bg-white border-b border-slate-200 p-2 sm:p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-900">
            <ShoppingBag className="h-4 w-4" />
            <span>Informações de Retirada</span>
          </div>
          <div className="space-y-2">
            <div>
              <Label htmlFor="takeout-customer-name" className="text-xs sm:text-sm font-semibold">
                Nome do Cliente
              </Label>
              <Input
                id="takeout-customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome completo"
                className="text-xs sm:text-sm"
              />
            </div>
            <div>
              <Label htmlFor="takeout-customer-phone" className="text-xs sm:text-sm font-semibold">
                Telefone
              </Label>
              <Input
                id="takeout-customer-phone"
                value={customerPhone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  setCustomerPhone(formatted)
                }}
                placeholder="(00) 00000-0000"
                className="text-xs sm:text-sm"
                maxLength={15}
              />
            </div>
          </div>
        </div>
      )}

      {/* Campos de Delivery */}
      {orderType === "delivery" && (
        <div className="bg-white border-b border-slate-200 p-2 sm:p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-900">
            <Bike className="h-4 w-4" />
            <span>Informações de Entrega</span>
          </div>
          <div className="space-y-2">
            <div>
              <Label htmlFor="delivery-customer-name" className="text-xs sm:text-sm font-semibold">
                Nome do Cliente <span className="text-red-500">*</span>
              </Label>
              <Input
                id="delivery-customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nome completo"
                className="text-xs sm:text-sm"
              />
            </div>
            <div className="relative">
              <Label htmlFor="delivery-customer-phone" className="text-xs sm:text-sm font-semibold">
                Telefone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="delivery-customer-phone"
                value={customerPhone}
                onChange={(e) => {
                  const formatted = formatPhone(e.target.value)
                  setCustomerPhone(formatted)
                }}
                placeholder="(00) 00000-0000"
                className="text-xs sm:text-sm"
                maxLength={15}
              />
              {showCustomerHistory && customerHistory.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <div className="p-2 border-b border-slate-200 flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <History className="h-3 w-3" />
                    Histórico de Clientes
                  </div>
                  {customerHistory.map((history, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => fillFromHistory(history)}
                      className="w-full text-left p-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="text-xs font-medium text-slate-900">{history.customer_name}</div>
                      <div className="text-[10px] text-slate-600 truncate">{history.customer_phone}</div>
                      <div className="text-[10px] text-slate-500 truncate">{history.delivery_address}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="delivery-address" className="text-xs sm:text-sm font-semibold">
                Endereço Completo <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="delivery-address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Rua, número, bairro, cidade, CEP"
                className="text-xs sm:text-sm resize-none"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="reference-point" className="text-xs sm:text-sm font-semibold">
                Ponto de Referência (opcional)
              </Label>
              <Input
                id="reference-point"
                value={referencePoint}
                onChange={(e) => setReferencePoint(e.target.value)}
                placeholder="Ex: Próximo ao mercado, em frente à farmácia, etc."
                className="text-xs sm:text-sm"
              />
            </div>
            {deliveryZones.length > 1 ? (
              <div>
                <Label htmlFor="delivery-zone" className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Zona de Entrega
                </Label>
                <Select value={selectedDeliveryZoneId} onValueChange={setSelectedDeliveryZoneId}>
                  <SelectTrigger id="delivery-zone" className="text-xs sm:text-sm">
                    <SelectValue placeholder="Selecione a zona" />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryZones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name} - R$ {zone.fee.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label htmlFor="delivery-fee" className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Taxa de Entrega (R$)
                </Label>
                <Input
                  id="delivery-fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="text-xs sm:text-sm"
                />
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Botão para adicionar item por peso */}
      <div className="p-2 sm:p-4 border-b border-slate-200 bg-white">
        <Button
          onClick={() => setIsWeightModalOpen(true)}
          className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 sm:py-3 text-xs sm:text-sm"
        >
          <UtensilsCrossed className="h-4 w-4 mr-2" />
          Adicionar Item por Peso
        </Button>
      </div>

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
          <div 
            className="p-2 sm:p-4 border-b border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => setIsCartMinimized(!isCartMinimized)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                <div className="p-1 h-auto flex-shrink-0">
                  {isCartMinimized ? (
                    <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-lg font-bold text-slate-900 truncate">Carrinho ({totalItems})</h3>
                  {isCartMinimized && (
                    <p className="text-xs sm:text-sm text-slate-600">Total: R$ {(orderType === "delivery" ? totalPrice + deliveryFee : totalPrice).toFixed(2)}</p>
                  )}
                </div>
              </div>
              {!isCartMinimized && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setCart([])
                    setSelectedItemsForPayment(new Set())
                  }}
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
                {/* Cabeçalho com selecionar todos */}
                {cart.length > 0 && (
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedItemsForPayment.size === cart.length && cart.length > 0}
                        onCheckedChange={toggleSelectAll}
                        id="select-all"
                      />
                      <Label
                        htmlFor="select-all"
                        className="text-xs sm:text-sm font-semibold text-slate-900 cursor-pointer"
                      >
                        Selecionar todos para pagamento
                      </Label>
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-48 overflow-y-auto overflow-x-visible">
                  {cart.map((item) => {
                const itemKey = getItemKey(item)
                const isSelected = selectedItemsForPayment.has(itemKey)
                return (
                  <div key={itemKey} className={`flex items-center gap-1.5 sm:gap-2 p-2 rounded-lg overflow-visible ${isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'}`}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleItemSelection(itemKey)}
                      id={`item-${itemKey}`}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 overflow-hidden pr-2">
                      <p className={`text-xs sm:text-sm font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                        {item.name}
                      </p>
                      {item.selectedVariety && (
                        <p className="text-[10px] sm:text-xs text-slate-600 truncate">{item.selectedVariety.name}</p>
                      )}
                      {item.selectedExtras && item.selectedExtras.length > 0 && (
                        <p className="text-[10px] sm:text-xs text-slate-600 line-clamp-1 truncate">
                          {item.selectedExtras.map(e => e.extra.name).join(", ")}
                        </p>
                      )}
                      {item.weight && item.weight > 0 && (
                        <p className="text-[10px] sm:text-xs text-slate-600">
                          Peso: {item.weight.toFixed(3).replace(".", ",")} kg | Preço/kg: R$ {item.price.toFixed(2).replace(".", ",")}
                        </p>
                      )}
                      <p className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                        R$ {item.weight && item.weight > 0 ? calculateFinalPrice(item).toFixed(2) : (calculateFinalPrice(item) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ml-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (item.quantity > 1) {
                            updateQuantity(itemKey, item.quantity - 1)
                          } else {
                            removeFromCart(itemKey)
                          }
                        }}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors border-slate-300"
                        title={item.quantity === 1 ? "Remover item" : "Diminuir quantidade"}
                      >
                        <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <span className="w-6 sm:w-8 text-center font-bold text-xs sm:text-sm flex-shrink-0">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(itemKey, item.quantity + 1)}
                        className="h-7 w-7 sm:h-8 sm:w-8 p-0 flex-shrink-0 hover:bg-green-50 hover:border-green-300 hover:text-green-600 transition-colors border-slate-300"
                        title="Aumentar quantidade"
                      >
                        <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                  )
                  })}
                </div>

            <div className="space-y-2 sm:space-y-3 pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-base sm:text-lg font-bold text-slate-900">Subtotal:</span>
                <span className="text-base sm:text-lg font-semibold text-slate-700">R$ {totalPrice.toFixed(2)}</span>
              </div>
              {orderType === "delivery" && deliveryFee > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-slate-700">Taxa de entrega:</span>
                  <span className="text-sm sm:text-base font-semibold text-slate-700">R$ {deliveryFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-300">
                <span className="text-base sm:text-lg font-bold text-slate-900">Total do Pedido:</span>
                <span className="text-lg sm:text-xl font-bold text-slate-900">R$ {(orderType === "delivery" ? totalPrice + deliveryFee : totalPrice).toFixed(2)}</span>
              </div>
              {selectedItemsForPayment.size > 0 && (
                <div className="flex justify-between items-center bg-blue-50 p-2 rounded-lg border border-blue-200">
                  <span className="text-sm sm:text-base font-semibold text-blue-900">Total Selecionado:</span>
                  <span className="text-base sm:text-lg font-bold text-blue-900">R$ {selectedTotalPrice.toFixed(2)}</span>
                </div>
              )}
              {selectedItemsForPayment.size > 0 && selectedItemsForPayment.size < cart.length && (
                <p className="text-[10px] sm:text-xs text-slate-600 text-center">
                  {selectedItemsForPayment.size} de {cart.length} itens selecionados
                </p>
              )}

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

              {((orderType === "dine-in" && !selectedTable) || !paymentMethod || (orderType === "delivery" && (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()))) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 sm:p-3 text-xs sm:text-sm text-yellow-800">
                  {orderType === "dine-in" && !selectedTable && <p>⚠️ Selecione uma mesa</p>}
                  {orderType === "delivery" && !customerName.trim() && <p>⚠️ Preencha o nome do cliente</p>}
                  {orderType === "delivery" && !customerPhone.trim() && <p>⚠️ Preencha o telefone do cliente</p>}
                  {orderType === "delivery" && !deliveryAddress.trim() && <p>⚠️ Preencha o endereço de entrega</p>}
                  {!paymentMethod && <p>⚠️ Selecione a forma de pagamento</p>}
                </div>
              )}
              <Button
                onClick={handleCreateOrder}
                disabled={
                  isSubmitting || 
                  cart.length === 0 || 
                  !paymentMethod || 
                  (orderType === "dine-in" && !selectedTable) ||
                  (orderType === "delivery" && (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()))
                }
                className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-4 sm:py-6 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed relative"
                type="button"
              >
                {isSubmitting ? "Enviando..." : (
                  <>
                    Finalizar Pedido
                    <span className="hidden sm:inline ml-2 text-xs opacity-75">(Enter)</span>
                  </>
                )}
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
        allowQuantitySelection={true}
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

      {/* Modal de Adicionar Item por Peso */}
      <Dialog open={isWeightModalOpen} onOpenChange={setIsWeightModalOpen}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[500px] max-h-[95vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg md:text-xl">Adicionar Item por Peso</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weightDescription">Descrição do Item</Label>
              <Input
                id="weightDescription"
                type="text"
                placeholder="Ex: Prato montado, Salada, etc."
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="text"
                placeholder="0,000"
                value={productWeight}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9,]/g, "").replace(",", ".")
                  setProductWeight(value.replace(".", ","))
                }}
                className="text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pricePerKg">Preço por kg (R$)</Label>
              <Input
                id="pricePerKg"
                type="text"
                placeholder="0,00"
                value={pricePerKg}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9,]/g, "").replace(",", ".")
                  setPricePerKg(value.replace(".", ","))
                }}
                className="text-sm sm:text-base"
              />
            </div>

            {productWeight && pricePerKg && !isNaN(parseFloat(productWeight.replace(",", "."))) && !isNaN(parseFloat(pricePerKg.replace(",", "."))) && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-semibold">Peso:</span> {parseFloat(productWeight.replace(",", ".")).toFixed(3).replace(".", ",")} kg
                  </p>
                  <p>
                    <span className="font-semibold">Preço/kg:</span> R$ {parseFloat(pricePerKg.replace(",", ".")).toFixed(2).replace(".", ",")}
                  </p>
                  <p className="font-bold text-base mt-2">
                    Total: R$ {(parseFloat(pricePerKg.replace(",", ".")) * parseFloat(productWeight.replace(",", "."))).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsWeightModalOpen(false)
                setProductWeight("")
                setProductDescription("")
                setPricePerKg("")
              }}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Fechar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setProductWeight("")
                setProductDescription("")
                setPricePerKg("")
              }}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Limpar Valores
            </Button>
            <Button
              onClick={handleAddItemByWeight}
              disabled={
                !productWeight || 
                !pricePerKg ||
                isNaN(parseFloat(productWeight.replace(",", "."))) || 
                parseFloat(productWeight.replace(",", ".")) <= 0 ||
                isNaN(parseFloat(pricePerKg.replace(",", "."))) || 
                parseFloat(pricePerKg.replace(",", ".")) <= 0
              }
              className="bg-slate-600 hover:bg-slate-700 w-full sm:w-auto text-sm sm:text-base"
            >
              Adicionar ao Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

