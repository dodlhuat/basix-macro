import { defineStore } from 'pinia'

const STORAGE_KEY = 'basixmacro.sync'

export const useSyncStore = defineStore('sync', () => {
  const isSyncing = ref(false)
  const lastSyncedAt = ref<string | null>(null)
  const pendingCount = ref(0)
  const syncError = ref<string | null>(null)

  function persist() {
    if (!import.meta.client) return
    if (lastSyncedAt.value) {
      localStorage.setItem(STORAGE_KEY, lastSyncedAt.value)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  function hydrate() {
    if (!import.meta.client) return
    lastSyncedAt.value = localStorage.getItem(STORAGE_KEY)
  }

  function setLastSyncedAt(value: string) {
    lastSyncedAt.value = value
    persist()
  }

  async function syncNow(options: { full?: boolean } = {}) {
    return performSync(options)
  }

  return { isSyncing, lastSyncedAt, pendingCount, syncError, hydrate, setLastSyncedAt, syncNow }
})
