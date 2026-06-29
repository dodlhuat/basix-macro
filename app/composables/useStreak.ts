/**
 * useStreak — calculates consecutive logged days ending today or yesterday.
 * Returns a reactive `streak` ref (number of days).
 */
export function useStreak() {
  const streak = ref(0)

  function toDateStr(d: Date): string {
    return d.toISOString().substring(0, 10)
  }

  async function calculateStreak() {
    const { db } = await import('../../db')
    const allEntries = await db.diary_entries.toArray()
    const dateSet = new Set(allEntries.map(e => e.date))

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start from today; if today has no entries, check from yesterday
    let checkDate = new Date(today)
    if (!dateSet.has(toDateStr(checkDate))) {
      checkDate.setDate(checkDate.getDate() - 1)
    }

    let count = 0
    while (dateSet.has(toDateStr(checkDate))) {
      count++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    streak.value = count
  }

  onMounted(calculateStreak)

  return { streak }
}
