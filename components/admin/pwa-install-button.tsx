"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    // Verificar se está em modo standalone (PWA instalado)
    if ((window.navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    // Escutar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Mostrar banner após 3 segundos se ainda não foi instalado
      setTimeout(() => {
        setShowBanner(true)
      }, 3000)
    }

    // Escutar evento appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      setShowBanner(false)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return
    }

    // Mostrar prompt de instalação
    await deferredPrompt.prompt()

    // Aguardar resposta do usuário
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      setIsInstalled(true)
      setShowBanner(false)
    }

    // Limpar o prompt
    setDeferredPrompt(null)
  }

  // Não mostrar nada se já estiver instalado
  if (isInstalled) {
    return null
  }

  // Não mostrar se não houver prompt disponível
  if (!deferredPrompt && !showBanner) {
    return null
  }

  return (
    <>
      {showBanner && deferredPrompt && (
        <div className="fixed bottom-4 right-4 z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-4 max-w-sm animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">Instalar App</h3>
              <p className="text-sm text-slate-600 mb-3">
                Instale o painel admin como aplicativo para acesso rápido e melhor experiência.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="bg-slate-600 hover:bg-slate-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Instalar
                </Button>
                <Button
                  onClick={() => setShowBanner(false)}
                  size="sm"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!showBanner && deferredPrompt && (
        <Button
          onClick={handleInstallClick}
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 shadow-lg"
        >
          <Download className="h-4 w-4 mr-2" />
          Instalar App
        </Button>
      )}
    </>
  )
}

