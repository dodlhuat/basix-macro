import { defineStore } from 'pinia'
import type { DiaryEntry, FoodItem, WaterEntry } from '../../db'
import type { ClipboardItem, MealType } from '../utils/mealClipboard'

export type DiaryEntryWithName = DiaryEntry & { food_item_name: string; is_quick_add: boolean }

export const useDiaryStore = defineStore('diary', () => {
  const entries = ref<DiaryEntry[]>([])
  const waterEntries = ref<WaterEntry[]>([])
  const entryDetails = ref<DiaryEntryWithName[]>([])
  const activeDate = ref<string>(toLocalDateStr(new Date()))

  // Sync runs in the background (interval, reconnect, manual button) and can pull in
  // entries logged on another device — reload whatever date is currently on screen once
  // a sync finishes, so it doesn't keep showing stale pre-sync data until the user
  // navigates away and back.
  const syncStore = useSyncStore()
  watch(() => syncStore.isSyncing, (isSyncing, wasSyncing) => {
    if (wasSyncing && !isSyncing) void loadForDate(activeDate.value)
  })

  async function loadForDate(date: string) {
    const { db } = await import('../../db')
    activeDate.value = date
    const rawEntries = await db.diary_entries.where('date').equals(date).filter(e => !e.deleted_at).toArray()
    entries.value = rawEntries
    waterEntries.value = await db.water_entries.where('date').equals(date).filter(w => !w.deleted_at).toArray()

    // Enrich entries with food/recipe names
    const details: DiaryEntryWithName[] = []
    for (const entry of rawEntries) {
      let food_item_name = 'Unbekanntes Lebensmittel'
      let is_quick_add = false
      if (entry.food_item_id) {
        const food = await db.food_items.get(entry.food_item_id)
        if (food) {
          food_item_name = food.name
          is_quick_add = food.source === 'quick_add'
        }
      } else if (entry.recipe_id) {
        const recipe = await db.recipes.get(entry.recipe_id)
        if (recipe) food_item_name = recipe.name
      }
      details.push({ ...entry, food_item_name, is_quick_add })
    }
    entryDetails.value = details
  }

  const totalCalories = computed(() =>
    entries.value.reduce((sum, e) => sum + e.calories_total, 0),
  )
  const totalProtein = computed(() =>
    entries.value.reduce((sum, e) => sum + e.protein_total_g, 0),
  )
  const totalCarbs = computed(() =>
    entries.value.reduce((sum, e) => sum + e.carbs_total_g, 0),
  )
  const totalFat = computed(() =>
    entries.value.reduce((sum, e) => sum + e.fat_total_g, 0),
  )
  const totalWater = computed(() =>
    waterEntries.value.reduce((sum, e) => sum + e.amount_ml, 0),
  )

  async function addWater(amount_ml: number, date: string) {
    const { db } = await import('../../db')
    const now = new Date().toISOString()
    await db.water_entries.add({
      id: crypto.randomUUID(),
      date,
      amount_ml,
      logged_at: now,
      created_at: now,
      updated_at: now,
      sync_status: 'local',
    })
    waterEntries.value = await db.water_entries.where('date').equals(date).toArray()
  }

  async function addEntry(params: {
    date: string
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    food_item_id: string
    amount_g: number
    food: FoodItem
  }): Promise<void> {
    const { db } = await import('../../db')
    const now = new Date().toISOString()
    const factor = params.amount_g / 100

    await db.diary_entries.add({
      id: crypto.randomUUID(),
      date: params.date,
      meal_type: params.meal_type,
      food_item_id: params.food_item_id,
      amount_g: params.amount_g,
      servings: 1,
      calories_total: params.food.calories_per_100g * factor,
      protein_total_g: params.food.protein_per_100g * factor,
      carbs_total_g: params.food.carbs_per_100g * factor,
      fat_total_g: params.food.fat_per_100g * factor,
      logged_at: now,
      created_at: now,
      updated_at: now,
      sync_status: 'local',
    })

    // Mark food as recently used
    await db.food_items.update(params.food_item_id, {
      last_used_at: now,
      updated_at: now,
      sync_status: 'dirty',
    })

    await loadForDate(params.date)
  }

  /**
   * Logs a calorie estimate without a real food item — "Restaurant-Essen, ~650 kcal".
   * Creates a disposable, single-use FoodItem (source: 'quick_add') so the diary entry
   * can reuse the normal food_item_id machinery (name resolution, edit/delete, sync)
   * instead of needing its own schema. That FoodItem is excluded from every food list
   * (see food.ts) so it never clutters "recently used" or search, and it's never
   * submitted to the global food database (SyncService only submits source: 'manual').
   */
  async function addQuickEntry(params: {
    date: string
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    calories: number
    name?: string
    protein_g?: number
    carbs_g?: number
    fat_g?: number
  }): Promise<void> {
    const { db } = await import('../../db')
    const now = new Date().toISOString()
    const foodId = crypto.randomUUID()
    const food: FoodItem = {
      id: foodId,
      name: params.name?.trim() || 'Schnelleintrag',
      calories_per_100g: params.calories,
      protein_per_100g: params.protein_g ?? 0,
      carbs_per_100g: params.carbs_g ?? 0,
      fat_per_100g: params.fat_g ?? 0,
      source: 'quick_add',
      is_favorite: false,
      last_used_at: now,
      created_at: now,
      updated_at: now,
      sync_status: 'local',
    }
    await db.food_items.add(food)

    await addEntry({
      date: params.date,
      meal_type: params.meal_type,
      food_item_id: foodId,
      amount_g: 100,
      food,
    })
  }

  async function addRecipeEntry(params: {
    date: string
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    recipe_id: string
    servings: number
    calories_per_serving: number
    protein_per_serving_g: number
    carbs_per_serving_g: number
    fat_per_serving_g: number
  }): Promise<void> {
    const { db } = await import('../../db')
    const now = new Date().toISOString()
    await db.diary_entries.add({
      id: crypto.randomUUID(),
      date: params.date,
      meal_type: params.meal_type,
      recipe_id: params.recipe_id,
      amount_g: 0,
      servings: params.servings,
      calories_total: params.calories_per_serving * params.servings,
      protein_total_g: params.protein_per_serving_g * params.servings,
      carbs_total_g: params.carbs_per_serving_g * params.servings,
      fat_total_g: params.fat_per_serving_g * params.servings,
      logged_at: now,
      created_at: now,
      updated_at: now,
      sync_status: 'local',
    })
    await loadForDate(params.date)
  }

  /**
   * Pastes copied meal entries into `meal_type` on `date` (appends, never replaces).
   * Values are the snapshot from copy time. Quick-add items get a fresh disposable
   * FoodItem so editing/deleting one entry never affects its copy. Items whose food or
   * recipe has since been deleted are skipped. Returns the created entry ids (for undo)
   * and how many items were skipped.
   */
  async function pasteEntries(
    items: ClipboardItem[],
    date: string,
    mealType: MealType,
  ): Promise<{ ids: string[]; skipped: number }> {
    const { db } = await import('../../db')
    const now = new Date().toISOString()
    const ids: string[] = []
    let skipped = 0

    await db.transaction('rw', db.diary_entries, db.food_items, db.recipes, async () => {
      for (const item of items) {
        let foodId = item.food_item_id

        if (item.is_quick_add) {
          foodId = crypto.randomUUID()
          await db.food_items.add({
            id: foodId,
            name: item.name,
            calories_per_100g: item.calories_total,
            protein_per_100g: item.protein_total_g,
            carbs_per_100g: item.carbs_total_g,
            fat_per_100g: item.fat_total_g,
            source: 'quick_add',
            is_favorite: false,
            last_used_at: now,
            created_at: now,
            updated_at: now,
            sync_status: 'local',
          })
        } else if (foodId) {
          const food = await db.food_items.get(foodId)
          if (!food || food.deleted_at) { skipped++; continue }
          await db.food_items.update(foodId, { last_used_at: now, updated_at: now, sync_status: 'dirty' })
        } else if (item.recipe_id) {
          const recipe = await db.recipes.get(item.recipe_id)
          if (!recipe || recipe.deleted_at) { skipped++; continue }
        } else {
          skipped++
          continue
        }

        const id = crypto.randomUUID()
        await db.diary_entries.add({
          id,
          date,
          meal_type: mealType,
          food_item_id: foodId,
          recipe_id: item.is_quick_add ? undefined : item.recipe_id,
          amount_g: item.amount_g,
          servings: item.servings,
          calories_total: item.calories_total,
          protein_total_g: item.protein_total_g,
          carbs_total_g: item.carbs_total_g,
          fat_total_g: item.fat_total_g,
          logged_at: now,
          created_at: now,
          updated_at: now,
          sync_status: 'local',
        })
        ids.push(id)
      }
    })

    await loadForDate(date)
    return { ids, skipped }
  }

  /** Soft-deletes entries created by a paste (undo). */
  async function undoPaste(ids: string[], date: string): Promise<void> {
    const { db } = await import('../../db')
    const now = new Date().toISOString()
    await db.transaction('rw', db.diary_entries, async () => {
      for (const id of ids) {
        const entry = await db.diary_entries.get(id)
        if (entry) await db.diary_entries.put(markDeleted(entry, now))
      }
    })
    await loadForDate(date)
  }

  async function updateEntryQuantity(id: string, newQuantity: number) {
    const { db } = await import('../../db')
    const entry = await db.diary_entries.get(id)
    if (!entry) return

    const isRecipe = !!entry.recipe_id
    const oldQuantity = isRecipe ? entry.servings : entry.amount_g
    if (oldQuantity <= 0 || newQuantity <= 0) return

    const factor = newQuantity / oldQuantity
    const now = new Date().toISOString()

    await db.diary_entries.update(id, {
      ...(isRecipe ? { servings: newQuantity } : { amount_g: newQuantity }),
      calories_total: entry.calories_total * factor,
      protein_total_g: entry.protein_total_g * factor,
      carbs_total_g: entry.carbs_total_g * factor,
      fat_total_g: entry.fat_total_g * factor,
      updated_at: now,
      sync_status: 'dirty',
    })

    await loadForDate(entry.date)
  }

  /**
   * Amount logged the last time this food was added to the diary, so the
   * add-food sheet can preselect it instead of always defaulting to 100g.
   */
  async function getLastAmountForFood(foodItemId: string): Promise<number | null> {
    const { db } = await import('../../db')
    const pastEntries = await db.diary_entries
      .where('food_item_id').equals(foodItemId)
      .filter(e => !e.deleted_at)
      .toArray()
    if (!pastEntries.length) return null
    pastEntries.sort((a, b) => b.logged_at.localeCompare(a.logged_at))
    return pastEntries[0]?.amount_g ?? null
  }

  async function deleteEntry(id: string) {
    const { db } = await import('../../db')
    const entry = await db.diary_entries.get(id)
    if (!entry) return
    const now = new Date().toISOString()
    await db.diary_entries.put(markDeleted(entry, now))
    entries.value = entries.value.filter(e => e.id !== id)
    entryDetails.value = entryDetails.value.filter(e => e.id !== id)
  }

  /** Undo for deleteEntry: clears the soft-delete flag and marks the entry dirty so it re-syncs. */
  async function restoreEntry(id: string, date: string): Promise<void> {
    const { db } = await import('../../db')
    const entry = await db.diary_entries.get(id)
    if (!entry) return
    await db.diary_entries.put({
      ...entry,
      deleted_at: null,
      updated_at: new Date().toISOString(),
      sync_status: 'dirty',
    })
    await loadForDate(date)
  }

  /**
   * Edits the kcal of a quick-add entry. Quick-add entries are logged as 100 g of a
   * disposable FoodItem whose per-100g values equal the entry totals, so both are updated
   * together. Macros stay as entered.
   */
  async function updateQuickEntryCalories(id: string, calories: number): Promise<void> {
    if (!Number.isFinite(calories) || calories <= 0) return
    const { db } = await import('../../db')
    const entry = await db.diary_entries.get(id)
    if (!entry?.food_item_id) return
    const food = await db.food_items.get(entry.food_item_id)
    if (!food || food.source !== 'quick_add') return
    const now = new Date().toISOString()
    await db.transaction('rw', db.diary_entries, db.food_items, async () => {
      await db.food_items.update(food.id, { calories_per_100g: calories, updated_at: now, sync_status: 'dirty' })
      await db.diary_entries.update(id, { calories_total: calories, updated_at: now, sync_status: 'dirty' })
    })
    await loadForDate(entry.date)
  }

  return {
    entries,
    waterEntries,
    entryDetails,
    activeDate,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    totalWater,
    loadForDate,
    addWater,
    addEntry,
    addQuickEntry,
    addRecipeEntry,
    pasteEntries,
    undoPaste,
    updateEntryQuantity,
    deleteEntry,
    restoreEntry,
    updateQuickEntryCalories,
    getLastAmountForFood,
  }
})
