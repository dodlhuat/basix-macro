import { describe, it, expect } from 'vitest'
import { useStats, type DayTotal } from '../app/composables/useStats'

const { calcAverage, calcMacroPercentages, calcAdherence, bestDay, worstDay } = useStats()

const days: DayTotal[] = [
  { date: '2026-06-01', calories: 1800, protein_g: 150, carbs_g: 180, fat_g: 60, water_ml: 2000 },
  { date: '2026-06-02', calories: 2200, protein_g: 120, carbs_g: 250, fat_g: 70, water_ml: 1500 },
  { date: '2026-06-03', calories: 2000, protein_g: 140, carbs_g: 200, fat_g: 65, water_ml: 1800 },
]

describe('calcAverage', () => {
  it('calculates average calories', () => {
    expect(calcAverage(days).calories).toBe(Math.round((1800 + 2200 + 2000) / 3))
  })

  it('calculates average protein', () => {
    expect(calcAverage(days).protein_g).toBe(Math.round((150 + 120 + 140) / 3))
  })

  it('returns zeros for empty array', () => {
    const avg = calcAverage([])
    expect(avg.calories).toBe(0)
    expect(avg.protein_g).toBe(0)
  })
})

describe('calcMacroPercentages', () => {
  it('sums to 100 for typical macros', () => {
    const { protein, carbs, fat } = calcMacroPercentages(150, 200, 70)
    expect(protein + carbs + fat).toBe(100)
  })

  it('returns zeros when all macros are 0', () => {
    const result = calcMacroPercentages(0, 0, 0)
    expect(result.protein).toBe(0)
    expect(result.carbs).toBe(0)
    expect(result.fat).toBe(0)
  })

  it('fat contributes 9 kcal/g vs 4 for protein/carbs', () => {
    // 100g protein = 400 kcal, 100g fat = 900 kcal → fat should be higher %
    const { protein, fat } = calcMacroPercentages(100, 0, 100)
    expect(fat).toBeGreaterThan(protein)
  })
})

describe('calcAdherence', () => {
  it('returns 100 when all days are within goal', () => {
    expect(calcAdherence(days, 2500)).toBe(100)
  })

  it('returns 0 when no days logged', () => {
    const empty: DayTotal[] = [
      { date: '2026-06-01', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, water_ml: 0 },
    ]
    expect(calcAdherence(empty, 2000)).toBe(0)
  })

  it('returns 0 for empty array', () => {
    expect(calcAdherence([], 2000)).toBe(0)
  })

  it('excludes days exceeding goal by more than 10%', () => {
    const strict: DayTotal[] = [
      { date: '2026-06-01', calories: 2400, protein_g: 0, carbs_g: 0, fat_g: 0, water_ml: 0 },
      { date: '2026-06-02', calories: 1500, protein_g: 0, carbs_g: 0, fat_g: 0, water_ml: 0 },
    ]
    // goal 2000 → limit 2200; 2400 > 2200 → not on target
    expect(calcAdherence(strict, 2000)).toBe(50)
  })
})

describe('bestDay / worstDay', () => {
  it('finds day with highest calories', () => {
    expect(bestDay(days)?.date).toBe('2026-06-02')
  })

  it('finds day with lowest calories (among logged days)', () => {
    expect(worstDay(days)?.date).toBe('2026-06-01')
  })

  it('returns null for empty array', () => {
    expect(bestDay([])).toBeNull()
    expect(worstDay([])).toBeNull()
  })

  it('ignores days with 0 calories', () => {
    const withEmpty: DayTotal[] = [
      { date: '2026-06-01', calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, water_ml: 0 },
      { date: '2026-06-02', calories: 1800, protein_g: 0, carbs_g: 0, fat_g: 0, water_ml: 0 },
    ]
    expect(worstDay(withEmpty)?.date).toBe('2026-06-02')
  })
})
