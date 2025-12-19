"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Printer, Settings } from "lucide-react"

type PrintType = "kitchen" | "customer" | "receipt" | "none"

interface AutoPrintSettings {
  enabled: boolean
  printType: PrintType
  printOnNewOrder: boolean
  printOnStatusChange: boolean
}

const DEFAULT_SETTINGS: AutoPrintSettings = {
  enabled: false,
  printType: "kitchen",
  printOnNewOrder: true,
  printOnStatusChange: false,
}

export function AutoPrintSettings() {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<AutoPrintSettings>(DEFAULT_SETTINGS)

  // Carregar configurações do localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("autoPrintSettings")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setSettings({ ...DEFAULT_SETTINGS, ...parsed })
        } catch (e) {
          console.warn("Erro ao carregar configurações de impressão:", e)
        }
      }
    }
  }, [])

  // Salvar configurações no localStorage
  const saveSettings = (newSettings: AutoPrintSettings) => {
    setSettings(newSettings)
    if (typeof window !== "undefined") {
      localStorage.setItem("autoPrintSettings", JSON.stringify(newSettings))
      // Disparar evento para notificar outros componentes
      window.dispatchEvent(new CustomEvent("autoPrintSettingsChanged", { detail: newSettings }))
    }
  }

  const handleToggleEnabled = (enabled: boolean) => {
    saveSettings({ ...settings, enabled })
  }

  const handlePrintTypeChange = (printType: PrintType) => {
    saveSettings({ ...settings, printType })
  }

  const handlePrintOnNewOrderChange = (printOnNewOrder: boolean) => {
    saveSettings({ ...settings, printOnNewOrder })
  }

  const handlePrintOnStatusChange = (printOnStatusChange: boolean) => {
    saveSettings({ ...settings, printOnStatusChange })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-transparent text-xs sm:text-sm px-2 sm:px-3"
        >
          <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5 md:mr-2" />
          <span className="hidden sm:inline text-xs md:text-sm">Impressão Automática</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Impressão Automática
          </DialogTitle>
          <DialogDescription>
            Configure quando e qual tipo de impressão será realizada automaticamente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Ativar/Desativar */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-auto-print" className="text-base font-semibold">
                Ativar Impressão Automática
              </Label>
              <p className="text-sm text-slate-500">
                Quando ativado, os pedidos serão impressos automaticamente conforme as configurações abaixo.
              </p>
            </div>
            <Switch
              id="enable-auto-print"
              checked={settings.enabled}
              onCheckedChange={handleToggleEnabled}
            />
          </div>

          {settings.enabled && (
            <>
              {/* Tipo de Impressão */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Tipo de Impressão</Label>
                <RadioGroup value={settings.printType} onValueChange={handlePrintTypeChange}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="kitchen" id="kitchen" />
                    <Label htmlFor="kitchen" className="font-normal cursor-pointer">
                      Comanda da Cozinha
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer" id="customer" />
                    <Label htmlFor="customer" className="font-normal cursor-pointer">
                      Recibo do Cliente
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="receipt" id="receipt" />
                    <Label htmlFor="receipt" className="font-normal cursor-pointer">
                      Pedido Completo
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Quando Imprimir */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Quando Imprimir</Label>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="print-on-new-order" className="font-normal">
                      Ao criar novo pedido
                    </Label>
                    <p className="text-xs text-slate-500">
                      Imprime automaticamente quando um novo pedido é criado.
                    </p>
                  </div>
                  <Switch
                    id="print-on-new-order"
                    checked={settings.printOnNewOrder}
                    onCheckedChange={handlePrintOnNewOrderChange}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="print-on-status-change" className="font-normal">
                      Ao mudar status do pedido
                    </Label>
                    <p className="text-xs text-slate-500">
                      Imprime automaticamente quando o status do pedido é alterado.
                    </p>
                  </div>
                  <Switch
                    id="print-on-status-change"
                    checked={settings.printOnStatusChange}
                    onCheckedChange={handlePrintOnStatusChange}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook para obter as configurações de impressão automática
export function useAutoPrintSettings(): AutoPrintSettings {
  const [settings, setSettings] = useState<AutoPrintSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loadSettings = () => {
        const saved = localStorage.getItem("autoPrintSettings")
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            setSettings({ ...DEFAULT_SETTINGS, ...parsed })
          } catch (e) {
            console.warn("Erro ao carregar configurações de impressão:", e)
          }
        }
      }

      loadSettings()

      // Escutar mudanças nas configurações
      window.addEventListener("autoPrintSettingsChanged", loadSettings)
      return () => {
        window.removeEventListener("autoPrintSettingsChanged", loadSettings)
      }
    }
  }, [])

  return settings
}

