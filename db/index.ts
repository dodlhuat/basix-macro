import Dexie, { type Table } from 'dexie'

export interface User {
  id: string
  name: string
  email?: string
  age: number
  gender: 'male' | 'female' | 'other'
  height_cm: number
  weight_kg: number
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal: 'cut' | 'light_cut' | 'maintain' | 'lean_bulk' | 'bulk'
  calorie_goal: number
  protein_goal_g: number
  carbs_goal_g: number
  fat_goal_g: number
  unit_system: 'metric' | 'imperial'
  water_goal_ml: number
  dark_mode: boolean
  adaptive_calories_enabled: boolean
  adaptive_calories_last_adjusted_at?: string
  adaptive_calories_last_delta_kcal?: number
  locale?: 'de' | 'en'
  created_at: string
  updated_at: string
  sync_status: 'local' | 'synced' | 'dirty'
  deleted_at?: string | null
}

export interface FoodItem {
  id: string
  name: string
  brand?: string
  barcode?: string
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g?: number
  sugar_per_100g?: number
  source: 'manual' | 'openfoodfacts' | 'user_barcode_link' | 'global'
  is_favorite: boolean
  last_used_at?: string
  created_at: string
  updated_at: string
  sync_status: 'local' | 'synced' | 'dirty'
  deleted_at?: string | null
}

export interface Recipe {
  id: string
  name: string
  description?: string
  servings: number
  image_url?: string
  created_at: string
  updated_at: string
  sync_status: 'local' | 'synced' | 'dirty'
  deleted_at?: string | null
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  food_item_id: string
  amount_g: number
  created_at: string
  updated_at: string
  sync_status: 'local' | 'synced' | 'dirty'
  deleted_at?: string | null
}

export interface DiaryEntry {
  id: string
  date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  food_item_id?: string
  recipe_id?: string
  amount_g: number
  servings: number
  calories_total: number
  protein_total_g: number
  carbs_total_g: number
  fat_total_g: number
  logged_at: string
  created_at: string
  updated_at: string
  sync_status: 'local' | 'synced' | 'dirty'
  deleted_at?: string | null
}

export interface WeightEntry {
  id: string
  date: string
  weight_kg: number
  note?: string
  created_at: string
  updated_at: string
  sync_status: 'local' | 'synced' | 'dirty'
  deleted_at?: string | null
}

export interface WaterEntry {
  id: string
  date: string
  amount_ml: number
  logged_at: string
  created_at: string
  updated_at: string
  sync_status: 'local' | 'synced' | 'dirty'
  deleted_at?: string | null
}

// Stores both the raw measurements and the computed result, so entries stay
// self-contained/reproducible even if the profile's gender/height or the
// formula itself changes later (same rationale as DiaryEntry storing both
// inputs and calorie/macro totals rather than just the totals).
export interface BodyFatEntry {
  id: string
  date: string
  gender: 'male' | 'female' | 'other'
  height_cm: number
  neck_cm: number
  waist_cm: number
  hip_cm?: number
  body_fat_percent: number
  category: 'essential' | 'athlete' | 'fitness' | 'average' | 'obese'
  created_at: string
  updated_at: string
  sync_status: 'local' | 'synced' | 'dirty'
  deleted_at?: string | null
}

class BasixMacroDatabase extends Dexie {
  users!: Table<User>
  food_items!: Table<FoodItem>
  recipes!: Table<Recipe>
  recipe_ingredients!: Table<RecipeIngredient>
  diary_entries!: Table<DiaryEntry>
  weight_entries!: Table<WeightEntry>
  water_entries!: Table<WaterEntry>
  body_fat_entries!: Table<BodyFatEntry>

  constructor() {
    super('BasixMacroDB')

    this.version(6).stores({
      users: 'id, sync_status',
      food_items: 'id, name, barcode, is_favorite, last_used_at, source, sync_status',
      recipes: 'id, name, sync_status',
      recipe_ingredients: 'id, recipe_id, food_item_id, sync_status',
      diary_entries: 'id, date, meal_type, food_item_id, recipe_id, sync_status',
      weight_entries: 'id, date, sync_status',
      water_entries: 'id, date, sync_status',
      body_fat_entries: 'id, date, sync_status',
    })

    this.version(5).stores({
      users: 'id, sync_status',
      food_items: 'id, name, barcode, is_favorite, last_used_at, source, sync_status',
      recipes: 'id, name, sync_status',
      recipe_ingredients: 'id, recipe_id, food_item_id, sync_status',
      diary_entries: 'id, date, meal_type, food_item_id, recipe_id, sync_status',
      weight_entries: 'id, date, sync_status',
      water_entries: 'id, date, sync_status',
      sync_queue: null,
    }).upgrade(async (tx) => {
      const now = new Date().toISOString()
      const tablesWithDeletedAt = [
        'users',
        'food_items',
        'recipes',
        'recipe_ingredients',
        'diary_entries',
        'weight_entries',
        'water_entries',
      ]
      for (const tableName of tablesWithDeletedAt) {
        await tx.table(tableName).toCollection().modify((row) => {
          if (row.deleted_at === undefined) row.deleted_at = null
        })
      }
      await tx.table('recipe_ingredients').toCollection().modify((row) => {
        if (row.sync_status === undefined) row.sync_status = 'synced'
        if (row.updated_at === undefined) row.updated_at = row.created_at ?? now
      })
    })

    this.version(4).stores({
      users: 'id, sync_status',
      food_items: 'id, name, barcode, is_favorite, last_used_at, source, sync_status',
      recipes: 'id, name, sync_status',
      recipe_ingredients: 'id, recipe_id, food_item_id',
      diary_entries: 'id, date, meal_type, food_item_id, recipe_id, sync_status',
      weight_entries: 'id, date, sync_status',
      water_entries: 'id, date, sync_status',
      sync_queue: 'id, table_name, operation, created_at, retry_count',
    })

    this.version(3).stores({
      users: 'id, sync_status',
      food_items: 'id, name, barcode, is_favorite, last_used_at, source, sync_status',
      recipes: 'id, name, sync_status',
      recipe_ingredients: 'id, recipe_id, food_item_id',
      diary_entries: 'id, date, meal_type, food_item_id, recipe_id, sync_status',
      weight_entries: 'id, date, sync_status',
      water_entries: 'id, date, sync_status',
      sync_queue: 'id, table_name, operation, created_at, retry_count',
    }).upgrade(async (tx) => {
      await tx.table('users').toCollection().modify((u) => {
        if (u.adaptive_calories_enabled == null) u.adaptive_calories_enabled = false
      })
    })

    this.version(2).stores({
      users: 'id, sync_status',
      food_items: 'id, name, barcode, is_favorite, last_used_at, source, sync_status',
      recipes: 'id, name, sync_status',
      recipe_ingredients: 'id, recipe_id, food_item_id',
      diary_entries: 'id, date, meal_type, food_item_id, recipe_id, sync_status',
      weight_entries: 'id, date, sync_status',
      water_entries: 'id, date, sync_status',
      sync_queue: 'id, table_name, operation, created_at, retry_count',
    }).upgrade(async (tx) => {
      await tx.table('users').toCollection().modify((u) => {
        if (u.water_goal_ml == null) u.water_goal_ml = 2000
      })
    })

    this.version(1).stores({
      users: 'id, sync_status',
      food_items: 'id, name, barcode, is_favorite, last_used_at, source, sync_status',
      recipes: 'id, name, sync_status',
      recipe_ingredients: 'id, recipe_id, food_item_id',
      diary_entries: 'id, date, meal_type, food_item_id, recipe_id, sync_status',
      weight_entries: 'id, date, sync_status',
      water_entries: 'id, date, sync_status',
      sync_queue: 'id, table_name, operation, created_at, retry_count',
    })
  }
}

export const db = new BasixMacroDatabase()
