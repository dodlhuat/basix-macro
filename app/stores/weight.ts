import { defineStore } from 'pinia'
import type { WeightEntry } from '../../db'

export const useWeightStore = defineStore('weight', () => {
  const entries = ref<WeightEntry[]>([])

  async function loadEntries(): Promise<void> {
    const { db } = await import('../../db')
    entries.value = await db.weight_entries
      .orderBy('date')
      .reverse()
      .toArray()
  }

  async function addEntry(weight_kg: number, date: string, note?: string): Promise<string> {
    const { db } = await import('../../db')
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    await db.weight_entries.add({
      id,
      date,
      weight_kg,
      note,
      created_at: now,
      updated_at: now,
      sync_status: 'local',
    })
    await loadEntries()
    return id
  }

  async function deleteEntry(id: string): Promise<void> {
    const { db } = await import('../../db')
    await db.weight_entries.delete(id)
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
