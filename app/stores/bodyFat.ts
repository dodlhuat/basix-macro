import { defineStore } from 'pinia'
import type { BodyFatEntry } from '../../db'

export type NewBodyFatEntry = Omit<BodyFatEntry, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'deleted_at'>

export const useBodyFatStore = defineStore('bodyFat', () => {
  const entries = ref<BodyFatEntry[]>([])

  async function loadEntries(): Promise<void> {
    const { db } = await import('../../db')
    entries.value = await db.body_fat_entries
      .orderBy('date')
      .reverse()
      .filter(e => !e.deleted_at)
      .toArray()
  }

  async function addEntry(input: NewBodyFatEntry): Promise<string> {
    const { db } = await import('../../db')
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    await db.body_fat_entries.add({
      ...input,
      id,
      created_at: now,
      updated_at: now,
      sync_status: 'local',
    })
    await loadEntries()
    return id
  }

  async function deleteEntry(id: string): Promise<void> {
    const { db } = await import('../../db')
    const entry = await db.body_fat_entries.get(id)
    if (!entry) return
    const now = new Date().toISOString()
    await db.body_fat_entries.put(markDeleted(entry, now))
    entries.value = entries.value.filter(e => e.id !== id)
  }

  const latestEntry = computed(() =>
    entries.value.length ? entries.value[0] : null,
  )

  const chartData = computed(() =>
    [...entries.value]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-90),
  )

  return { entries, latestEntry, chartData, loadEntries, addEntry, deleteEntry }
})
