import type { Ref } from 'vue'

const DAYS_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const MONTHS_DE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

function toDisplay(date: Date): string {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

  function syncToDatepicker(ymd: string) {
    if (!dp || !ymd) return
    const date = fromYMD(ymd)
    dp.selectedDate = date
    dp.viewYear = date.getFullYear()
    dp.viewMonth = date.getMonth()
    dp.updateInput(toDisplay(date))
    dp.render()
  }

  onMounted(async () => {
    if (!elRef.value) return
    const { DatePicker } = await import('@dodlhuat/basix/js/datepicker.js')

    dp = new DatePicker(elRef.value, {
      mode: 'single',
      startDay: 1,
      locales: { days: DAYS_DE, months: MONTHS_DE },
      format: toDisplay,
      onSelect: (date: Date) => {
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
