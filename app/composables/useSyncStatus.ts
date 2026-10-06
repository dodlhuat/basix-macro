import { useOnline } from '@vueuse/core'
import { deriveSyncIndicatorState } from '../utils/syncStatus'

/** Reactive state for the header sync indicator and its detail sheet. */
export function useSyncStatus() {
  const authStore = useAuthStore()
  const syncStore = useSyncStore()
  const online = useOnline()

  const state = computed(() =>
    deriveSyncIndicatorState({
      authenticated: authStore.isAuthenticated,
      online: online.value,
      isSyncing: syncStore.isSyncing,
      pendingCount: syncStore.pendingCount,
      syncError: syncStore.syncError,
    }),
  )

  return {
    state,
    online,
    pendingCount: computed(() => syncStore.pendingCount),
    lastSyncedAt: computed(() => syncStore.lastSyncedAt),
    syncError: computed(() => syncStore.syncError),
    isSyncing: computed(() => syncStore.isSyncing),
    syncNow: () => syncStore.syncNow(),
  }
}
