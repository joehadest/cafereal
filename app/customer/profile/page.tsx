"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { User, MapPin, Plus, Trash2, ArrowLeft, Home } from "lucide-react"

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [addresses, setAddresses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [editData, setEditData] = useState({ full_name: "", phone: "" })
  const [newAddress, setNewAddress] = useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
  })
  const router = useRouter()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/customer/login")
      return
    }

    const { data: profileData } = await supabase.from("customer_profiles").select("*").eq("id", user.id).maybeSingle()

    if (profileData) {
      setProfile(profileData)
      setEditData({ full_name: profileData.full_name, phone: profileData.phone })

      const { data: addressesData } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", profileData.id)
        .order("is_default", { ascending: false })

      if (addressesData) {
        setAddresses(addressesData)
      }
    }

    setIsLoading(false)
  }

  const handleUpdateProfile = async () => {
    if (!profile) {
      alert("Erro: Perfil não encontrado. Por favor, complete seu cadastro primeiro.")
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("customer_profiles").update(editData).eq("id", profile.id)

    if (!error) {
      setProfile({ ...profile, ...editData })
      setIsEditing(false)
      alert("Perfil atualizado com sucesso!")
    } else {
      alert("Erro ao atualizar perfil")
    }
  }

  const handleAddAddress = async () => {
    if (!profile) {
      alert("Erro: Perfil não encontrado. Por favor, complete seu cadastro primeiro.")
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from("customer_addresses").insert({
      customer_id: profile.id,
      ...newAddress,
      is_default: addresses.length === 0,
    })

    if (!error) {
      loadProfile()
      setShowNewAddress(false)
      setNewAddress({
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "",
        zip_code: "",
      })
      alert("Endereço adicionado com sucesso!")
    } else {
      alert("Erro ao adicionar endereço")
    }
  }

  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Deseja realmente excluir este endereço?")) return

    const supabase = createClient()
    const { error } = await supabase.from("customer_addresses").delete().eq("id", id)

    if (!error) {
      loadProfile()
      alert("Endereço excluído com sucesso!")
    } else {
      alert("Erro ao excluir endereço")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-stone-50 to-purple-50 flex items-center justify-center">
        <div className="text-purple-700">Carregando...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-stone-50 to-purple-50 flex items-center justify-center p-6">
        <Card className="max-w-md border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-br from-purple-50 to-stone-50">
            <CardTitle className="text-2xl text-purple-900">Perfil não encontrado</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-purple-700">
              Você ainda não completou seu cadastro. Por favor, complete suas informações para continuar.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push("/customer/sign-up")}
                className="bg-purple-600 hover:bg-purple-700 flex-1"
              >
                Completar Cadastro
              </Button>
              <Button variant="outline" onClick={() => router.push("/")} className="border-purple-300 flex-1">
                Voltar ao Cardápio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-stone-50 to-purple-50 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="text-purple-700 hover:text-purple-900 hover:bg-purple-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Cardápio
        </Button>

        {/* Dados Pessoais */}
        <Card className="border-2 border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-br from-purple-50 to-stone-50 p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl text-purple-900 flex items-center gap-2">
              <User className="h-5 w-5 sm:h-6 sm:w-6" />
              Meus Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 space-y-4 p-4 sm:p-6">
            {isEditing ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-purple-900 text-sm">
                      Nome Completo
                    </Label>
                    <Input
                      id="name"
                      value={editData.full_name}
                      onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                      className="border-purple-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-purple-900 text-sm">
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="border-purple-200"
                    />
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={handleUpdateProfile}
                    className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none"
                  >
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="border-purple-300 flex-1 sm:flex-none"
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs sm:text-sm text-purple-700">Nome</p>
                    <p className="font-semibold text-purple-900 text-sm sm:text-base">{profile?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-purple-700">Telefone</p>
                    <p className="font-semibold text-purple-900 text-sm sm:text-base">{profile?.phone}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-purple-300 w-full sm:w-auto"
                >
                  Editar Dados
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Endereços */}
        <Card className="border-2 border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-br from-purple-50 to-stone-50 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-xl sm:text-2xl text-purple-900 flex items-center gap-2">
                <Home className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="truncate">Meus Endereços</span>
              </CardTitle>
              <Button
                onClick={() => setShowNewAddress(!showNewAddress)}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Adicionar</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 space-y-4 p-4 sm:p-6">
            {showNewAddress && (
              <Card className="border-purple-200 bg-purple-50/50">
                <CardContent className="pt-4 sm:pt-6 space-y-4 p-4 sm:p-6">
                  <h3 className="font-semibold text-purple-900 text-sm sm:text-base">Novo Endereço</h3>
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    <Input
                      placeholder="Rua"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      className="border-purple-200 text-sm"
                    />
                    <Input
                      placeholder="Número"
                      value={newAddress.number}
                      onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                      className="border-purple-200 text-sm"
                    />
                  </div>
                  <Input
                    placeholder="Complemento (opcional)"
                    value={newAddress.complement}
                    onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })}
                    className="border-purple-200 text-sm"
                  />
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    <Input
                      placeholder="Bairro"
                      value={newAddress.neighborhood}
                      onChange={(e) => setNewAddress({ ...newAddress, neighborhood: e.target.value })}
                      className="border-purple-200 text-sm"
                    />
                    <Input
                      placeholder="Cidade"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="border-purple-200 text-sm"
                    />
                  </div>
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    <Input
                      placeholder="Estado (UF)"
                      maxLength={2}
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value.toUpperCase() })}
                      className="border-purple-200 text-sm"
                    />
                    <Input
                      placeholder="CEP"
                      value={newAddress.zip_code}
                      onChange={(e) => setNewAddress({ ...newAddress, zip_code: e.target.value })}
                      className="border-purple-200 text-sm"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={handleAddAddress}
                      className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none"
                    >
                      Salvar Endereço
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewAddress(false)}
                      className="border-purple-300 flex-1 sm:flex-none"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {addresses.length === 0 ? (
              <p className="text-center text-purple-700 py-8 text-sm">Nenhum endereço cadastrado</p>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <Card key={address.id} className="border-purple-200">
                    <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mt-1 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-purple-900 text-sm sm:text-base break-words">
                              {address.street}, {address.number}
                              {address.complement && ` - ${address.complement}`}
                            </p>
                            <p className="text-xs sm:text-sm text-purple-700 break-words">
                              {address.neighborhood}, {address.city} - {address.state}
                            </p>
                            <p className="text-xs sm:text-sm text-purple-700">CEP: {address.zip_code}</p>
                            {address.is_default && (
                              <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                Padrão
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDeleteAddress(address.id)}
                          size="icon"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50 flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
