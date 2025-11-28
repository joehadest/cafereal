"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { User, MapPin, Plus, Trash2, ArrowLeft, Home, Phone, Edit2, Save, X } from "lucide-react"

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [addresses, setAddresses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
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
    // Verificação rápida inicial antes de carregar tudo
    const quickCheck = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Verifica rapidamente se é admin sem perfil de cliente
        const { data: adminProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle()

        if (adminProfile) {
          const { data: customerProfile } = await supabase
            .from("customer_profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle()

          if (!customerProfile) {
            setIsRedirecting(true)
            window.location.href = "/admin"
            return
          }
        }
      }

      // Se passou pela verificação rápida, carrega o perfil completo
    loadProfile()
    }

    quickCheck()
  }, [])

  const loadProfile = async () => {
    try {
    const supabase = createClient()
    const {
      data: { user },
        error: userError,
    } = await supabase.auth.getUser()

      console.log("[Profile] User check:", { user: user?.id, error: userError })

    if (!user) {
        console.log("[Profile] No user, redirecting to login")
        setIsRedirecting(true)
        window.location.href = "/customer/login"
      return
    }

      // Verifica primeiro se é admin (para redirecionar imediatamente)
      const { data: adminProfile, error: adminError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      console.log("[Profile] Admin check:", { adminProfile, error: adminError })

      // Se for admin, verifica se também tem perfil de cliente
      if (adminProfile) {
        const { data: customerProfile } = await supabase
          .from("customer_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()

        // Se não tem perfil de cliente, redireciona imediatamente para admin
        if (!customerProfile) {
          console.log("[Profile] User is admin but no customer profile, redirecting to /admin")
          setIsRedirecting(true)
          // Usa window.location para redirecionamento imediato sem flash
          window.location.href = "/admin"
          return
        }
        // Se tem perfil de cliente também, continua para mostrar o perfil de cliente
      }

      // Busca na tabela customer_profiles (prioridade para cliente)
      const { data: profileData, error: profileError } = await supabase
        .from("customer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

      console.log("[Profile] Customer profile check:", { profileData, error: profileError, userId: user.id })

      // Se encontrou perfil de cliente, usa ele (mesmo que também seja admin)
    if (profileData) {
        console.log("[Profile] Customer profile found, loading addresses")
      setProfile(profileData)
        setEditData({ full_name: profileData.full_name || "", phone: profileData.phone || "" })

        const { data: addressesData, error: addressesError } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", profileData.id)
        .order("is_default", { ascending: false })

        if (addressesError) {
          console.error("[Profile] Error loading addresses:", addressesError)
        }

      if (addressesData) {
          console.log("[Profile] Addresses loaded:", addressesData.length)
        setAddresses(addressesData)
      }
        setIsLoading(false)
        return
      }

      console.log("[Profile] Customer profile check:", { profileData, error: profileError, userId: user.id })

      // Se chegou aqui, não tem perfil de cliente
      // Se for admin, já foi redirecionado acima
      // Se não for admin, tenta criar um perfil básico
      if (profileError) {
        console.error("[Profile] Error loading customer profile:", profileError)
      }

      // Só tenta criar perfil se não for admin (admin já foi redirecionado)
      if (!adminProfile) {
        console.log("[Profile] No customer profile found for user, attempting to create one")
        const { data: newProfile, error: createError } = await supabase
          .from("customer_profiles")
          .insert({
            id: user.id,
            user_id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
            phone: "",
          })
          .select()
          .single()

        if (createError) {
          console.error("[Profile] Error creating profile:", createError)
          // Se não conseguir criar, deixa como null para mostrar a mensagem
        } else if (newProfile) {
          console.log("[Profile] Profile created successfully")
          setProfile(newProfile)
          setEditData({ full_name: newProfile.full_name || "", phone: newProfile.phone || "" })
        }
      }
    } catch (error) {
      console.error("[Profile] Unexpected error:", error)
    } finally {
    setIsLoading(false)
    }
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

  // Se está redirecionando, não mostra nada
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-slate-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-700 font-medium">Redirecionando...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-slate-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-700 font-medium">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!profile && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md border-2 border-slate-200">
          <CardHeader className="bg-gradient-to-br from-slate-50 to-stone-50">
            <CardTitle className="text-2xl text-slate-900">Perfil não encontrado</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <p className="text-slate-700">
              Você ainda não completou seu cadastro. Por favor, complete suas informações para continuar.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Dica:</strong> Se você já se cadastrou, pode ser que seu perfil não tenha sido criado corretamente. 
                Tente fazer logout e login novamente, ou complete o cadastro abaixo.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => router.push("/customer/sign-up")}
                className="bg-slate-600 hover:bg-slate-700 w-full"
              >
                Completar Cadastro
              </Button>
              <Button variant="outline" onClick={() => router.push("/")} className="border-slate-300 w-full">
                Voltar ao Cardápio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-slate-50 py-4 px-3 sm:py-8 sm:px-6 overflow-x-hidden">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="font-medium">Voltar ao Cardápio</span>
        </Button>

        <Card className="border-2 border-slate-200 shadow-lg overflow-hidden transition-shadow hover:shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-500 p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl text-white flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-2 bg-white/20 rounded-lg">
                <User className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <span className="font-bold truncate">Meus Dados</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {isEditing ? (
              <>
                <div className="grid gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-900 font-semibold text-sm flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-600" />
                      Nome Completo
                    </Label>
                    <Input
                      id="name"
                      value={editData.full_name}
                      onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                      className="border-2 border-slate-200 focus:border-slate-500 transition-colors h-11"
                      placeholder="Digite seu nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-900 font-semibold text-sm flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-600" />
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="border-2 border-slate-200 focus:border-slate-500 transition-colors h-11"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3 pt-2">
                  <Button
                    onClick={handleUpdateProfile}
                    className="bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-700 hover:to-slate-600 flex-1 sm:flex-none h-11 font-semibold shadow-md transition-all"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="border-2 border-slate-300 hover:bg-slate-50 flex-1 sm:flex-none h-11 font-semibold transition-colors"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:gap-6">
                  <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-slate-600" />
                      <p className="text-xs sm:text-sm text-slate-700 font-medium uppercase tracking-wide">Nome</p>
                    </div>
                    <p className="font-bold text-slate-900 text-base sm:text-lg break-words truncate max-w-full">{profile?.full_name}</p>
                  </div>
                  <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="h-4 w-4 text-slate-600" />
                      <p className="text-xs sm:text-sm text-slate-700 font-medium uppercase tracking-wide">Telefone</p>
                    </div>
                    <p className="font-bold text-slate-900 text-base sm:text-lg break-words truncate max-w-full">{profile?.phone}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-700 hover:to-slate-600 w-full sm:w-auto h-11 font-semibold shadow-md transition-all"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar Dados
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 border-slate-200 shadow-lg overflow-hidden transition-shadow hover:shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-500 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-xl sm:text-2xl text-white flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                  <Home className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="font-bold truncate">Meus Endereços</span>
              </CardTitle>
              <Button
                onClick={() => setShowNewAddress(!showNewAddress)}
                size="sm"
                className="bg-white text-slate-600 hover:bg-slate-50 flex-shrink-0 h-9 sm:h-10 font-semibold shadow-md transition-all"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Adicionar</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {showNewAddress && (
              <Card className="border-2 border-slate-300 bg-gradient-to-br from-slate-50 to-stone-50 shadow-md">
                <CardContent className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <MapPin className="h-5 w-5 text-slate-600" />
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">Novo Endereço</h3>
                  </div>
                  <div className="grid gap-3 sm:gap-4">
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <Label className="text-xs font-semibold text-slate-900 mb-1.5 block">Rua</Label>
                        <Input
                          placeholder="Nome da rua"
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          className="border-2 border-slate-200 focus:border-slate-500 h-10 transition-colors"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-slate-900 mb-1.5 block">Número</Label>
                        <Input
                          placeholder="Nº"
                          value={newAddress.number}
                          onChange={(e) => setNewAddress({ ...newAddress, number: e.target.value })}
                          className="border-2 border-slate-200 focus:border-slate-500 h-10 transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-900 mb-1.5 block">
                        Complemento <span className="text-slate-500 font-normal">(opcional)</span>
                      </Label>
                      <Input
                        placeholder="Apto, bloco, etc."
                        value={newAddress.complement}
                        onChange={(e) => setNewAddress({ ...newAddress, complement: e.target.value })}
                        className="border-2 border-slate-200 focus:border-slate-500 h-10 transition-colors"
                      />
                    </div>
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs font-semibold text-slate-900 mb-1.5 block">Bairro</Label>
                        <Input
                          placeholder="Nome do bairro"
                          value={newAddress.neighborhood}
                          onChange={(e) => setNewAddress({ ...newAddress, neighborhood: e.target.value })}
                          className="border-2 border-slate-200 focus:border-slate-500 h-10 transition-colors"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-slate-900 mb-1.5 block">Cidade</Label>
                        <Input
                          placeholder="Nome da cidade"
                          value={newAddress.city}
                          onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                          className="border-2 border-slate-200 focus:border-slate-500 h-10 transition-colors"
                        />
                      </div>
                    </div>
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs font-semibold text-slate-900 mb-1.5 block">Estado</Label>
                        <Input
                          placeholder="UF"
                          maxLength={2}
                          value={newAddress.state}
                          onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value.toUpperCase() })}
                          className="border-2 border-slate-200 focus:border-slate-500 h-10 transition-colors uppercase"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold text-slate-900 mb-1.5 block">CEP</Label>
                        <Input
                          placeholder="00000-000"
                          value={newAddress.zip_code}
                          onChange={(e) => setNewAddress({ ...newAddress, zip_code: e.target.value })}
                          className="border-2 border-slate-200 focus:border-slate-500 h-10 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:gap-3 pt-2">
                    <Button
                      onClick={handleAddAddress}
                      className="bg-gradient-to-r from-slate-600 to-slate-500 hover:from-slate-700 hover:to-slate-600 flex-1 sm:flex-none h-10 font-semibold shadow-md transition-all"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Endereço
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowNewAddress(false)}
                      className="border-2 border-slate-300 hover:bg-slate-50 flex-1 sm:flex-none h-10 font-semibold transition-colors"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {addresses.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                  <MapPin className="h-8 w-8 text-slate-600" />
                </div>
                <p className="text-slate-700 font-medium text-sm sm:text-base">Nenhum endereço cadastrado</p>
                <p className="text-slate-600 text-xs sm:text-sm mt-1">Adicione um endereço para continuar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {addresses.map((address) => (
                  <Card
                    key={address.id}
                    className="border-2 border-slate-200 hover:border-slate-400 transition-all hover:shadow-md bg-white"
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                          <div className="p-1.5 sm:p-2 bg-slate-100 rounded-lg flex-shrink-0 mt-0.5">
                            <MapPin className="h-4 w-4 text-slate-600" />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="font-bold text-slate-900 text-sm leading-tight break-words">
                              {address.street}, {address.number}
                            </p>
                            {address.complement && (
                              <p className="text-xs text-slate-700 break-words leading-relaxed">{address.complement}</p>
                            )}
                            <p className="text-xs text-slate-700 break-words leading-relaxed">
                              {address.neighborhood}, {address.city} - {address.state}
                            </p>
                            <p className="text-xs text-slate-600 font-medium">CEP: {address.zip_code}</p>
                            {address.is_default && (
                              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-gradient-to-r from-slate-600 to-slate-500 text-white text-xs font-bold rounded-full shadow-sm">
                                <Home className="h-3 w-3" />
                                Padrão
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDeleteAddress(address.id)}
                          size="icon"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 self-end sm:self-start transition-colors"
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
