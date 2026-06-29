import { describe, it, expect } from 'vitest'
import { useCalorieCalculator } from '../app/composables/useCalorieCalculator'

const { calcBMR, calcTDEE, calcCalorieGoal, calcMacros, calculate } = useCalorieCalculator()

describe('calcBMR', () => {
  it('calculates male BMR correctly', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calcBMR(80, 180, 30, 'male')).toBe(1780)
  })

  it('calculates female BMR correctly', () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    expect(calcBMR(60, 165, 25, 'female')).toBeCloseTo(1345.25, 1)
  })

  it('treats "other" gender same as male', () => {
    expect(calcBMR(80, 180, 30, 'other')).toBe(calcBMR(80, 180, 30, 'male'))
  })
})

describe('calcTDEE', () => {
  it('applies sedentary multiplier', () => {
    expect(calcTDEE(1780, 'sedentary')).toBe(Math.round(1780 * 1.2))
  })

  it('applies very_active multiplier', () => {
    expect(calcTDEE(1780, 'very_active')).toBe(Math.round(1780 * 1.9))
  })
})

describe('calcCalorieGoal', () => {
  it('subtracts 500 for cut goal', () => {
    expect(calcCalorieGoal(2000, 'cut')).toBe(1500)
  })

  it('subtracts 250 for light_cut goal', () => {
    expect(calcCalorieGoal(2000, 'light_cut')).toBe(1750)
  })

  it('keeps tdee for maintain goal', () => {
    expect(calcCalorieGoal(2000, 'maintain')).toBe(2000)
  })

  it('adds 250 for lean_bulk goal', () => {
    expect(calcCalorieGoal(2000, 'lean_bulk')).toBe(2250)
  })

  it('adds 500 for bulk goal', () => {
    expect(calcCalorieGoal(2000, 'bulk')).toBe(2500)
  })

  it('never goes below 1200 kcal minimum', () => {
    expect(calcCalorieGoal(1500, 'cut')).toBe(1200)
  })
})

describe('calcMacros', () => {
  it('distributes macros at 25/50/25 split', () => {
    const result = calcMacros(2000)
    expect(result.calories).toBe(2000)
    expect(result.protein_g).toBe(Math.round((2000 * 0.25) / 4))  // 125g
    expect(result.carbs_g).toBe(Math.round((2000 * 0.50) / 4))    // 250g
    expect(result.fat_g).toBe(Math.round((2000 * 0.25) / 9))      // 56g
  })
})

describe('calculate (full pipeline)', () => {
  it('returns a valid calorie goal for a typical user', () => {
    const result = calculate(75, 178, 28, 'male', 'moderate', 'maintain')
    expect(result.calories).toBeGreaterThan(1200)
    expect(result.calories).toBeLessThan(4000)
    expect(result.protein_g).toBeGreaterThan(0)
    expect(result.carbs_g).toBeGreaterThan(0)
    expect(result.fat_g).toBeGreaterThan(0)
  })
})
