import { defineStore } from 'pinia'
import type { DiaryEntryWithName } from './diary'
import {
  clipboardTotalKcal,
  toClipboardItem,
  type ClipboardItem,
  type ClipboardSource,
  type MealType,
} from '../utils/mealClipboard'

/**
 * In-memory "copy meal" clipboard (session only — intentionally not persisted).
 * Not cleared on paste, so the same meal can be pasted onto several days.
 */
export const useMealClipboardStore = defineStore('mealClipboard', () => {
  const items = ref<ClipboardItem[]>([])
  const source = ref<ClipboardSource | null>(null)

  const hasContent = computed(() => items.value.length > 0)
  const count = computed(() => items.value.length)
  const totalKcal = computed(() => clipboardTotalKcal(items.value))

  function copyMeal(entries: DiaryEntryWithName[], date: string, mealType: MealType): void {
    if (!entries.length) return
    items.value = entries.map(toClipboardItem)
    source.value = { date, mealType }
  }

  function clear(): void {
    items.value = []
    source.value = null
  }

  return { items, source, hasContent, count, totalKcal, copyMeal, clear }
})
