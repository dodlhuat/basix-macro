import { describe, it, expect } from 'vitest'
import { useBMI } from '../app/composables/useBMI'

const { calcBMI } = useBMI()

describe('calcBMI', () => {
  it('calculates BMI correctly', () => {
    // 70 / (1.75²) = 22.9
    expect(calcBMI(70, 175).value).toBe(22.9)
  })

  it('classifies underweight (BMI < 18.5)', () => {
    expect(calcBMI(50, 175).category).toBe('underweight')
  })

  it('classifies normal (18.5 ≤ BMI < 25)', () => {
    expect(calcBMI(70, 175).category).toBe('normal')
  })

  it('classifies overweight (25 ≤ BMI < 30)', () => {
    expect(calcBMI(85, 175).category).toBe('overweight')
  })

  it('classifies obese (BMI ≥ 30)', () => {
    expect(calcBMI(100, 175).category).toBe('obese')
  })

  it('returns correct German label for normal', () => {
    expect(calcBMI(70, 175).label).toBe('Normalgewicht')
  })

  it('rounds to at most 1 decimal place', () => {
    const { value } = calcBMI(73, 178)
    // value must have at most 1 decimal digit
    expect(Math.round(value * 10) / 10).toBe(value)
  })
})
