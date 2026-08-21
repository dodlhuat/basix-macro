import { defineStore } from 'pinia'
import type { WeightEntry } from '../../db'
import { computeWeeklyAverages } from '../utils/weeklyAverage'

export const useWeightStore = defineStore('weight', () => {
  const entries = ref<WeightEntry[]>([])

  async function loadEntries(): Promise<void> {
    const { db } = await import('../../db')
    entries.value = await db.weight_entries
      .orderBy('date')
      .reverse()
      .filter(w => !w.deleted_at)
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
    const entry = await db.weight_entries.get(id)
    if (!entry) return
    const now = new Date().toISOString()
    await db.weight_entries.put(markDeleted(entry, now))
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

  const weeklyAverages = computed(() => computeWeeklyAverages(entries.value).slice(-26))

  return { entries, latestEntry, chartData, weeklyAverages, loadEntries, addEntry, deleteEntry }
})
