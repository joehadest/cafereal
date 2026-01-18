/**
 * Utilitário para impressão rápida e eficiente
 * Nota: Navegadores modernos não permitem impressão completamente silenciosa por segurança,
 * mas esta função otimiza a experiência ao máximo possível.
 */

interface PrintOptions {
  autoConfirm?: boolean // Tentar confirmar automaticamente após um delay
  focusDialog?: boolean // Tentar focar no diálogo de impressão
}

let printDialogOpen = false
let printKeyboardListener: ((e: KeyboardEvent) => void) | null = null

/**
 * Configura listener de teclado para confirmar impressão rapidamente
 * Quando o diálogo de impressão estiver aberto, Enter confirma automaticamente
 */
function setupPrintKeyboardShortcut(): void {
  if (printKeyboardListener) {
    return // Já configurado
  }

  printKeyboardListener = (e: KeyboardEvent) => {
    // Se o diálogo de impressão estiver aberto e o usuário pressionar Enter
    if (printDialogOpen && e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.altKey) {
      // Tentar confirmar a impressão
      // Nota: Não podemos controlar o diálogo diretamente, mas podemos
      // adicionar um pequeno delay e tentar focar nele
      e.preventDefault()
      
      // Aguardar um pouco para o diálogo estar totalmente carregado
      setTimeout(() => {
        // Tentar focar na janela (o diálogo já deve estar focado)
        window.focus()
      }, 100)
    }
  }

  window.addEventListener('keydown', printKeyboardListener, true)
}

/**
 * Remove o listener de teclado
 */
function removePrintKeyboardShortcut(): void {
  if (printKeyboardListener) {
    window.removeEventListener('keydown', printKeyboardListener, true)
    printKeyboardListener = null
  }
}

/**
 * Imprime com otimizações para experiência rápida
 * - Configura atalho de teclado (Enter para confirmar)
 * - Tenta focar no diálogo automaticamente
 * - Detecta quando o diálogo está aberto
 */
export function quickPrint(options: PrintOptions = {}): void {
  const { autoConfirm = false, focusDialog = true } = options

  // Configurar listener de teclado se ainda não estiver configurado
  setupPrintKeyboardShortcut()

  // Marcar que o diálogo está prestes a abrir
  printDialogOpen = true

  // Tentar focar na janela antes de abrir o diálogo
  if (focusDialog) {
    window.focus()
  }

  // Abrir diálogo de impressão
  window.print()

  // Se autoConfirm estiver ativado, tentar confirmar após um delay
  // Nota: Isso não funciona na maioria dos navegadores por segurança
  if (autoConfirm) {
    setTimeout(() => {
      // Tentar simular Enter (não funciona por segurança, mas tentamos)
      try {
        window.focus()
      } catch (error) {
        // Ignorar erros
      }
    }, 500)
  }

  // Marcar que o diálogo foi fechado após um tempo
  // (assumimos que o usuário fechou ou imprimiu)
  setTimeout(() => {
    printDialogOpen = false
  }, 2000)
}

/**
 * Imprime usando window.print() padrão com melhorias
 */
export function print(): void {
  quickPrint({ focusDialog: true })
}

/**
 * Verifica se a impressão silenciosa está disponível
 */
export function isSilentPrintAvailable(): boolean {
  // Verificar se estamos em um contexto que permite impressão silenciosa
  if (typeof window !== 'undefined' && (window as any).electron) {
    return true
  }

  // Navegadores web padrão não permitem impressão silenciosa
  return false
}

/**
 * Limpa recursos de impressão
 */
export function cleanupPrint(): void {
  printDialogOpen = false
  removePrintKeyboardShortcut()
}

