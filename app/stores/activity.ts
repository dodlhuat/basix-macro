import { defineStore } from 'pinia'
import type { ActivityEntry } from '../../db'

export const useActivityStore = defineStore('activity', () => {
  const entries = ref<ActivityEntry[]>([])

  async function loadEntries(): Promise<void> {
    const { db } = await import('../../db')
    entries.value = await db.activity_entries
      .orderBy('date')
      .reverse()
      .filter(a => !a.deleted_at)
      .toArray()
  }

  async function addEntry(name: string, calories_burned: number, date: string, duration_min?: number): Promise<string> {
    const { db } = await import('../../db')
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    await db.activity_entries.add({
      id,
      date,
      name,
      calories_burned,
      duration_min,
      created_at: now,
      updated_at: now,
      sync_status: 'local',
    })
    await loadEntries()
    return id
  }

  async function deleteEntry(id: string): Promise<void> {
    const { db } = await import('../../db')
    const entry = await db.activity_entries.get(id)
    if (!entry) return
    const now = new Date().toISOString()
    await db.activity_entries.put(markDeleted(entry, now))
    entries.value = entries.value.filter(e => e.id !== id)
  }

  const latestEntry = computed(() =>
    entries.value.length ? entries.value[0] : null,
  )

  /** Sum of calories burned on a given date — feeds the "effective" daily calorie budget. */
  function totalBurnedForDate(date: string): number {
    return entries.value
      .filter(e => e.date === date)
      .reduce((sum, e) => sum + e.calories_burned, 0)
  }

  return { entries, latestEntry, loadEntries, addEntry, deleteEntry, totalBurnedForDate }
})
