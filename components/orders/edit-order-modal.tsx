"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Phone, MapPin, FileText, DollarSign, Bike, Minus, Plus, Trash2, ShoppingBag, RefreshCw, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Order } from "@/types/order"
import type { Product, ProductVariety, ProductExtra } from "@/types/product"

type EditOrderModalProps = {
  order: Order
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type EditableOrderItem = {
  id: string
  product_id?: string | null // ID do produto original (para itens substituídos)
  product_name: string
  product_price: number
  quantity: number
  subtotal?: number // Subtotal do banco (importante para itens por peso)
  variety_id?: string | null
  variety_name?: string | null
  variety_price?: number | null
  order_item_extras?: Array<{
    id: string
    extra_id?: string | null
    extra_name: string
    extra_price: number
    quantity: number
  }>
  notes?: string | null
  isReplaced?: boolean // Flag para indicar que foi substituído
  weight?: number // Peso em kg para produtos vendidos por peso
}

type Table = {
  id: string
  table_number: number
  capacity: number
  status: string
}

export function EditOrderModal({ order, isOpen, onClose, onSuccess }: EditOrderModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    status: order.status,
    customerName: order.customer_name || "",
    customerPhone: order.customer_phone || "",
    deliveryAddress: order.delivery_address || "",
    referencePoint: order.reference_point || "",
    notes: order.notes || "",
    deliveryFee: order.delivery_fee || 0,
    total: order.total,
    paymentMethod: order.payment_method || "",
  })
  const [orderType, setOrderType] = useState<string>(order.order_type || "dine-in")
  const [tableNumber, setTableNumber] = useState<string>(order.table_number?.toString() || "0")
  const [tables, setTables] = useState<Table[]>([])
  const [orderItems, setOrderItems] = useState<EditableOrderItem[]>([])
  const [replaceItemModalOpen, setReplaceItemModalOpen] = useState(false)
  const [addItemModalOpen, setAddItemModalOpen] = useState(false)
  const [itemToReplace, setItemToReplace] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariety, setSelectedVariety] = useState<ProductVariety | null>(null)
  const [selectedExtras, setSelectedExtras] = useState<Array<{ extra: ProductExtra; quantity: number }>>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [newItemQuantity, setNewItemQuantity] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false)
  const [productWeight, setProductWeight] = useState<string>("")
  const [productDescription, setProductDescription] = useState<string>("")
  const [pricePerKg, setPricePerKg] = useState<string>("")

  useEffect(() => {
    if (isOpen) {
      setFormData({
        status: order.status,
        customerName: order.customer_name || "",
        customerPhone: order.customer_phone || "",
        deliveryAddress: order.delivery_address || "",
        referencePoint: order.reference_point || "",
        notes: order.notes || "",
        deliveryFee: order.delivery_fee || 0,
        total: order.total,
        paymentMethod: order.payment_method || "",
      })
      setOrderType(order.order_type || "dine-in")
      setTableNumber(order.table_number?.toString() || "0")
      // Inicializar itens editáveis
      setOrderItems(
        order.order_items.map((item) => {
          // Extrair peso e preço/kg das notas se for item por peso
          let weight: number | undefined = undefined
          if (item.notes && item.notes.includes("Peso:")) {
            const pesoMatch = item.notes.match(/Peso:\s*([\d,]+)\s*kg/)
            if (pesoMatch) {
              weight = parseFloat(pesoMatch[1].replace(",", "."))
            }
          }
          
          return {
            id: item.id,
            product_id: (item as any).product_id || null,
            product_name: item.product_name,
            product_price: item.product_price,
            quantity: item.quantity,
            subtotal: item.subtotal, // Preservar subtotal do banco
            variety_id: item.variety_id || null,
            variety_name: item.variety_name,
            variety_price: item.variety_price || null,
            order_item_extras: (item.order_item_extras || []).map((extra) => ({
              id: extra.id,
              extra_id: (extra as any).extra_id || null,
              extra_name: extra.extra_name,
              extra_price: extra.extra_price,
              quantity: extra.quantity,
            })),
            notes: item.notes,
            isReplaced: false,
            weight: weight,
          }
        })
      )
      
      // Buscar mesas
      const fetchTables = async () => {
        const supabase = createClient()
        const { data } = await supabase
          .from("restaurant_tables")
          .select("*")
          .eq("active", true)
          .order("table_number")
        if (data) {
          setTables(data)
        }
      }
      fetchTables()
    }
  }, [order, isOpen])

  const isDelivery = orderType === "delivery"
  const isPickup = orderType === "pickup"
  const isDineIn = orderType === "dine-in"

  // Calcular subtotal dos itens editáveis
  // Para itens por peso, usar o subtotal do banco; caso contrário, calcular
  const subtotal = orderItems.reduce((sum, item) => {
    // Se o item tem subtotal do banco (especialmente para itens por peso), usar ele
    // Caso contrário, calcular baseado em product_price * quantity
    const itemSubtotal = item.subtotal !== undefined ? item.subtotal : (item.product_price * item.quantity)
    const extrasTotal = (item.order_item_extras || []).reduce((extraSum, extra) => {
      return extraSum + extra.extra_price * extra.quantity
    }, 0)
    return sum + itemSubtotal + extrasTotal
  }, 0)

  // Calcular total com taxa de entrega (apenas para delivery)
  const calculatedTotal = subtotal + (isDelivery ? Number(formData.deliveryFee) : 0)

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          // Se for item por peso, recalcular subtotal baseado no peso * preço/kg * quantidade
          if (item.weight !== undefined && item.weight > 0) {
            const newSubtotal = item.product_price * item.weight * newQuantity
            return { ...item, quantity: newQuantity, subtotal: newSubtotal }
          }
          // Para itens normais, limpar o subtotal para forçar recálculo baseado na nova quantidade
          // Isso garante que o total seja atualizado corretamente
          return { ...item, quantity: newQuantity, subtotal: undefined }
        }
        return item
      })
    )
  }

  const removeItem = (itemId: string) => {
    if (orderItems.length <= 1) {
      alert("Não é possível remover todos os itens do pedido. Delete o pedido inteiro se necessário.")
      return
    }
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const openReplaceModal = async (itemId: string) => {
    setItemToReplace(itemId)
    setIsLoadingProducts(true)
    setReplaceItemModalOpen(true)
    setSearchTerm("")
    setSelectedProduct(null)
    setSelectedVariety(null)
    setSelectedExtras([])

    const supabase = createClient()
    try {
      // Buscar categorias com produtos ativos
      const { data: cats } = await supabase
        .from("categories")
        .select("*, products(*)")
        .eq("active", true)
        .order("display_order")

      if (cats) {
        cats.forEach((cat: any) => {
          if (cat.products) {
            cat.products = cat.products
              .filter((p: any) => p.active === true)
              .sort((a: any, b: any) => {
                if (a.display_order !== b.display_order) {
                  return a.display_order - b.display_order
                }
                return a.id.localeCompare(b.id)
              })
          }
        })
      }

      // Buscar variedades e extras
      const { data: allVarieties } = await supabase
        .from("product_varieties")
        .select("*")
        .eq("active", true)
        .order("display_order")

      const { data: allExtras } = await supabase
        .from("product_extras")
        .select("*")
        .eq("active", true)
        .order("display_order")

      // Mapear variedades e extras aos produtos
      if (cats && allVarieties && allExtras) {
        cats.forEach((cat: any) => {
          if (cat.products) {
            cat.products = cat.products.map((product: any) => ({
              ...product,
              varieties: allVarieties.filter((v) => v.product_id === product.id),
              extras: allExtras.filter((e) => e.product_id === product.id),
            }))
          }
        })
      }

      setCategories(cats || [])
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      alert("Erro ao carregar produtos do cardápio")
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const handleReplaceItem = () => {
    if (!selectedProduct || !itemToReplace) return

    const basePrice = selectedVariety ? selectedVariety.price : selectedProduct.price
    const extrasPrice = selectedExtras.reduce((sum, item) => sum + item.extra.price * item.quantity, 0)
    const finalPrice = basePrice + extrasPrice

    const item = orderItems.find((i) => i.id === itemToReplace)
    if (!item) return

    const productName = selectedProduct.description
      ? `${selectedProduct.name} - ${selectedProduct.description}`
      : selectedProduct.name

    // Criar novo item com os dados do produto selecionado
    const newItem: EditableOrderItem = {
      id: item.id, // Manter o mesmo ID para substituir no banco
      product_id: selectedProduct.id,
      product_name: productName,
      product_price: basePrice,
      quantity: item.quantity, // Manter a quantidade original
      variety_id: selectedVariety?.id || null,
      variety_name: selectedVariety?.name || null,
      variety_price: selectedVariety?.price || null,
      order_item_extras: selectedExtras.map((e) => ({
        id: `temp-${Date.now()}-${Math.random()}`, // ID temporário para novos extras
        extra_id: e.extra.id,
        extra_name: e.extra.name,
        extra_price: e.extra.price,
        quantity: e.quantity,
      })),
      notes: item.notes,
      isReplaced: true,
    }

    setOrderItems((prev) => prev.map((i) => (i.id === itemToReplace ? newItem : i)))
    setReplaceItemModalOpen(false)
    setItemToReplace(null)
    setSelectedProduct(null)
    setSelectedVariety(null)
    setSelectedExtras([])
  }

  const toggleExtra = (extra: ProductExtra) => {
    setSelectedExtras((prev) => {
      const existing = prev.find((e) => e.extra.id === extra.id)
      if (existing) {
        if (existing.quantity <= 1) {
          return prev.filter((e) => e.extra.id !== extra.id)
        }
        return prev.map((e) => (e.extra.id === extra.id ? { ...e, quantity: e.quantity - 1 } : e))
      }
      return [...prev, { extra, quantity: 1 }]
    })
  }

  const increaseExtraQuantity = (extraId: string) => {
    setSelectedExtras((prev) =>
      prev.map((e) => (e.extra.id === extraId ? { ...e, quantity: e.quantity + 1 } : e))
    )
  }

  const openAddItemModal = async () => {
    setIsLoadingProducts(true)
    setAddItemModalOpen(true)
    setSelectedProduct(null)
    setSelectedVariety(null)
    setSelectedExtras([])
    setNewItemQuantity(1)

    const supabase = createClient()
    try {
      // Buscar categorias com produtos ativos
      const { data: cats } = await supabase
        .from("categories")
        .select("*, products(*)")
        .eq("active", true)
        .order("display_order")

      if (cats) {
        cats.forEach((cat: any) => {
          if (cat.products) {
            cat.products = cat.products
              .filter((p: any) => p.active === true)
              .sort((a: any, b: any) => {
                if (a.display_order !== b.display_order) {
                  return a.display_order - b.display_order
                }
                return a.id.localeCompare(b.id)
              })
          }
        })
      }

      // Buscar variedades e extras
      const { data: allVarieties } = await supabase
        .from("product_varieties")
        .select("*")
        .eq("active", true)
        .order("display_order")

      const { data: allExtras } = await supabase
        .from("product_extras")
        .select("*")
        .eq("active", true)
        .order("display_order")

      // Mapear variedades e extras aos produtos
      if (cats && allVarieties && allExtras) {
        cats.forEach((cat: any) => {
          if (cat.products) {
            cat.products = cat.products.map((product: any) => ({
              ...product,
              varieties: allVarieties.filter((v) => v.product_id === product.id),
              extras: allExtras.filter((e) => e.product_id === product.id),
            }))
          }
        })
      }

      setCategories(cats || [])
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
      alert("Erro ao carregar produtos do cardápio")
    } finally {
      setIsLoadingProducts(false)
    }
  }

  // Filtrar categorias e produtos baseado no termo de busca
  const filteredCategories = useMemo(() => {
    if (!categories || categories.length === 0) {
      return []
    }

    if (!searchTerm.trim()) {
      return categories
    }

    const searchLower = searchTerm.toLowerCase().trim()
    
    return categories
      .map((category: any) => {
        const filteredProducts = category.products?.filter((product: Product) => {
          const productName = (product.name || "").toLowerCase()
          const productDescription = (product.description || "").toLowerCase()
          return productName.includes(searchLower) || productDescription.includes(searchLower)
        }) || []

        if (filteredProducts.length > 0) {
          return {
            ...category,
            products: filteredProducts,
          }
        }
        return null
      })
      .filter((category: any) => category !== null)
  }, [categories, searchTerm])

  const handleAddItem = () => {
    if (!selectedProduct) return

    const basePrice = selectedVariety ? selectedVariety.price : selectedProduct.price
    const extrasPrice = selectedExtras.reduce((sum, item) => sum + item.extra.price * item.quantity, 0)
    const finalPrice = basePrice + extrasPrice

    const productName = selectedProduct.description
      ? `${selectedProduct.name} - ${selectedProduct.description}`
      : selectedProduct.name

    // Criar novo item temporário (será inserido no banco ao salvar)
    const newItem: EditableOrderItem = {
      id: `temp-${Date.now()}-${Math.random()}`, // ID temporário
      product_id: selectedProduct.id,
      product_name: productName,
      product_price: basePrice,
      quantity: newItemQuantity,
      subtotal: undefined, // Será calculado ao salvar
      variety_id: selectedVariety?.id || null,
      variety_name: selectedVariety?.name || null,
      variety_price: selectedVariety?.price || null,
      order_item_extras: selectedExtras.map((e) => ({
        id: `temp-extra-${Date.now()}-${Math.random()}`,
        extra_id: e.extra.id,
        extra_name: e.extra.name,
        extra_price: e.extra.price,
        quantity: e.quantity,
      })),
      notes: null,
      isReplaced: false,
    }

    setOrderItems((prev) => [...prev, newItem])
    setAddItemModalOpen(false)
    setSelectedProduct(null)
    setSelectedVariety(null)
    setSelectedExtras([])
    setNewItemQuantity(1)
  }

  const handleAddItemByWeight = () => {
    const weight = parseFloat(productWeight.replace(",", "."))
    const price = parseFloat(pricePerKg.replace(",", "."))
    
    if (isNaN(weight) || weight <= 0) {
      alert("Por favor, insira um peso válido")
      return
    }
    
    if (isNaN(price) || price <= 0) {
      alert("Por favor, insira um preço por kg válido")
      return
    }

    const finalPrice = price * weight
    const description = productDescription.trim() || "Item por peso"
    
    // Criar nota com informações de peso
    const itemNotes = `Peso: ${weight.toFixed(3).replace(".", ",")} kg | Preço/kg: R$ ${price.toFixed(2).replace(".", ",")}`

    // Criar novo item temporário (será inserido no banco ao salvar)
    const newItem: EditableOrderItem = {
      id: `temp-${Date.now()}-${Math.random()}`, // ID temporário
      product_id: null, // Item por peso não tem product_id
      product_name: description,
      product_price: price, // Preço por kg
      quantity: 1,
      subtotal: finalPrice, // Subtotal já calculado (peso * preço/kg)
      variety_id: null,
      variety_name: null,
      variety_price: null,
      order_item_extras: [],
      notes: itemNotes,
      isReplaced: false,
      weight: weight,
    }

    setOrderItems((prev) => [...prev, newItem])
    setIsWeightModalOpen(false)
    setProductWeight("")
    setProductDescription("")
    setPricePerKg("")
  }

  const handleSave = async () => {
    if (orderItems.length === 0) {
      alert("O pedido deve ter pelo menos um item.")
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    try {
      // 1. Atualizar informações do pedido
      const updateData: any = {
        status: formData.status,
        notes: formData.notes?.trim() || null,
        total: calculatedTotal,
        payment_method: formData.paymentMethod?.trim() || null,
      }

      // Atualizar order_type e table_number
      updateData.order_type = orderType
      if (orderType === "pickup") {
        updateData.table_number = 0
        updateData.customer_name = formData.customerName.trim() || null
        updateData.customer_phone = formData.customerPhone.trim() || null
      } else if (orderType === "dine-in") {
        updateData.table_number = parseInt(tableNumber) || 0
        updateData.customer_name = formData.customerName.trim() || null
      } else if (isDelivery) {
        updateData.customer_name = formData.customerName.trim() || null
        updateData.customer_phone = formData.customerPhone.trim() || null
        updateData.delivery_address = formData.deliveryAddress.trim() || null
        updateData.reference_point = formData.referencePoint?.trim() || null
        updateData.delivery_fee = Number(formData.deliveryFee) || 0
      }

      const { error: orderError } = await supabase.from("orders").update(updateData).eq("id", order.id)

      if (orderError) throw orderError

      // 2. Separar itens novos (temporários) e existentes
      const newItems = orderItems.filter((item) => item.id.startsWith("temp-"))
      const existingItems = orderItems.filter((item) => !item.id.startsWith("temp-"))

      // 3. Identificar itens que foram removidos
      const existingItemIds = new Set(existingItems.map((item) => item.id))
      const originalItemIds = new Set(order.order_items.map((item) => item.id))
      const itemsToDelete = Array.from(originalItemIds).filter((id) => !existingItemIds.has(id))

      // 4. Deletar itens removidos (e seus extras)
      if (itemsToDelete.length > 0) {
        // Deletar extras dos itens removidos
        const { error: extrasDeleteError } = await supabase
          .from("order_item_extras")
          .delete()
          .in("order_item_id", itemsToDelete)

        if (extrasDeleteError) throw extrasDeleteError

        // Deletar os itens
        const { error: itemsDeleteError } = await supabase
          .from("order_items")
          .delete()
          .in("id", itemsToDelete)

        if (itemsDeleteError) throw itemsDeleteError
      }

      // 5. Inserir novos itens
      if (newItems.length > 0) {
        const itemsToInsert = newItems.map((item) => {
          // Se o item tem subtotal (especialmente para itens por peso), usar ele
          // Caso contrário, calcular baseado em product_price * quantity
          const itemSubtotal = item.subtotal !== undefined ? item.subtotal : (item.product_price * item.quantity)
          const extrasTotal = (item.order_item_extras || []).reduce(
            (sum, extra) => sum + extra.extra_price * extra.quantity,
            0
          )
          const newSubtotal = itemSubtotal + extrasTotal

          return {
            order_id: order.id,
            product_id: item.product_id,
            product_name: item.product_name.trim(),
            product_price: item.product_price,
            quantity: item.quantity,
            subtotal: newSubtotal,
            variety_id: item.variety_id,
            variety_name: item.variety_name,
            variety_price: item.variety_price,
            notes: item.notes,
          }
        })

        const { data: insertedItems, error: insertError } = await supabase
          .from("order_items")
          .insert(itemsToInsert)
          .select()

        if (insertError) throw insertError

        // Inserir extras dos novos itens
        if (insertedItems) {
          const extrasToInsert: any[] = []
          newItems.forEach((newItem, index) => {
            const insertedItem = insertedItems[index]
            if (insertedItem && newItem.order_item_extras && newItem.order_item_extras.length > 0) {
              newItem.order_item_extras.forEach((extra) => {
                extrasToInsert.push({
                  order_item_id: insertedItem.id,
                  extra_id: extra.extra_id,
                  extra_name: extra.extra_name,
                  extra_price: extra.extra_price,
                  quantity: extra.quantity,
                })
              })
            }
          })

          if (extrasToInsert.length > 0) {
            const { error: insertExtrasError } = await supabase
              .from("order_item_extras")
              .insert(extrasToInsert)

            if (insertExtrasError) throw insertExtrasError
          }
        }
      }

      // 6. Atualizar itens existentes (que não foram removidos)
      for (const item of existingItems) {
        const originalItem = order.order_items.find((oi) => oi.id === item.id)

        if (originalItem) {
          // Se o item tem subtotal (especialmente para itens por peso), usar ele
          // Caso contrário, calcular baseado em product_price * quantity
          const itemSubtotal = item.subtotal !== undefined ? item.subtotal : (item.product_price * item.quantity)
          const extrasTotal = (item.order_item_extras || []).reduce(
            (sum, extra) => sum + extra.extra_price * extra.quantity,
            0
          )
          const newSubtotal = itemSubtotal + extrasTotal

          // Atualizar o item
          const updateData: any = {
            quantity: item.quantity,
            product_name: item.product_name.trim(),
            subtotal: newSubtotal,
          }

          // Se foi substituído, atualizar product_id, variety_id, etc.
          if (item.isReplaced && item.product_id) {
            updateData.product_id = item.product_id
            updateData.variety_id = item.variety_id
            updateData.variety_name = item.variety_name
            updateData.variety_price = item.variety_price
            updateData.product_price = item.product_price
          }

          const { error: updateError } = await supabase
            .from("order_items")
            .update(updateData)
            .eq("id", item.id)

          if (updateError) throw updateError

          // Se o item foi substituído, atualizar os extras
          if (item.isReplaced) {
            // Deletar extras antigos
            const { error: deleteExtrasError } = await supabase
              .from("order_item_extras")
              .delete()
              .eq("order_item_id", item.id)

            if (deleteExtrasError) throw deleteExtrasError

            // Inserir novos extras
            if (item.order_item_extras && item.order_item_extras.length > 0) {
              const extrasToInsert = item.order_item_extras.map((extra) => ({
                order_item_id: item.id,
                extra_id: extra.extra_id,
                extra_name: extra.extra_name,
                extra_price: extra.extra_price,
                quantity: extra.quantity,
              }))

              const { error: insertExtrasError } = await supabase
                .from("order_item_extras")
                .insert(extrasToInsert)

              if (insertExtrasError) throw insertExtrasError
            }
          }
        }
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Erro ao atualizar pedido:", error)
      alert("Erro ao atualizar pedido. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl md:max-w-4xl lg:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl">Editar Pedido #{order.id.slice(0, 8).toUpperCase()}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 md:space-y-5 py-2 sm:py-4 md:py-6">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-semibold">
              Status do Pedido
            </Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="preparing">Em Preparo</SelectItem>
                <SelectItem value="ready">Pronto</SelectItem>
                {isDelivery && <SelectItem value="out_for_delivery">Saiu para Entrega</SelectItem>}
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Pedido */}
          {!isDelivery && (
            <div className="space-y-2">
              <Label htmlFor="orderType" className="text-sm font-semibold">
                Tipo de Pedido
              </Label>
              <Select value={orderType} onValueChange={(value) => {
                setOrderType(value)
                if (value === "pickup") {
                  setTableNumber("0")
                }
              }}>
                <SelectTrigger id="orderType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dine-in">Mesa / Balcão</SelectItem>
                  <SelectItem value="pickup">Retirada no Local</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Seleção de Mesa (apenas para dine-in) */}
          {isDineIn && (
            <div className="space-y-2">
              <Label htmlFor="tableNumber" className="text-sm font-semibold">
                Mesa / Balcão
              </Label>
              <Select value={tableNumber} onValueChange={setTableNumber}>
                <SelectTrigger id="tableNumber">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Balcão</SelectItem>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.table_number.toString()}>
                      Mesa {table.table_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Itens do Pedido */}
          <div className="space-y-3 p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <h3 className="font-semibold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Itens do Pedido
              </h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openAddItemModal}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700 text-xs sm:text-sm"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Adicionar Item</span>
                  <span className="sm:hidden">Adicionar</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsWeightModalOpen(true)
                    setProductWeight("")
                    setProductDescription("")
                    setPricePerKg("")
                  }}
                  className="text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700 text-xs sm:text-sm"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Por Peso</span>
                  <span className="sm:hidden">Peso</span>
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {orderItems.map((item) => {
                // Usar subtotal do banco se disponível (para itens por peso), senão calcular
                const itemSubtotal = item.subtotal !== undefined ? item.subtotal : (item.product_price * item.quantity)
                const extrasTotal = (item.order_item_extras || []).reduce(
                  (sum, extra) => sum + extra.extra_price * extra.quantity,
                  0
                )
                const itemTotal = itemSubtotal + extrasTotal

                return (
                  <div key={item.id} className="bg-white p-2 sm:p-3 md:p-4 rounded-lg border border-slate-200">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="space-y-1">
                          <Input
                            value={item.product_name}
                            onChange={(e) => {
                              setOrderItems((prev) =>
                                prev.map((i) =>
                                  i.id === item.id ? { ...i, product_name: e.target.value } : i
                                )
                              )
                            }}
                            className="font-medium text-xs sm:text-sm md:text-base border-slate-300 focus:border-slate-500"
                            placeholder="Nome do produto"
                          />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center md:gap-4 gap-1">
                          {item.variety_name && (
                            <p className="text-xs md:text-sm text-slate-600">Tamanho: {item.variety_name || ""}</p>
                          )}
                          {item.order_item_extras && item.order_item_extras.length > 0 && (
                            <div className="text-xs md:text-sm text-slate-600">
                              {item.order_item_extras.map((extra) => (
                                <span key={extra.id} className="mr-2">
                                  + {extra.extra_name || ""} {extra.quantity > 1 && `(x${extra.quantity})`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-xs md:text-sm text-slate-500 italic">Obs: {item.notes}</p>
                        )}
                        {item.weight && (
                          <p className="text-xs md:text-sm text-slate-600 font-medium">
                            Peso: {item.weight.toFixed(3).replace(".", ",")} kg | Preço/kg: R$ {item.product_price.toFixed(2).replace(".", ",")}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between md:justify-end gap-2 md:gap-3 flex-shrink-0">
                        <p className="text-sm md:text-base font-semibold text-slate-700 md:min-w-[80px] md:text-right">
                          R$ {itemTotal.toFixed(2)}
                        </p>
                        <div className="flex items-center gap-1 border border-slate-300 rounded-md">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 hover:bg-slate-100"
                            onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1
                              updateItemQuantity(item.id, newQty)
                            }}
                            className="w-10 sm:w-12 md:w-14 h-7 sm:h-8 md:h-9 text-center border-0 p-0 text-xs sm:text-sm md:text-base"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 hover:bg-slate-100"
                            onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => openReplaceModal(item.id)}
                            title="Substituir por outro produto"
                          >
                            <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => removeItem(item.id)}
                            title="Remover item"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {orderItems.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">Nenhum item no pedido</p>
              )}
            </div>
          </div>

          {/* Informações do Cliente (Delivery) */}
          {isDelivery && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Bike className="h-4 w-4" />
                Informações de Entrega
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome do Cliente
                  </Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Nome completo"
                    className="border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryAddress" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço Completo
                </Label>
                <Textarea
                  id="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  placeholder="Rua, número, bairro, cidade, CEP"
                  rows={3}
                  className="border-slate-200 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="referencePoint" className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ponto de Referência (opcional)
                  </Label>
                  <Input
                    id="referencePoint"
                    value={formData.referencePoint}
                    onChange={(e) => setFormData({ ...formData, referencePoint: e.target.value })}
                    placeholder="Ex: Próximo ao mercado, em frente à farmácia, etc."
                    className="border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryFee" className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Taxa de Entrega (R$)
                  </Label>
                  <Input
                    id="deliveryFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.deliveryFee}
                    onChange={(e) => setFormData({ ...formData, deliveryFee: parseFloat(e.target.value) || 0 })}
                    className="border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deliveryPaymentMethod" className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Forma de Pagamento
                </Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                  <SelectTrigger id="deliveryPaymentMethod">
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Não informado">Não informado</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Informações do Cliente e Pagamento (Dine-in) */}
          {isDineIn && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações do Cliente e Pagamento
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dineInCustomerName" className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome do Cliente
                  </Label>
                  <Input
                    id="dineInCustomerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Nome do cliente"
                    className="border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod" className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Forma de Pagamento
                  </Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Não informado">Não informado</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Informações do Cliente e Pagamento (Pickup) */}
          {isPickup && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações de Retirada no Local
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickupCustomerName" className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome do Cliente
                  </Label>
                  <Input
                    id="pickupCustomerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Nome do cliente"
                    className="border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pickupCustomerPhone" className="text-sm font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <Input
                    id="pickupCustomerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    className="border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickupPaymentMethod" className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Forma de Pagamento
                </Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                  <SelectTrigger id="pickupPaymentMethod">
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Não informado">Não informado</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                    <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Observações
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações gerais do pedido"
              rows={3}
              className="border-slate-200 resize-none"
            />
          </div>

          {/* Resumo Financeiro */}
          <div className="p-4 md:p-6 bg-slate-50 rounded-lg border border-slate-200 space-y-2 md:space-y-3">
            <h3 className="font-semibold text-base md:text-lg text-slate-900 mb-3 md:mb-4">Resumo Financeiro</h3>
            <div className="flex justify-between text-sm md:text-base text-slate-700">
              <span>Subtotal dos itens:</span>
              <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
            </div>
            {isDelivery && formData.deliveryFee > 0 && (
              <div className="flex justify-between text-sm md:text-base text-slate-700">
                <span>Taxa de entrega:</span>
                <span className="font-medium">R$ {Number(formData.deliveryFee).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 md:pt-3 border-t border-slate-300">
              <span className="font-bold text-base md:text-lg text-slate-900">Total:</span>
              <span className="font-bold text-lg md:text-xl text-slate-900">R$ {calculatedTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3 flex-col sm:flex-row">
          <Button variant="outline" onClick={onClose} disabled={isSaving} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto bg-slate-600 hover:bg-slate-700">
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Modal de Substituição de Item */}
      <Dialog open={replaceItemModalOpen} onOpenChange={setReplaceItemModalOpen}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[75vw] 2xl:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10 2xl:p-12">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg md:text-xl">Substituir Item do Pedido</DialogTitle>
          </DialogHeader>

          {isLoadingProducts ? (
            <div className="py-8 text-center text-slate-600 text-sm sm:text-base">Carregando produtos...</div>
          ) : (
            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              {/* Barra de Pesquisa */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-semibold">Buscar Produto</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Digite o nome do produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Seleção de Produto */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-semibold">Selecione um Produto</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 max-h-48 sm:max-h-60 md:max-h-72 lg:max-h-80 overflow-y-auto">
                  {filteredCategories.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-sm text-slate-500">
                      Nenhum produto encontrado
                    </div>
                  ) : (
                    filteredCategories.flatMap((category) =>
                      (category.products || []).map((product: Product) => (
                        <Button
                          key={product.id}
                          type="button"
                          variant={selectedProduct?.id === product.id ? "default" : "outline"}
                          className="h-auto min-h-[60px] sm:min-h-[70px] md:min-h-[80px] p-2 sm:p-2.5 md:p-3 flex flex-col items-center justify-center gap-1 text-[10px] sm:text-xs md:text-sm"
                          onClick={() => {
                            setSelectedProduct(product)
                            setSelectedVariety(null)
                            setSelectedExtras([])
                          }}
                        >
                          <span className="font-medium text-center break-words break-all leading-tight line-clamp-2 w-full px-1">{product.name || ""}</span>
                          <span className="text-[9px] sm:text-[10px] md:text-xs opacity-75 whitespace-nowrap">R$ {product.price?.toFixed(2) || "0.00"}</span>
                        </Button>
                      ))
                    )
                  )}
                </div>
              </div>

              {selectedProduct && (
                <>
                  {/* Seleção de Variedade */}
                  {selectedProduct.varieties && selectedProduct.varieties.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-semibold">Tamanho</Label>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <Button
                          type="button"
                          variant={!selectedVariety ? "default" : "outline"}
                          size="sm"
                          className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                          onClick={() => setSelectedVariety(null)}
                        >
                          <span className="hidden sm:inline">Padrão (R$ {selectedProduct.price?.toFixed(2) || "0.00"})</span>
                          <span className="sm:hidden">Padrão</span>
                        </Button>
                        {selectedProduct.varieties.map((variety) => (
                          <Button
                            key={variety.id}
                            type="button"
                            variant={selectedVariety?.id === variety.id ? "default" : "outline"}
                            size="sm"
                            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                            onClick={() => setSelectedVariety(variety)}
                          >
                            <span className="hidden sm:inline">{variety.name || ""} (R$ {variety.price?.toFixed(2) || "0.00"})</span>
                            <span className="sm:hidden">{variety.name || ""}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seleção de Extras */}
                  {selectedProduct.extras && selectedProduct.extras.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-semibold">Extras</Label>
                      <div className="space-y-1.5 sm:space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
                        {selectedProduct.extras.map((extra) => {
                          const selected = selectedExtras.find((e) => e.extra.id === extra.id)
                          return (
                            <div
                              key={extra.id}
                              className="flex items-center justify-between p-2 sm:p-2.5 border border-slate-200 rounded-lg"
                            >
                              <div className="flex-1 min-w-0 pr-2">
                                <span className="text-xs sm:text-sm font-medium block truncate">{extra.name}</span>
                                {extra.price > 0 && (
                                  <span className="text-[10px] sm:text-xs text-slate-600">
                                    + R$ {extra.price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                {selected ? (
                                  <>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 sm:h-8 sm:w-8"
                                      onClick={() => toggleExtra(extra)}
                                    >
                                      <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                    <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-medium">
                                      {selected.quantity}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 sm:h-8 sm:w-8"
                                      onClick={() => increaseExtraQuantity(extra.id)}
                                    >
                                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs sm:text-sm px-2 sm:px-3"
                                    onClick={() => toggleExtra(extra)}
                                  >
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

                  {/* Resumo do Novo Item */}
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-xs sm:text-sm mb-2">Resumo do Novo Item</h4>
                    <div className="space-y-1 text-xs sm:text-sm">
                      <p>
                        <span className="font-medium">Produto:</span> {selectedProduct.name || ""}
                      </p>
                      {selectedVariety && (
                        <p>
                          <span className="font-medium">Tamanho:</span> {selectedVariety.name || ""}
                        </p>
                      )}
                      {selectedExtras.length > 0 && (
                        <div>
                          <span className="font-medium">Extras:</span>
                          {selectedExtras.map((e) => (
                            <span key={e.extra.id} className="ml-2">
                              {e.extra.name || ""} {e.quantity > 1 && `(x${e.quantity})`}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="font-bold text-sm sm:text-base mt-2">
                        Preço: R${" "}
                        {(
                          (selectedVariety ? selectedVariety.price : selectedProduct.price) +
                          selectedExtras.reduce((sum, e) => sum + e.extra.price * e.quantity, 0)
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setReplaceItemModalOpen(false)}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReplaceItem}
              disabled={!selectedProduct}
              className="bg-slate-600 hover:bg-slate-700 w-full sm:w-auto text-sm sm:text-base"
            >
              Substituir Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Adicionar Item */}
      <Dialog open={addItemModalOpen} onOpenChange={setAddItemModalOpen}>
        <DialogContent className="w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[75vw] 2xl:max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-5 md:p-6 lg:p-8 xl:p-10 2xl:p-12">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg md:text-xl">Adicionar Item ao Pedido</DialogTitle>
          </DialogHeader>

          {isLoadingProducts ? (
            <div className="py-8 text-center text-slate-600 text-sm sm:text-base">Carregando produtos...</div>
          ) : (
            <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              {/* Barra de Pesquisa */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-semibold">Buscar Produto</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Digite o nome do produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Seleção de Produto */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-semibold">Selecione um Produto</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 max-h-48 sm:max-h-60 md:max-h-72 lg:max-h-80 overflow-y-auto">
                  {filteredCategories.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-sm text-slate-500">
                      Nenhum produto encontrado
                    </div>
                  ) : (
                    filteredCategories.map((category) =>
                      category.products?.map((product: Product) => (
                        <Button
                          key={product.id}
                          type="button"
                          variant={selectedProduct?.id === product.id ? "default" : "outline"}
                          className="h-auto min-h-[60px] sm:min-h-[70px] md:min-h-[80px] p-2 sm:p-2.5 md:p-3 flex flex-col items-center justify-center gap-1 text-[10px] sm:text-xs md:text-sm"
                          onClick={() => {
                            setSelectedProduct(product)
                            setSelectedVariety(null)
                            setSelectedExtras([])
                          }}
                        >
                          <span className="font-medium text-center break-words break-all leading-tight line-clamp-2 w-full px-1">{product.name || ""}</span>
                          <span className="text-[9px] sm:text-[10px] md:text-xs opacity-75 whitespace-nowrap">R$ {product.price?.toFixed(2) || "0.00"}</span>
                        </Button>
                      ))
                    )
                  )}
                </div>
              </div>

              {selectedProduct && (
                <>
                  {/* Quantidade */}
                  <div className="space-y-2">
                    <Label className="text-xs sm:text-sm font-semibold">Quantidade</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 sm:h-10 sm:w-10"
                        onClick={() => setNewItemQuantity(Math.max(1, newItemQuantity - 1))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={newItemQuantity}
                        onChange={(e) => setNewItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 sm:w-20 text-center text-sm sm:text-base"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 sm:h-10 sm:w-10"
                        onClick={() => setNewItemQuantity(newItemQuantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Seleção de Variedade */}
                  {selectedProduct.varieties && selectedProduct.varieties.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-semibold">Tamanho</Label>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        <Button
                          type="button"
                          variant={!selectedVariety ? "default" : "outline"}
                          size="sm"
                          className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                          onClick={() => setSelectedVariety(null)}
                        >
                          <span className="hidden sm:inline">Padrão (R$ {selectedProduct.price?.toFixed(2) || "0.00"})</span>
                          <span className="sm:hidden">Padrão</span>
                        </Button>
                        {selectedProduct.varieties.map((variety) => (
                          <Button
                            key={variety.id}
                            type="button"
                            variant={selectedVariety?.id === variety.id ? "default" : "outline"}
                            size="sm"
                            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
                            onClick={() => setSelectedVariety(variety)}
                          >
                            <span className="hidden sm:inline">{variety.name || ""} (R$ {variety.price?.toFixed(2) || "0.00"})</span>
                            <span className="sm:hidden">{variety.name || ""}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Seleção de Extras */}
                  {selectedProduct.extras && selectedProduct.extras.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs sm:text-sm font-semibold">Extras</Label>
                      <div className="space-y-1.5 sm:space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
                        {selectedProduct.extras.map((extra) => {
                          const selected = selectedExtras.find((e) => e.extra.id === extra.id)
                          return (
                            <div
                              key={extra.id}
                              className="flex items-center justify-between p-2 sm:p-2.5 border border-slate-200 rounded-lg"
                            >
                              <div className="flex-1 min-w-0 pr-2">
                                <span className="text-xs sm:text-sm font-medium block truncate">{extra.name}</span>
                                {extra.price > 0 && (
                                  <span className="text-[10px] sm:text-xs text-slate-600">
                                    + R$ {extra.price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                {selected ? (
                                  <>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 sm:h-8 sm:w-8"
                                      onClick={() => toggleExtra(extra)}
                                    >
                                      <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                    <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-medium">
                                      {selected.quantity}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 sm:h-8 sm:w-8"
                                      onClick={() => increaseExtraQuantity(extra.id)}
                                    >
                                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-xs sm:text-sm px-2 sm:px-3"
                                    onClick={() => toggleExtra(extra)}
                                  >
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

                  {/* Resumo do Novo Item */}
                  <div className="p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-xs sm:text-sm mb-2">Resumo do Item</h4>
                    <div className="space-y-1 text-xs sm:text-sm">
                      <p>
                        <span className="font-medium">Produto:</span> {selectedProduct.name || ""}
                      </p>
                      {selectedVariety && (
                        <p>
                          <span className="font-medium">Tamanho:</span> {selectedVariety.name || ""}
                        </p>
                      )}
                      {selectedExtras.length > 0 && (
                        <div>
                          <span className="font-medium">Extras:</span>
                          {selectedExtras.map((e) => (
                            <span key={e.extra.id} className="ml-2">
                              {e.extra.name || ""} {e.quantity > 1 && `(x${e.quantity})`}
                            </span>
                          ))}
                        </div>
                      )}
                      <p>
                        <span className="font-medium">Quantidade:</span> {newItemQuantity}
                      </p>
                      <p className="font-bold text-sm sm:text-base mt-2">
                        Preço Unitário: R${" "}
                        {(
                          (selectedVariety ? selectedVariety.price : selectedProduct.price) +
                          selectedExtras.reduce((sum, e) => sum + e.extra.price * e.quantity, 0)
                        ).toFixed(2)}
                      </p>
                      <p className="font-bold text-base sm:text-lg mt-2">
                        Total: R${" "}
                        {(
                          ((selectedVariety ? selectedVariety.price : selectedProduct.price) +
                            selectedExtras.reduce((sum, e) => sum + e.extra.price * e.quantity, 0)) *
                          newItemQuantity
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setAddItemModalOpen(false)}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddItem}
              disabled={!selectedProduct}
              className="bg-slate-600 hover:bg-slate-700 w-full sm:w-auto text-sm sm:text-base"
            >
              Adicionar ao Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              Cancelar
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
    </Dialog>
  )
}

