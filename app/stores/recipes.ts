import { defineStore } from 'pinia'
import type { Recipe, RecipeIngredient, FoodItem } from '../../db'

export interface RecipeIngredientDetail extends RecipeIngredient {
  food: FoodItem
}

export interface RecipeWithNutrition extends Recipe {
  ingredients: RecipeIngredientDetail[]
  /** Totals for the entire recipe (all servings combined) */
  total_calories: number
  total_protein_g: number
  total_carbs_g: number
  total_fat_g: number
  /** Per-serving values */
  calories_per_serving: number
  protein_per_serving_g: number
  carbs_per_serving_g: number
  fat_per_serving_g: number
}

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([])
  const activeRecipe = ref<RecipeWithNutrition | null>(null)

  // ─── Load ─────────────────────────────────────────────────────────────────────

  async function loadAll() {
    const { db } = await import('../../db')
    recipes.value = excludeDeleted(await db.recipes.orderBy('name').toArray())
  }

  async function loadRecipe(id: string): Promise<RecipeWithNutrition | null> {
    const { db } = await import('../../db')
    const recipe = await db.recipes.get(id)
    if (!recipe || recipe.deleted_at) return null

    const rawIngredients = await db.recipe_ingredients
      .where('recipe_id').equals(id).filter(i => !i.deleted_at).toArray()

    const ingredients: RecipeIngredientDetail[] = []
    for (const ing of rawIngredients) {
      const food = await db.food_items.get(ing.food_item_id)
      if (food) ingredients.push({ ...ing, food })
    }

    const nutrition = calcTotals(ingredients)
    const servings = recipe.servings || 1
    const result: RecipeWithNutrition = {
      ...recipe,
      ingredients,
      ...nutrition,
      calories_per_serving: Math.round(nutrition.total_calories / servings),
      protein_per_serving_g: Math.round(nutrition.total_protein_g / servings * 10) / 10,
      carbs_per_serving_g: Math.round(nutrition.total_carbs_g / servings * 10) / 10,
      fat_per_serving_g: Math.round(nutrition.total_fat_g / servings * 10) / 10,
    }

    activeRecipe.value = result
    return result
  }

  // ─── Nutrition helper ─────────────────────────────────────────────────────────

  function calcTotals(ingredients: RecipeIngredientDetail[]) {
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

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  /**
   * Creates a recipe with all its ingredients in one Dexie transaction. Unlike
   * createRecipe() + repeated addIngredient() calls (which each trigger a full
   * loadRecipe() re-read), this writes everything atomically and reloads once —
   * used when converting an already-logged meal (diary/[date].vue) into a recipe,
   * where the ingredient list is already known upfront.
   */
  async function createRecipeWithIngredients(
    name: string,
    ingredients: { food_item_id: string, amount_g: number }[],
  ): Promise<string> {
    const { db } = await import('../../db')
    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    await db.transaction('rw', db.recipes, db.recipe_ingredients, async () => {
      await db.recipes.add({
        id,
        name,
        servings: 1,
        created_at: now,
        updated_at: now,
        sync_status: 'local',
      })
      for (const ing of ingredients) {
        await db.recipe_ingredients.add({
          id: crypto.randomUUID(),
          recipe_id: id,
          food_item_id: ing.food_item_id,
          amount_g: ing.amount_g,
          created_at: now,
          updated_at: now,
          sync_status: 'local',
        })
      }
    })

    await loadAll()
    return id
  }

  async function createRecipe(name: string, servings: number, description?: string): Promise<string> {
    const { db } = await import('../../db')
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    await db.recipes.add({
      id,
      name,
      servings,
      description,
      created_at: now,
      updated_at: now,
      sync_status: 'local',
    })
    await loadAll()
    return id
  }

  async function updateRecipe(id: string, data: Partial<Pick<Recipe, 'name' | 'servings' | 'description'>>): Promise<void> {
    const { db } = await import('../../db')
    await db.recipes.update(id, { ...data, updated_at: new Date().toISOString(), sync_status: 'dirty' })
    await loadAll()
    if (activeRecipe.value?.id === id) await loadRecipe(id)
  }

  async function deleteRecipe(id: string): Promise<void> {
    const { db } = await import('../../db')
    const now = new Date().toISOString()
    const recipe = await db.recipes.get(id)
    if (recipe) await db.recipes.put(markDeleted(recipe, now))
    const ingredients = await db.recipe_ingredients.where('recipe_id').equals(id).toArray()
    for (const ingredient of ingredients) {
      await db.recipe_ingredients.put(markDeleted(ingredient, now))
    }
    recipes.value = recipes.value.filter(r => r.id !== id)
    if (activeRecipe.value?.id === id) activeRecipe.value = null
  }

  // ─── Ingredients ──────────────────────────────────────────────────────────────

  async function addIngredient(recipe_id: string, food_item_id: string, amount_g: number): Promise<string> {
    const { db } = await import('../../db')
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    await db.recipe_ingredients.add({
      id,
      recipe_id,
      food_item_id,
      amount_g,
      created_at: now,
      updated_at: now,
      sync_status: 'local',
    })
    await loadRecipe(recipe_id)
    return id
  }

  async function updateIngredient(id: string, amount_g: number): Promise<void> {
    const { db } = await import('../../db')
    await db.recipe_ingredients.update(id, { amount_g, updated_at: new Date().toISOString(), sync_status: 'dirty' })
    if (activeRecipe.value) await loadRecipe(activeRecipe.value.id)
  }

  async function removeIngredient(id: string, recipe_id: string): Promise<void> {
    const { db } = await import('../../db')
    const ingredient = await db.recipe_ingredients.get(id)
    if (ingredient) await db.recipe_ingredients.put(markDeleted(ingredient, new Date().toISOString()))
    await loadRecipe(recipe_id)
  }

  return {
    recipes,
    activeRecipe,
    loadAll,
    loadRecipe,
    calcTotals,
    createRecipe,
    createRecipeWithIngredients,
    updateRecipe,
    deleteRecipe,
    addIngredient,
    updateIngredient,
    removeIngredient,
  }
})
