import type { ToastType } from '@dodlhuat/basix/js/toast.js'

/**
 * Thin wrapper around the Basix Toast JS controller (fire-and-forget, no
 * live reactivity needed — unlike bottom sheets/modals, which are built as
 * Vue-native Teleports elsewhere in this app for reactive content).
 */
export function useToast() {
  async function showToast(message: string, type: ToastType = 'success', ms = 3200): Promise<void> {
    if (import.meta.server) return
    const { Toast } = await import('@dodlhuat/basix/js/toast.js')
    new Toast({ content: message, type, closeable: true }).show(ms)
  }

  return { showToast }
}
