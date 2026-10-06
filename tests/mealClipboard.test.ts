import { describe, it, expect } from 'vitest'
import { clipboardTotalKcal, toClipboardItem } from '../app/utils/mealClipboard'

const base = {
  amount_g: 150,
  servings: 1,
  calories_total: 300,
  protein_total_g: 20,
  carbs_total_g: 30,
  fat_total_g: 10,
}

describe('toClipboardItem', () => {
  it('snapshots a food entry as-is', () => {
    const item = toClipboardItem({ ...base, food_item_id: 'f1', food_item_name: 'Reis', is_quick_add: false })
    expect(item).toEqual({
      name: 'Reis',
      food_item_id: 'f1',
      recipe_id: undefined,
      is_quick_add: false,
      ...base,
    })
  })

  it('keeps recipe id and servings for recipe entries', () => {
    const item = toClipboardItem({
      ...base, amount_g: 0, servings: 2, recipe_id: 'r1', food_item_name: 'Curry', is_quick_add: false,
    })
    expect(item.recipe_id).toBe('r1')
    expect(item.servings).toBe(2)
    expect(item.food_item_id).toBeUndefined()
  })

  it('flags quick-add entries', () => {
    const item = toClipboardItem({ ...base, food_item_id: 'q1', food_item_name: 'Restaurant', is_quick_add: true })
    expect(item.is_quick_add).toBe(true)
  })
})

describe('clipboardTotalKcal', () => {
  it('returns 0 for an empty clipboard', () => {
    expect(clipboardTotalKcal([])).toBe(0)
  })

  it('sums calories across items', () => {
    const a = toClipboardItem({ ...base, food_item_id: 'a', food_item_name: 'A', is_quick_add: false })
    const b = toClipboardItem({ ...base, calories_total: 450, food_item_id: 'b', food_item_name: 'B', is_quick_add: false })
    expect(clipboardTotalKcal([a, b])).toBe(750)
  })
})
