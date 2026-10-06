import type { Ref } from 'vue'
import type { DateRange } from '@dodlhuat/basix/js/datepicker.js'

const DAYS: Record<'de' | 'en', string[]> = {
  de: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
}
const MONTHS: Record<'de' | 'en', string[]> = {
  de: [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
  ],
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
}

function toDisplay(date: Date, lang: 'de' | 'en'): string {
  const loc = lang === 'en' ? 'en-US' : 'de-DE'
  return date.toLocaleDateString(loc, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fromYMD(ymd: string): Date {
  return new Date(`${ymd}T12:00:00`)
}

function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function useBasixDatepicker(elRef: Ref<HTMLInputElement | null>, model: Ref<string>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dp: any = null
  let suppressWatch = false
  const { locale } = useI18n()
  const lang = (): 'de' | 'en' => (locale.value === 'en' ? 'en' : 'de')

  function syncToDatepicker(ymd: string) {
    if (!dp || !ymd) return
    const date = fromYMD(ymd)
    dp.selectedDate = date
    dp.viewYear = date.getFullYear()
    dp.viewMonth = date.getMonth()
    dp.updateInput(toDisplay(date, lang()))
    dp.render()
  }

  onMounted(async () => {
    if (!elRef.value) return
    const { DatePicker } = await import('@dodlhuat/basix/js/datepicker.js')

    dp = new DatePicker(elRef.value, {
      mode: 'single',
      startDay: 1,
      locales: { days: DAYS[lang()], months: MONTHS[lang()] },
      format: (date: Date) => toDisplay(date, lang()),
      onSelect: (date: Date | DateRange) => {
        // Configured with `mode: 'single'`, so the picker only ever selects a single Date —
        // a DateRange would only occur in 'range' mode, which this composable doesn't support.
        if (!(date instanceof Date)) return
        suppressWatch = true
        model.value = toYMD(date)
        nextTick(() => { suppressWatch = false })
      },
    })

    if (model.value) syncToDatepicker(model.value)
  })

  watch(model, (ymd) => {
    if (suppressWatch) return
    syncToDatepicker(ymd)
  })

  onUnmounted(() => {
    dp?.destroy()
    dp = null
  })
}
