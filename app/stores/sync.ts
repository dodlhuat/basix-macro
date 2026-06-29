import { defineStore } from 'pinia'

export const useSyncStore = defineStore('sync', () => {
  const isSyncing = ref(false)
  const lastSyncedAt = ref<string | null>(null)
  const pendingCount = ref(0)
  const syncError = ref<string | null>(null)

  return { isSyncing, lastSyncedAt, pendingCount, syncError }
})
