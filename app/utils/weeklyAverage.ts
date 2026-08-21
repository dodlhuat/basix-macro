import { toLocalDateStr } from './date'

export interface WeeklyAverage {
  weekKey: string
  weekStart: string
  avgWeight: number
  count: number
  deltaKg: number | null
  deltaPercent: number | null
}

interface WeighIn {
  date: string
  weight_kg: number
}

function parseYMD(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y!, m! - 1, d!, 12)
}

/** ISO 8601 week key ("2026-W34"): the week's year is the year of its Thursday. */
function isoWeekKey(date: Date): string {
  const thursday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  const dayNum = thursday.getDay() || 7
  thursday.setDate(thursday.getDate() + 4 - dayNum)
  const isoYear = thursday.getFullYear()
  const yearStart = new Date(isoYear, 0, 1, 12)
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${isoYear}-W${String(week).padStart(2, '0')}`
}

function weekStartMonday(date: Date): Date {
  const dayNum = date.getDay() || 7
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
  monday.setDate(monday.getDate() - dayNum + 1)
  return monday
}

/**
 * Groups weigh-ins by ISO calendar week and averages them, ordered oldest to
 * newest. Each week also carries its delta (kg and %) vs the previous week's
 * average, so trend direction survives day-to-day noise.
 */
export function computeWeeklyAverages(entries: WeighIn[]): WeeklyAverage[] {
  const groups = new Map<string, { weekStart: string; sum: number; count: number }>()

  for (const entry of entries) {
    const date = parseYMD(entry.date)
    const weekKey = isoWeekKey(date)
    const group = groups.get(weekKey)
    if (group) {
      group.sum += entry.weight_kg
      group.count += 1
    }
    else {
      groups.set(weekKey, { weekStart: toLocalDateStr(weekStartMonday(date)), sum: entry.weight_kg, count: 1 })
    }
  }

  const weeks = [...groups.entries()]
    .map(([weekKey, g]) => ({
      weekKey,
      weekStart: g.weekStart,
      avgWeight: g.sum / g.count,
      count: g.count,
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))

  return weeks.map((week, i) => {
    const prev = weeks[i - 1]
    return {
      ...week,
      avgWeight: +week.avgWeight.toFixed(2),
      deltaKg: prev ? +(week.avgWeight - prev.avgWeight).toFixed(2) : null,
      deltaPercent: prev && prev.avgWeight !== 0
        ? +(((week.avgWeight - prev.avgWeight) / prev.avgWeight) * 100).toFixed(2)
        : null,
    }
  })
}
