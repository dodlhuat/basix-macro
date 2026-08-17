import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { toLocalDateStr } from '../app/utils/date'

describe('toLocalDateStr', () => {
  it('zero-pads single-digit months and days', () => {
    expect(toLocalDateStr(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('formats a mid-month date correctly', () => {
    expect(toLocalDateStr(new Date(2026, 8, 17))).toBe('2026-09-17')
  })

  describe('in a UTC+ timezone (regression: must not go through toISOString/UTC)', () => {
    const originalTz = process.env.TZ

    beforeAll(() => {
      process.env.TZ = 'Europe/Vienna' // UTC+1/+2
    })

    afterAll(() => {
      process.env.TZ = originalTz
    })

    it('keeps the local calendar date just after local midnight, when UTC is still "yesterday"', () => {
      // 2026-08-17T00:30 in Vienna (UTC+2 in August) is 2026-08-16T22:30Z —
      // `.toISOString().substring(0, 10)` would incorrectly return '2026-08-16'.
      const localMidnightPlus30 = new Date(2026, 7, 17, 0, 30)
      expect(toLocalDateStr(localMidnightPlus30)).toBe('2026-08-17')
    })

    it('keeps the local calendar date after a setDate() shift, at any hour', () => {
      // The diary prev/next-day bug: shifting a Date via setDate() and then
      // formatting via toISOString() double-shifts across a UTC+ boundary.
      const d = new Date(2026, 7, 17, 0, 0)
      d.setDate(d.getDate() - 1)
      expect(toLocalDateStr(d)).toBe('2026-08-16')
    })
  })
})
