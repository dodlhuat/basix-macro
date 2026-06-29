export function usePushMenu() {
  async function initPushMenu() {
    if (import.meta.server) return
    const { PushMenu } = await import('@dodlhuat/basix/js/push-menu.js')
    try { PushMenu.init() } catch { /* .navigation not present — toggle is handled via Vue */ }
  }

  async function open() {
    if (import.meta.server) return
    const { PushMenu } = await import('@dodlhuat/basix/js/push-menu.js')
    PushMenu.open()
  }

  async function close() {
    if (import.meta.server) return
    const { PushMenu } = await import('@dodlhuat/basix/js/push-menu.js')
    PushMenu.close()
  }

  async function toggle() {
    if (import.meta.server) return
    const { PushMenu } = await import('@dodlhuat/basix/js/push-menu.js')
    PushMenu.pushToggle()
  }

  return { initPushMenu, open, close, toggle }
}
