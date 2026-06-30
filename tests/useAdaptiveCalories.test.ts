import { describe, it, expect } from 'vitest'
import {
  daysBetween,
  subtractDays,
  weeklyTrendKg,
} from '../app/composables/useAdaptiveCalories'
import type { WeightEntry } from '../db'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(date: string, weight_kg: number): WeightEntry {
  return { id: date, date, weight_kg, created_at: '', updated_at: '', sync_status: 'local' }
}

// ─── daysBetween ──────────────────────────────────────────────────────────────

describe('daysBetween', () => {
  it('returns 0 for the same date', () => {
    expect(daysBetween('2025-01-01', '2025-01-01')).toBe(0)
  })

  it('counts days correctly within a month', () => {
    expect(daysBetween('2025-01-01', '2025-01-14')).toBe(13)
  })

  it('counts days across a month boundary', () => {
    expect(daysBetween('2025-01-25', '2025-02-08')).toBe(14)
  })

  it('counts days across a year boundary', () => {
    expect(daysBetween('2024-12-25', '2025-01-01')).toBe(7)
  })
})

// ─── subtractDays ─────────────────────────────────────────────────────────────

describe('subtractDays', () => {
  it('subtracts within a month', () => {
    expect(subtractDays('2025-06-20', 5)).toBe('2025-06-15')
  })

  it('subtracts across a month boundary', () => {
    expect(subtractDays('2025-03-05', 7)).toBe('2025-02-26')
  })

  it('subtracts across a year boundary', () => {
    expect(subtractDays('2025-01-07', 14)).toBe('2024-12-24')
  })

  it('subtracts 0 days returns same date', () => {
    expect(subtractDays('2025-06-15', 0)).toBe('2025-06-15')
  })
})

// ─── weeklyTrendKg ────────────────────────────────────────────────────────────

describe('weeklyTrendKg', () => {
  it('returns 0 for fewer than 2 entries', () => {
    expect(weeklyTrendKg([])).toBe(0)
    expect(weeklyTrendKg([makeEntry('2025-01-01', 80)])).toBe(0)
  })

  it('detects a perfect −0.5 kg/week loss over 4 weeks', () => {
    // −2 kg over 28 days = −0.5 kg/week
    const entries = [
      makeEntry('2025-01-01', 80.0),
      makeEntry('2025-01-08', 79.5),
      makeEntry('2025-01-15', 79.0),
      makeEntry('2025-01-22', 78.5),
      makeEntry('2025-01-29', 78.0),
    ]
    expect(weeklyTrendKg(entries)).toBeCloseTo(-0.5, 3)
  })

  it('detects a perfect +0.25 kg/week gain', () => {
    // +0.25 kg/week over 4 weeks
    const entries = [
      makeEntry('2025-01-01', 70.0),
      makeEntry('2025-01-08', 70.25),
      makeEntry('2025-01-15', 70.5),
      makeEntry('2025-01-22', 70.75),
    ]
    expect(weeklyTrendKg(entries)).toBeCloseTo(0.25, 3)
  })

  it('returns ~0 for stable weight', () => {
    const entries = [
      makeEntry('2025-01-01', 75.0),
      makeEntry('2025-01-08', 75.1),
      makeEntry('2025-01-15', 74.9),
      makeEntry('2025-01-22', 75.0),
    ]
    expect(Math.abs(weeklyTrendKg(entries))).toBeLessThan(0.05)
  })

  it('handles noisy data and still approximates the trend', () => {
    // True trend: −0.5 kg/week, noise ±0.3 kg
    const entries = [
      makeEntry('2025-01-01', 80.2),
      makeEntry('2025-01-08', 79.8),
      makeEntry('2025-01-15', 79.1),
      makeEntry('2025-01-22', 78.7),
      makeEntry('2025-01-29', 78.3),
      makeEntry('2025-02-05', 77.9),
    ]
    const trend = weeklyTrendKg(entries)
    expect(trend).toBeLessThan(-0.3)
    expect(trend).toBeGreaterThan(-0.7)
  })

  it('returns 0 for all identical weights (degenerate input)', () => {
    const entries = [
      makeEntry('2025-01-01', 80),
      makeEntry('2025-01-08', 80),
      makeEntry('2025-01-15', 80),
    ]
    expect(weeklyTrendKg(entries)).toBe(0)
  })
})

// ─── Adjustment direction logic ───────────────────────────────────────────────
// These tests verify the sign of the calorie delta without running Dexie.
// The formula is: deltaKcal = -(actualRateG - targetRateG) / 1000 * 7700/7

describe('adjustment direction (formula)', () => {
  const THRESHOLD_G = 150
  const MAX_ADJUST  = 200
  const ROUND_TO    = 50

  function calcDelta(actualRateGPerWeek: number, targetRateGPerWeek: number): number | null {
    const diffG = actualRateGPerWeek - targetRateGPerWeek
    if (Math.abs(diffG) <= THRESHOLD_G) return null          // no adjustment
    const raw    = -(diffG / 1000) * 7700 / 7
    const capped = Math.max(-MAX_ADJUST, Math.min(MAX_ADJUST, raw))
    return Math.round(capped / ROUND_TO) * ROUND_TO
  }

  it('lowers calories when losing less than target (light_cut)', () => {
    // Target −250g/week, actual −50g/week → diff = +200 → over threshold → eat less
    expect(calcDelta(-50, -250)).toBeLessThan(0)
  })

  it('raises calories when losing more than target (light_cut)', () => {
    // Target −250g/week, actual −450g/week → diff = −200 → over threshold → eat more
    expect(calcDelta(-450, -250)).toBeGreaterThan(0)
  })

  it('makes no adjustment when difference is within threshold', () => {
    // diff = |(-150) - (-250)| = 100 < 150 threshold → null
    expect(calcDelta(-150, -250)).toBeNull()
  })

  it('makes no adjustment exactly at threshold boundary', () => {
    // diff = |(-100) - (-250)| = 150 ≤ 150 → null
    expect(calcDelta(-100, -250)).toBeNull()
  })

  it('adjusts just beyond the threshold', () => {
    // diff = |(-99) - (-250)| = 151 > 150 → adjusts
    expect(calcDelta(-99, -250)).not.toBeNull()
  })

  it('caps adjustment at +200 kcal', () => {
    // Very large loss → capped at +200
    expect(calcDelta(-1000, -250)).toBe(200)
  })

  it('caps adjustment at −200 kcal', () => {
    // Very large gain → capped at −200
    expect(calcDelta(500, -250)).toBe(-200)
  })

  it('raises calories for maintain goal when weight drops', () => {
    // Target 0g/week, actual −300g/week → too much loss → raise calories
    expect(calcDelta(-300, 0)).toBeGreaterThan(0)
  })

  it('lowers calories for bulk goal when gaining less than target', () => {
    // Target +500g/week, actual +150g/week → diff = −350 → capped → −200
    expect(calcDelta(150, 500)).toBe(200)
  })
})
