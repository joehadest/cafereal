import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Detecta se o dispositivo é móvel (iOS, Android, etc.)
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = window.navigator.userAgent.toLowerCase()
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
  
  // Verificar também pela largura da tela (dispositivos móveis geralmente têm largura < 768px)
  const isMobileWidth = window.innerWidth < 768
  
  return mobileRegex.test(userAgent) || isMobileWidth
}

/**
 * Detecta se é iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = window.navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(userAgent)
}

/**
 * Detecta se é Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = window.navigator.userAgent.toLowerCase()
  return /android/.test(userAgent)
}

/**
 * Abre o WhatsApp com uma mensagem formatada
 * Funciona em todos os dispositivos (iOS, Android, Desktop)
 * 
 * @param phoneNumber - Número do WhatsApp (pode conter formatação)
 * @param message - Mensagem a ser enviada
 * @param options - Opções adicionais
 */
export function openWhatsApp(
  phoneNumber: string,
  message: string = '',
  options: {
    openInNewTab?: boolean
    fallbackToWeb?: boolean
  } = {}
): void {
  try {
    // Limpar número do WhatsApp (remover caracteres não numéricos)
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    
    if (!cleanPhone || cleanPhone.length < 10) {
      console.error('Número de WhatsApp inválido:', phoneNumber)
      alert('Número de WhatsApp inválido. Por favor, verifique o número configurado.')
      return
    }
    
    // Codificar a mensagem para URL
    const encodedMessage = encodeURIComponent(message)
    
    // Construir URL do WhatsApp
    const whatsappUrl = `https://wa.me/${cleanPhone}${message ? `?text=${encodedMessage}` : ''}`
    
    const isMobile = isMobileDevice()
    const { openInNewTab = false, fallbackToWeb = true } = options
    
    if (isMobile) {
      // Em dispositivos móveis, usar window.location.href para abrir diretamente no app
      // Se o app não estiver instalado, o WhatsApp Web será aberto automaticamente
      window.location.href = whatsappUrl
    } else {
      // Em desktop, usar window.open para abrir em nova aba
      // Se o usuário tiver WhatsApp Desktop instalado, pode abrir automaticamente
      const newWindow = window.open(whatsappUrl, openInNewTab ? '_blank' : '_self', 'noopener,noreferrer')
      
      // Se window.open falhar (bloqueado por popup blocker), tentar window.location.href
      if (!newWindow && fallbackToWeb) {
        window.location.href = whatsappUrl
      }
    }
  } catch (error) {
    console.error('Erro ao abrir WhatsApp:', error)
    alert('Erro ao abrir WhatsApp. Por favor, tente novamente.')
  }
}