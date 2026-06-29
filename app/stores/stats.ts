import { defineStore } from 'pinia'
import type { DayTotal } from '../composables/useStats'

export type Period = 7 | 30 | 90

export const useStatsStore = defineStore('stats', () => {
  const period = ref<Period>(7)
  const days = ref<DayTotal[]>([])
  const isLoading = ref(false)

  async function loadPeriod(p: Period) {
    const { db } = await import('../../db')
    isLoading.value = true
    period.value = p

    // Build date range: last p days ending today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateStrings: string[] = []
    for (let i = p - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dateStrings.push(d.toISOString().substring(0, 10))
    }

    // Aggregate diary entries per day
    const allEntries = await db.diary_entries
      .where('date')
      .anyOf(dateStrings)
      .toArray()

    const allWater = await db.water_entries
      .where('date')
      .anyOf(dateStrings)
      .toArray()

    days.value = dateStrings.map((date) => {
      const dayEntries = allEntries.filter(e => e.date === date)
      const dayWater = allWater.filter(w => w.date === date)
      return {
        date,
        calories: Math.round(dayEntries.reduce((s, e) => s + e.calories_total, 0)),
        protein_g: Math.round(dayEntries.reduce((s, e) => s + e.protein_total_g, 0) * 10) / 10,
        carbs_g: Math.round(dayEntries.reduce((s, e) => s + e.carbs_total_g, 0) * 10) / 10,
        fat_g: Math.round(dayEntries.reduce((s, e) => s + e.fat_total_g, 0) * 10) / 10,
        water_ml: dayWater.reduce((s, w) => s + w.amount_ml, 0),
      }
    })

    isLoading.value = false
  }

  const loggedDays = computed(() => days.value.filter(d => d.calories > 0))

  return { period, days, loggedDays, isLoading, loadPeriod }
})
