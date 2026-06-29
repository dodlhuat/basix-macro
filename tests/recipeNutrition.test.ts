import { describe, it, expect } from 'vitest'

// Pure nutrition calculation extracted for testing (mirrors store logic)
function calcTotals(ingredients: { amount_g: number; food: { calories_per_100g: number; protein_per_100g: number; carbs_per_100g: number; fat_per_100g: number } }[]) {
  return ingredients.reduce(
    (acc, ing) => {
      const f = ing.amount_g / 100
      return {
        total_calories: acc.total_calories + ing.food.calories_per_100g * f,
        total_protein_g: acc.total_protein_g + ing.food.protein_per_100g * f,
        total_carbs_g: acc.total_carbs_g + ing.food.carbs_per_100g * f,
        total_fat_g: acc.total_fat_g + ing.food.fat_per_100g * f,
      }
    },
    { total_calories: 0, total_protein_g: 0, total_carbs_g: 0, total_fat_g: 0 },
  )
}

const chicken = { calories_per_100g: 165, protein_per_100g: 31, carbs_per_100g: 0, fat_per_100g: 3.6 }
const rice    = { calories_per_100g: 130, protein_per_100g: 2.7, carbs_per_100g: 28, fat_per_100g: 0.3 }

describe('calcTotals', () => {
  it('calculates calories for single ingredient', () => {
    const result = calcTotals([{ amount_g: 100, food: chicken }])
    expect(result.total_calories).toBe(165)
  })

  it('scales by amount_g correctly', () => {
    const result = calcTotals([{ amount_g: 200, food: chicken }])
    expect(result.total_calories).toBe(330)
  })

  it('sums multiple ingredients', () => {
    const result = calcTotals([
      { amount_g: 150, food: chicken },
      { amount_g: 100, food: rice },
    ])
    expect(result.total_calories).toBeCloseTo(165 * 1.5 + 130, 1)
    expect(result.total_protein_g).toBeCloseTo(31 * 1.5 + 2.7, 1)
    expect(result.total_carbs_g).toBeCloseTo(28, 1)
  })

  it('returns zeros for empty ingredients', () => {
    const result = calcTotals([])
    expect(result.total_calories).toBe(0)
    expect(result.total_protein_g).toBe(0)
  })

  it('per-serving calculation is correct', () => {
    const totals = calcTotals([{ amount_g: 200, food: chicken }])
    const servings = 2
    expect(Math.round(totals.total_calories / servings)).toBe(165)
  })
})
