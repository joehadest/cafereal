"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Mail, CheckCircle } from "lucide-react"

export default function SignUpSuccessPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-stone-50 to-purple-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-2 border-purple-200 shadow-xl animate-in fade-in zoom-in duration-500">
        <CardHeader className="space-y-4 bg-gradient-to-br from-purple-50 to-stone-50 text-center">
          <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-purple-900">Conta Criada!</CardTitle>
          <CardDescription className="text-purple-700 text-base">
            Verifique seu email para confirmar sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Confirme seu email</p>
              <p>Enviamos um link de confirmação para seu email. Clique no link para ativar sua conta e fazer login.</p>
            </div>
          </div>
          <Button
            onClick={() => router.push("/")}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Voltar ao Cardápio
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
