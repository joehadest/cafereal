import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-stone-50">
      <div className="w-full max-w-sm">
        <Card className="border-slate-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-slate-900">Conta Criada com Sucesso!</CardTitle>
            <CardDescription className="text-slate-700">Verifique seu email para confirmar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-800">
              Você criou sua conta com sucesso. Por favor, verifique seu email para confirmar sua conta antes de fazer
              login.
            </p>
            <Button asChild className="w-full bg-slate-600 hover:bg-slate-700">
              <Link href="/auth/login">Ir para Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
