/**
 * useStreak — calculates consecutive logged days ending today or yesterday.
 * Returns a reactive `streak` ref (number of days).
 */
export function useStreak() {
  const streak = ref(0)

  async function calculateStreak() {
    const { db } = await import('../../db')
    const allEntries = await db.diary_entries.toArray()
    const dateSet = new Set(allEntries.map(e => e.date))

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start from today; if today has no entries, check from yesterday
    const checkDate = new Date(today)
    if (!dateSet.has(toLocalDateStr(checkDate))) {
      checkDate.setDate(checkDate.getDate() - 1)
    }

    let count = 0
    while (dateSet.has(toLocalDateStr(checkDate))) {
      count++
      checkDate.setDate(checkDate.getDate() - 1)
    }

    streak.value = count
  }

  onMounted(calculateStreak)

  return { streak }
}
