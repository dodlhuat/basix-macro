import { useIntervalFn, useOnline } from '@vueuse/core'
import { liveQuery } from 'dexie'
import { countPendingChanges } from '~/composables/useSyncEngine'

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

  // Keep pendingCount live: local writes (which flip rows to local/dirty) must show up in
  // the header indicator immediately, not only after the next sync run.
  void import('../../db').then(({ db }) => {
    liveQuery(() => countPendingChanges(db)).subscribe({
      next: (count) => { syncStore.pendingCount = count },
      error: () => { /* indicator is best-effort; sync itself recomputes the count */ },
    })
  })
})
