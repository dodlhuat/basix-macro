export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (to.path === '/onboarding') return

  const userStore = useUserStore()
  if (!userStore.isOnboarded) {
    await userStore.loadUser()
  }

  if (!userStore.isOnboarded) {
    return navigateTo('/onboarding')
  }
})
