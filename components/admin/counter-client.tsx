"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCart, Plus, X, Package, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { createRoot } from "react-dom/client"
import { PrintOrderReceipt } from "@/components/orders/print-order-receipt"
import { ProductOptionsModal } from "@/components/menu/product-options-modal"
import type { Product, ProductVariety, ProductExtra } from "@/types/product"
import type { Order } from "@/types/order"

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

// Produto fixo do Balcão (self-service)
const BALCAO_PRODUCT: Product = {
  id: "balcao-self-service",
  name: "Balcão (Self-Service)",
  description: "Item montado pelo cliente no balcão",
  price: 0, // Preço será definido pelo peso
  category_id: "",
  active: true,
  display_order: 0,
  image_url: null,
  varieties: [],
  extras: [],
}

export function CounterClient({
  categories,
  tables,
  restaurantInfo,
}: {
  categories: Category[]
  tables: Table[]
  restaurantInfo: { name: string; phone?: string; address?: string; cnpj?: string }
}) {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedTable, setSelectedTable] = useState<string>("0") // 0 = balcão
  const [customerName, setCustomerName] = useState<string>("")
  const [customerPhone, setCustomerPhone] = useState<string>("")
  const [customerAddress, setCustomerAddress] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false)
  const [productWeight, setProductWeight] = useState<string>("")
  const [productDescription, setProductDescription] = useState<string>("") // Descrição do que o cliente montou
  const [pricePerKg, setPricePerKg] = useState<string>("") // Preço por kg
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState<string>("")

  const totalPrice = cart.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Filtrar produtos baseado no termo de pesquisa
  const filteredCategories = categories.map((category) => ({
    ...category,
    products: category.products?.filter((product: Product) => {
      if (!searchTerm.trim()) return true
      const searchLower = searchTerm.toLowerCase()
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)
      )
    }) || [],
  })).filter((category) => category.products && category.products.length > 0)

  const handleAddBalcaoItem = () => {
    setIsWeightModalOpen(true)
    setProductWeight("")
    setProductDescription("")
    setPricePerKg("")
  }

  const addBalcaoItemToCart = (weight: number, pricePerKg: number, description: string) => {
    const finalPrice = pricePerKg * weight
    
    const item: CartItem = {
      ...BALCAO_PRODUCT,
      name: description || "Balcão (Self-Service)",
      price: pricePerKg,
      quantity: 1,
      selectedVariety: null,
      selectedExtras: [],
      finalPrice,
      weight,
    }

    setCart((prev) => [...prev, item])
    setProductWeight("")
    setProductDescription("")
    setPricePerKg("")
    setIsWeightModalOpen(false)
  }

  const handleAddWithWeight = () => {
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

    addBalcaoItemToCart(weight, price, productDescription)
  }


  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddProductToCart = (product: Product, options: SelectedOptions) => {
    const basePrice = options.variety ? options.variety.price : product.price
    const extrasPrice = options.extras.reduce((sum, item) => sum + item.extra.price * item.quantity, 0)
    const finalPrice = basePrice + extrasPrice

    const item: CartItem = {
      ...product,
      quantity: 1,
      selectedVariety: options.variety,
      selectedExtras: options.extras,
      finalPrice,
    }

    setCart((prev) => [...prev, item])
    setSelectedProduct(null)
    setIsProductModalOpen(false)
  }

  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      alert("Adicione pelo menos um item ao pedido")
      return
    }

    if (!selectedTable) {
      alert("Selecione uma mesa ou balcão")
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
        notes: notes || null,
        payment_method: paymentMethod.trim() || null,
      }

      // Adicionar informações do cliente se preenchidas
      if (customerName.trim()) {
        orderData.customer_name = customerName.trim()
      }
      if (customerPhone.trim()) {
        orderData.customer_phone = customerPhone.trim()
      }
      if (customerAddress.trim()) {
        orderData.delivery_address = customerAddress.trim()
      }

      const { data: order, error: orderError } = await supabase.from("orders").insert(orderData).select().single()

      if (orderError) {
        console.error("Erro ao criar pedido:", orderError)
        throw orderError
      }

      // Inserir itens do pedido
      const orderItems = cart.map((item) => {
        let itemNotes = ""
        if (item.weight) {
          itemNotes = `Peso: ${item.weight.toFixed(3).replace(".", ",")} kg | Preço/kg: R$ ${item.price.toFixed(2).replace(".", ",")}`
        }
        
        return {
          order_id: order.id,
          product_id: item.id === "balcao-self-service" ? null : item.id, // Balcão não tem product_id
          product_name: item.name,
          product_price: item.selectedVariety ? item.selectedVariety.price : item.price,
          quantity: item.quantity,
          subtotal: item.finalPrice * item.quantity,
          variety_id: item.selectedVariety?.id || null,
          variety_name: item.selectedVariety?.name || null,
          variety_price: item.selectedVariety?.price || null,
          notes: itemNotes || null,
        }
      })

      const { data: insertedItems, error: itemsError } = await supabase.from("order_items").insert(orderItems).select()

      if (itemsError) throw itemsError

      // Não há extras para itens do balcão (self-service)
      // Inserir extras apenas se houver itens com extras (não do balcão)
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

      // Buscar pedido completo para impressão
      const { data: completeOrder, error: fetchError } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items(
            *,
            order_item_extras(*)
          )
        `
        )
        .eq("id", order.id)
        .single()

      if (fetchError) throw fetchError

      // Limpar carrinho
      setCart([])
      setCustomerName("")
      setCustomerPhone("")
      setCustomerAddress("")
      setPaymentMethod("")
      setNotes("")
      setSelectedTable("0")

      // Imprimir notinha
      if (completeOrder) {
        printReceipt(completeOrder as Order)
      }

      // Atualizar página
      router.refresh()

      alert("Pedido criado com sucesso!")
    } catch (error) {
      console.error("Erro ao criar pedido:", error)
      alert("Erro ao criar pedido. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const printReceipt = (order: Order) => {
    // Criar elemento temporário para impressão
    const printContainer = document.createElement("div")
    printContainer.id = `print-container-${order.id}`
    printContainer.style.position = "absolute"
    printContainer.style.left = "-9999px"
    printContainer.style.top = "0"
    printContainer.style.width = "80mm"
    printContainer.style.visibility = "visible"
    printContainer.style.display = "block"
    printContainer.style.opacity = "1"

    document.body.appendChild(printContainer)

    // Renderizar o pedido usando React
    const root = createRoot(printContainer)

    root.render(
      <div id={`print-wrapper-${order.id}`} style={{ width: "80mm", display: "block", visibility: "visible", opacity: "1" }}>
        <div className="print-receipt" style={{ display: "block", visibility: "visible", position: "relative", opacity: "1" }}>
          <PrintOrderReceipt order={order} restaurantInfo={restaurantInfo} />
        </div>
      </div>
    )

    // Adicionar estilos de impressão temporários (mesma estrutura dos pedidos normais)
    const style = document.createElement("style")
    style.id = `print-styles-${order.id}`
    style.innerHTML = `
      /* Forçar visibilidade antes da impressão */
      #print-container-${order.id} {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      #print-container-${order.id} .hidden {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      #print-container-${order.id} .print-receipt,
      #print-container-${order.id} .print-kitchen,
      #print-container-${order.id} .print-customer {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      #print-container-${order.id} * {
        visibility: visible !important;
        opacity: 1 !important;
      }
      @media print {
        /* Ocultar tudo do body */
        body * { 
          visibility: hidden !important; 
        }
        body {
          margin: 0 !important;
          padding: 0 !important;
        }
        /* Tornar visível apenas o container de impressão e seu conteúdo */
        #print-container-${order.id} { 
          position: relative !important; 
          left: auto !important; 
          top: auto !important; 
          width: 80mm !important;
          max-width: 80mm !important;
          margin: 0 auto !important;
          padding: 0 !important;
          visibility: visible !important;
          display: block !important;
          opacity: 1 !important;
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
          page-break-before: avoid !important;
          break-inside: avoid !important;
          break-after: avoid !important;
          break-before: avoid !important;
        }
        #print-container-${order.id} *, 
        #print-container-${order.id} .print-kitchen,
        #print-container-${order.id} .print-kitchen *,
        #print-container-${order.id} .print-receipt,
        #print-container-${order.id} .print-receipt *,
        #print-container-${order.id} .print-customer,
        #print-container-${order.id} .print-customer *,
        #print-container-${order.id} .hidden { 
          visibility: visible !important; 
          display: block !important;
          opacity: 1 !important;
        }
        #print-container-${order.id} .print-receipt,
        #print-container-${order.id} .print-kitchen,
        #print-container-${order.id} .print-customer {
          position: relative !important;
          left: auto !important;
          top: auto !important;
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
          page-break-before: avoid !important;
          break-inside: avoid !important;
          break-after: avoid !important;
          break-before: avoid !important;
          max-height: 100vh !important;
          height: auto !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        @page {
          size: 80mm auto !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        /* Ocultar qualquer elemento fora do container de impressão */
        body > *:not(#print-container-${order.id}) {
          display: none !important;
          visibility: hidden !important;
        }
      }
    `
    document.head.appendChild(style)

    // Função para verificar se o conteúdo foi renderizado
    const checkContentReady = (attempts = 0): void => {
      const maxAttempts = 30 // 15 segundos no total
      const receiptElement = printContainer.querySelector(".print-receipt")
      const hasContent = receiptElement && receiptElement.textContent && receiptElement.textContent.trim().length > 0
      const hasOrderItems = receiptElement && receiptElement.querySelector(".space-y-2") && receiptElement.querySelector(".space-y-2")!.children.length > 0

      if ((hasContent && hasOrderItems) || attempts >= maxAttempts) {
        // Mover o container para a posição correta antes de imprimir
        printContainer.style.position = "relative"
        printContainer.style.left = "auto"
        printContainer.style.top = "auto"
        printContainer.style.visibility = "visible"
        printContainer.style.opacity = "1"
        printContainer.style.display = "block"
        
        // Forçar visibilidade de todos os elementos e remover classe hidden
        const allElements = printContainer.querySelectorAll("*")
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement
          htmlEl.style.visibility = "visible"
          htmlEl.style.opacity = "1"
          htmlEl.style.display = htmlEl.classList.contains("print-receipt") ? "block" : htmlEl.style.display || ""
          htmlEl.classList.remove("hidden")
        })

        // Garantir que o elemento de impressão está visível
        if (receiptElement) {
          const receiptHtml = receiptElement as HTMLElement
          receiptHtml.style.display = "block"
          receiptHtml.style.visibility = "visible"
          receiptHtml.style.opacity = "1"
          receiptHtml.classList.remove("hidden")
        }

        // Aguardar múltiplos frames para garantir renderização completa
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Verificar novamente se o conteúdo está visível
              const finalCheck = printContainer.querySelector(".print-receipt")
              if (finalCheck) {
                (finalCheck as HTMLElement).style.display = "block"
                ;(finalCheck as HTMLElement).style.visibility = "visible"
                ;(finalCheck as HTMLElement).style.opacity = "1"
              }

              // Pequeno delay adicional antes de imprimir
              setTimeout(() => {
                // Imprimir
                window.print()
                
                // Limpar após impressão
                setTimeout(() => {
                  if (printContainer.parentNode) {
                    document.body.removeChild(printContainer)
                  }
                  const styleElement = document.getElementById(`print-styles-${order.id}`)
                  if (styleElement && styleElement.parentNode) {
                    document.head.removeChild(styleElement)
                  }
                  root.unmount()
                }, 1000)
              }, 200)
            })
          })
        })
      } else {
        // Tentar novamente após 500ms
        setTimeout(() => checkContentReady(attempts + 1), 500)
      }
    }

    // Iniciar verificação após um pequeno delay inicial para dar tempo ao React renderizar
    setTimeout(() => checkContentReady(), 500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Balcão Self-Service</h1>
          <p className="text-slate-600 mt-1">Pedidos montados pelo cliente e vendidos por peso</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-slate-600">Total do Pedido</p>
            <p className="text-2xl font-bold text-slate-900">R$ {totalPrice.toFixed(2).replace(".", ",")}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Área principal - Adicionar item do balcão e cardápio */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Balcão Self-Service</h2>
                  <p className="text-slate-600">
                    Adicione itens montados pelo cliente no balcão. Cada item será pesado e calculado pelo preço por kg.
                  </p>
                </div>
                <Button
                  onClick={handleAddBalcaoItem}
                  className="w-full bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-700 hover:to-slate-600"
                  size="lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Adicionar Item do Balcão
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Seção de Cardápio */}
          {categories && categories.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Cardápio</h2>
                    <p className="text-slate-600 mb-4">
                      Selecione itens do cardápio para adicionar ao pedido.
                    </p>
                    {/* Barra de pesquisa */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Pesquisar produtos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      />
                      {searchTerm && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                          onClick={() => setSearchTerm("")}
                        >
                          <X className="h-4 w-4 text-slate-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {filteredCategories.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {filteredCategories.map((category) =>
                        category.products && category.products.length > 0
                          ? category.products.map((product: Product) => (
                              <Button
                                key={product.id}
                                onClick={() => {
                                  setSelectedProduct(product)
                                  setIsProductModalOpen(true)
                                }}
                                variant="outline"
                                className="h-auto p-4 flex flex-col items-start text-left hover:bg-slate-50"
                              >
                                <div className="font-semibold text-sm text-slate-900">{product.name}</div>
                                {product.description && (
                                  <div className="text-xs text-slate-600 mt-1 line-clamp-2">{product.description}</div>
                                )}
                                <div className="text-sm font-bold text-slate-900 mt-2">
                                  R$ {product.price.toFixed(2).replace(".", ",")}
                                </div>
                              </Button>
                            ))
                          : null
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <p>Nenhum produto encontrado para "{searchTerm}"</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Carrinho e informações */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="table">Mesa / Balcão</Label>
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger id="table">
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

                <div>
                  <Label htmlFor="customerName">Nome do Cliente</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nome completo do cliente"
                  />
                </div>

                <div>
                  <Label htmlFor="customerPhone">Telefone (opcional)</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <Label htmlFor="customerAddress">Endereço (opcional)</Label>
                  <Input
                    id="customerAddress"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Endereço completo"
                  />
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observações do pedido"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-slate-900">Carrinho</h3>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-slate-600" />
                  <span className="text-sm text-slate-600">{totalItems} itens</span>
                </div>
              </div>

              {cart.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">Carrinho vazio</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cart.map((item, index) => {
                    return (
                      <div key={`cart-item-${index}`} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-slate-900">{item.name}</p>
                            {item.weight && (
                              <>
                                <p className="text-xs text-slate-600 font-medium mt-1">
                                  Peso: {item.weight.toFixed(3).replace(".", ",")} kg
                                </p>
                                <p className="text-xs text-slate-600 font-medium">
                                  Preço/kg: R$ {item.price.toFixed(2).replace(".", ",")}
                                </p>
                              </>
                            )}
                            {item.selectedVariety && (
                              <p className="text-xs text-slate-600 mt-1">
                                Tamanho: {item.selectedVariety.name}
                              </p>
                            )}
                            {item.selectedExtras && item.selectedExtras.length > 0 && (
                              <div className="text-xs text-slate-600 mt-1">
                                {item.selectedExtras.map((extraItem, idx) => (
                                  <p key={idx}>
                                    {extraItem.extra.name} {extraItem.quantity > 1 && `(x${extraItem.quantity})`}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeFromCart(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex-1" />
                          <p className="text-sm font-bold text-slate-900">
                            R$ {(item.finalPrice * item.quantity).toFixed(2).replace(".", ",")}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {cart.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-slate-900">Total:</span>
                    <span className="text-xl font-bold text-slate-900">R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <Button
                    onClick={handleCreateOrder}
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-700 hover:to-slate-600"
                  >
                    {isSubmitting ? (
                      "Criando pedido..."
                    ) : (
                      <>
                        <Package className="h-4 w-4 mr-2" />
                        Criar Pedido e Imprimir
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de seleção de produto do cardápio */}
      <ProductOptionsModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false)
          setSelectedProduct(null)
        }}
        product={selectedProduct}
        onAddToCart={handleAddProductToCart}
      />

      {/* Modal de peso e descrição do balcão */}
      <Dialog open={isWeightModalOpen} onOpenChange={setIsWeightModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Item do Balcão</DialogTitle>
            <DialogDescription>
              Informe o peso pesado na balança e o preço por kg. Descreva o que o cliente montou.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="description">Descrição do Item (opcional)</Label>
              <Input
                id="description"
                type="text"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Ex: Prato com salada, arroz, feijão e carne"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="pricePerKg">Preço por kg (R$)</Label>
              <Input
                id="pricePerKg"
                type="text"
                inputMode="decimal"
                value={pricePerKg}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9,.-]/g, "")
                  setPricePerKg(value)
                }}
                placeholder="0,00"
                className="text-lg"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="text"
                inputMode="decimal"
                value={productWeight}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9,.-]/g, "")
                  setProductWeight(value)
                }}
                placeholder="0,000"
                className="text-lg"
              />
            </div>
            {productWeight && pricePerKg && !isNaN(parseFloat(productWeight.replace(",", "."))) && !isNaN(parseFloat(pricePerKg.replace(",", "."))) && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Preço por kg:</span> R$ {parseFloat(pricePerKg.replace(",", ".")).toFixed(2).replace(".", ",")}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold">Peso:</span> {parseFloat(productWeight.replace(",", ".")).toFixed(3).replace(".", ",")} kg
                </p>
                <p className="text-base font-bold text-slate-900 mt-2">
                  Total: R$ {(parseFloat(pricePerKg.replace(",", ".")) * parseFloat(productWeight.replace(",", "."))).toFixed(2).replace(".", ",")}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsWeightModalOpen(false)
                setProductWeight("")
                setProductDescription("")
                setPricePerKg("")
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddWithWeight}
              disabled={
                !productWeight || 
                !pricePerKg ||
                isNaN(parseFloat(productWeight.replace(",", "."))) || 
                parseFloat(productWeight.replace(",", ".")) <= 0 ||
                isNaN(parseFloat(pricePerKg.replace(",", "."))) || 
                parseFloat(pricePerKg.replace(",", ".")) <= 0
              }
              className="w-full sm:w-auto bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-700 hover:to-slate-600"
            >
              Adicionar ao Carrinho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

