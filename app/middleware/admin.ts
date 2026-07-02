export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  if (!authStore.isAuthenticated || !authStore.isAdmin) {
    return navigateTo('/settings')
  }
})
