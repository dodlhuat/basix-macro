import type { WeightEntry } from '../../db'

// Expected weekly body-weight change per goal in grams (negative = loss)
const TARGET_RATE_G: Record<string, number> = {
  cut:       -500,
  light_cut: -250,
  maintain:     0,
  lean_bulk:  250,
  bulk:       500,
}

const THRESHOLD_G        = 150   // ignore diffs smaller than this (water-weight noise)
const MIN_TRACKING_DAYS  = 14    // first adjustment only after 2 weeks
const COOLDOWN_DAYS      = 7     // at most one adjustment per week
const MIN_DIARY_DAYS     = 10    // need ≥10 logged days in the last 14
const MAX_ADJUST_KCAL    = 200   // cap per adjustment step
const ROUND_TO           = 50    // round adjustment to nearest 50 kcal

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000)
}

// Linear regression slope in kg/week over a list of weight entries
export function weeklyTrendKg(entries: WeightEntry[]): number {
  const n = entries.length
  if (n < 2) return 0
  const t0 = new Date(entries[0]!.date).getTime()
  const pts = entries.map(e => ({
    x: (new Date(e.date).getTime() - t0) / 86_400_000,  // days since first
    y: e.weight_kg,
  }))
  const sx  = pts.reduce((s, p) => s + p.x, 0)
  const sy  = pts.reduce((s, p) => s + p.y, 0)
  const sxy = pts.reduce((s, p) => s + p.x * p.y, 0)
  const sx2 = pts.reduce((s, p) => s + p.x * p.x, 0)
  const denom = n * sx2 - sx * sx
  if (denom === 0) return 0
  return ((n * sxy - sx * sy) / denom) * 7  // kg/day → kg/week
}

export interface AdaptiveResult {
  adjusted: boolean
  newGoal?: number
  deltaKcal?: number
}

export function useAdaptiveCalories() {
  const userStore = useUserStore()

  async function checkAndAdjust(): Promise<AdaptiveResult> {
    const user = userStore.user
    if (!user?.adaptive_calories_enabled) return { adjusted: false }

    const today = todayStr()

    // Cooldown check
    if (user.adaptive_calories_last_adjusted_at) {
      if (daysBetween(user.adaptive_calories_last_adjusted_at, today) < COOLDOWN_DAYS) {
        return { adjusted: false }
      }
    }

    const { db } = await import('../../db')
    const from28 = subtractDays(today, 28)
    const from14 = subtractDays(today, 14)

    // Weight entries: need at least 3 spanning ≥14 days
    const weights = await db.weight_entries
      .where('date').between(from28, today, true, true)
      .sortBy('date')

    if (weights.length < 3) return { adjusted: false }
    if (daysBetween(weights[0]!.date, today) < MIN_TRACKING_DAYS) return { adjusted: false }

    // Diary coverage: need ≥10 distinct days in the last 14
    const diaryDates = await db.diary_entries
      .where('date').between(from14, today, true, true)
      .keys()
    const uniqueDays = new Set(diaryDates as string[]).size
    if (uniqueDays < MIN_DIARY_DAYS) return { adjusted: false }

    // Trend vs target
    const actualRateG  = weeklyTrendKg(weights) * 1000         // kg/week → g/week
    const targetRateG  = TARGET_RATE_G[user.goal] ?? 0
    const diffG        = actualRateG - targetRateG              // + → gaining more than planned

    if (Math.abs(diffG) <= THRESHOLD_G) return { adjusted: false }

    // Positive diffG = gaining more (or losing less) than target → lower calories
    // rawAdjust in kcal/day
    const rawAdjust    = -(diffG / 1000) * 7700 / 7
    const capped       = Math.max(-MAX_ADJUST_KCAL, Math.min(MAX_ADJUST_KCAL, rawAdjust))
    const deltaKcal    = Math.round(capped / ROUND_TO) * ROUND_TO

    if (deltaKcal === 0) return { adjusted: false }

    const newGoal = Math.max(1200, Math.min(6000, user.calorie_goal + deltaKcal))

    await userStore.saveUser({
      ...user,
      calorie_goal: newGoal,
      adaptive_calories_last_adjusted_at: today,
      adaptive_calories_last_delta_kcal:  deltaKcal,
      updated_at: new Date().toISOString(),
      sync_status: 'dirty',
    })

    return { adjusted: true, newGoal, deltaKcal }
  }

  return { checkAndAdjust }
}
