const SKIP_PATHS = ['/onboarding', '/login', '/forgot-password', '/reset-password']

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (SKIP_PATHS.includes(to.path)) return

  const userStore = useUserStore()
  if (!userStore.isOnboarded) {
    await userStore.loadUser()
  }

  if (!userStore.isOnboarded) {
    return navigateTo('/onboarding')
  }
})
