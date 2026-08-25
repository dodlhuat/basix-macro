import { useIntervalFn, useOnline } from '@vueuse/core'

const SYNC_INTERVAL_MS = 5 * 60 * 1000

export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  const syncStore = useSyncStore()
  const online = useOnline()

  syncStore.hydrate()

  function syncIfDue() {
    if (authStore.isAuthenticated && online.value && !syncStore.isSyncing) {
      void syncStore.syncNow()
    }
  }

  useIntervalFn(syncIfDue, SYNC_INTERVAL_MS)
  watch(online, isOnline => isOnline && syncIfDue())
})
