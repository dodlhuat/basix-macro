import { describe, it, expect } from 'vitest'
import { computeWeeklyAverages } from '../app/utils/weeklyAverage'

describe('computeWeeklyAverages', () => {
  it('returns an empty array for no entries', () => {
    expect(computeWeeklyAverages([])).toEqual([])
  })

  it('averages multiple entries within the same ISO week', () => {
    const result = computeWeeklyAverages([
      { date: '2026-08-17', weight_kg: 80 }, // Monday
      { date: '2026-08-19', weight_kg: 82 }, // Wednesday, same week
    ])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      weekStart: '2026-08-17',
      avgWeight: 81,
      count: 2,
      deltaKg: null,
      deltaPercent: null,
    })
  })

  it('sorts unordered input and computes week-over-week deltas', () => {
    const result = computeWeeklyAverages([
      { date: '2026-08-24', weight_kg: 79 }, // week 2
      { date: '2026-08-17', weight_kg: 80 }, // week 1
    ])
    expect(result.map(w => w.weekStart)).toEqual(['2026-08-17', '2026-08-24'])
    expect(result[0]!.deltaKg).toBeNull()
    expect(result[1]!.deltaKg).toBeCloseTo(-1)
    expect(result[1]!.deltaPercent).toBeCloseTo(-1.25)
  })

  it('groups a Sunday into the same week as the preceding Monday', () => {
    const result = computeWeeklyAverages([
      { date: '2026-08-17', weight_kg: 80 }, // Monday
      { date: '2026-08-23', weight_kg: 82 }, // Sunday, same ISO week
    ])
    expect(result).toHaveLength(1)
    expect(result[0]!.weekStart).toBe('2026-08-17')
    expect(result[0]!.avgWeight).toBe(81)
  })

  it('assigns the year-boundary week (Mon 2025-12-29) to 2026-W01 per ISO 8601', () => {
    const result = computeWeeklyAverages([
      { date: '2025-12-29', weight_kg: 80 },
    ])
    expect(result[0]!.weekKey).toBe('2026-W01')
    expect(result[0]!.weekStart).toBe('2025-12-29')
  })

  it('rounds the average and deltas to two decimal places', () => {
    const result = computeWeeklyAverages([
      { date: '2026-08-17', weight_kg: 80.111 },
      { date: '2026-08-18', weight_kg: 80.222 },
      { date: '2026-08-24', weight_kg: 81 },
    ])
    expect(result[0]!.avgWeight).toBe(80.17)
    expect(result[1]!.deltaKg).toBeCloseTo(0.83)
  })
})
