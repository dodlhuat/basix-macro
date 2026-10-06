import type { DiaryEntryWithName } from '~/stores/diary'
import type { MealType } from '../utils/mealClipboard'

interface UndoState {
  ids: string[]
  date: string
  message: string
}

/**
 * Shared copy / paste / undo actions for meal sections (dashboard + diary/[date]).
 * Undo and "just pasted" state live in `useState`, so a single <MealUndoBar />
 * per page reflects whatever either page triggered.
 */
export function useMealClipboard(date: Ref<string>) {
  const clipboard = useMealClipboardStore()
  const diaryStore = useDiaryStore()
  const { t } = useI18n()
  const { showToast } = useToast()

  const undo = useState<UndoState | null>('mealUndo', () => null)
  const pastedMeal = useState<MealType | null>('mealPasted', () => null)
  const pastingMeal = ref<MealType | null>(null)
  let pulseTimer: ReturnType<typeof setTimeout> | undefined

  const mealLabel = (type: MealType) => t(`meal.${type}`)

  function isSource(type: MealType): boolean {
    return clipboard.source?.date === date.value && clipboard.source?.mealType === type
  }

  function copy(entries: DiaryEntryWithName[], type: MealType): void {
    if (!entries.length) return
    clipboard.copyMeal(entries, date.value, type)
    showToast(t('mealClipboard.copiedToast', { meal: mealLabel(type), n: entries.length }))
  }

  async function paste(type: MealType): Promise<void> {
    if (pastingMeal.value || !clipboard.hasContent) return
    pastingMeal.value = type
    try {
      const { ids, skipped } = await diaryStore.pasteEntries(clipboard.items, date.value, type)
      if (ids.length === 0) {
        showToast(t('mealClipboard.nothingPasted'), 'error')
        return
      }
      const message = skipped > 0
        ? t('mealClipboard.pastedSkippedToast', { n: ids.length, skipped })
        : t('mealClipboard.pastedToast', { n: ids.length })
      undo.value = { ids, date: date.value, message }

      pastedMeal.value = type
      clearTimeout(pulseTimer)
      pulseTimer = setTimeout(() => { pastedMeal.value = null }, 1000)
    } finally {
      pastingMeal.value = null
    }
  }

  async function runUndo(): Promise<void> {
    const state = undo.value
    if (!state) return
    undo.value = null
    await diaryStore.undoPaste(state.ids, state.date)
    showToast(t('mealClipboard.undone'), 'info', 2000)
  }

  function dismissUndo(): void {
    undo.value = null
  }

  return {
    clipboard, undo, pastedMeal, pastingMeal,
    isSource, copy, paste, runUndo, dismissUndo,
  }
}
