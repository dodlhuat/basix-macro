import { defineStore } from 'pinia'
import type { DiaryEntry, FoodItem, WaterEntry } from '../../db'

export type DiaryEntryWithName = DiaryEntry & { food_item_name: string }

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
      if (entry.food_item_id) {
        const food = await db.food_items.get(entry.food_item_id)
        if (food) food_item_name = food.name
      } else if (entry.recipe_id) {
        const recipe = await db.recipes.get(entry.recipe_id)
        if (recipe) food_item_name = recipe.name
      }
      details.push({ ...entry, food_item_name })
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

  async function deleteEntry(id: string) {
    const { db } = await import('../../db')
    const entry = await db.diary_entries.get(id)
    if (!entry) return
    const now = new Date().toISOString()
    await db.diary_entries.put(markDeleted(entry, now))
    entries.value = entries.value.filter(e => e.id !== id)
    entryDetails.value = entryDetails.value.filter(e => e.id !== id)
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
    addRecipeEntry,
    updateEntryQuantity,
    deleteEntry,
  }
})
