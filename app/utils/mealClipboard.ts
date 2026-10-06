import type { DiaryEntry } from '../../db'

export type MealType = DiaryEntry['meal_type']

/**
 * Immutable snapshot of one diary entry, taken at copy time. Values are copied
 * as-is (not recalculated), so a pasted entry always matches the original even
 * if the food was edited in between.
 */
export interface ClipboardItem {
  name: string
  food_item_id?: string
  recipe_id?: string
  is_quick_add: boolean
  amount_g: number
  servings: number
  calories_total: number
  protein_total_g: number
  carbs_total_g: number
  fat_total_g: number
}

export interface ClipboardSource {
  date: string
  mealType: MealType
}

type EntryLike = Pick<
  DiaryEntry,
  | 'food_item_id' | 'recipe_id' | 'amount_g' | 'servings'
  | 'calories_total' | 'protein_total_g' | 'carbs_total_g' | 'fat_total_g'
> & { food_item_name: string; is_quick_add: boolean }

export function toClipboardItem(entry: EntryLike): ClipboardItem {
  return {
    name: entry.food_item_name,
    food_item_id: entry.food_item_id,
    recipe_id: entry.recipe_id,
    is_quick_add: entry.is_quick_add,
    amount_g: entry.amount_g,
    servings: entry.servings,
    calories_total: entry.calories_total,
    protein_total_g: entry.protein_total_g,
    carbs_total_g: entry.carbs_total_g,
    fat_total_g: entry.fat_total_g,
  }
}

export function clipboardTotalKcal(items: ClipboardItem[]): number {
  return items.reduce((sum, i) => sum + i.calories_total, 0)
}
