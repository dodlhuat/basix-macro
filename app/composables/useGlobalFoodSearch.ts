import type { FoodItem } from '../../db'

export interface GlobalFoodResult {
  id: string
  name: string
  brand?: string | null
  barcode?: string | null
  calories_per_100g: number
  protein_per_100g: number
  carbs_per_100g: number
  fat_per_100g: number
  fiber_per_100g?: number | null
  sugar_per_100g?: number | null
}

export function mapGlobalFoodToFoodItem(item: GlobalFoodResult): Omit<FoodItem, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'deleted_at'> {
  return {
    name: item.name,
    brand: item.brand ?? undefined,
    barcode: item.barcode ?? undefined,
    calories_per_100g: item.calories_per_100g,
    protein_per_100g: item.protein_per_100g,
    carbs_per_100g: item.carbs_per_100g,
    fat_per_100g: item.fat_per_100g,
    fiber_per_100g: item.fiber_per_100g ?? undefined,
    sugar_per_100g: item.sugar_per_100g ?? undefined,
    source: 'global',
    is_favorite: false,
  }
}

// ─── Deduping search results across sources ────────────────────────────────

interface SearchableFood {
  name: string
  brand?: string | null
  barcode?: string | null
}

function dedupeKey(item: SearchableFood): string {
  if (item.barcode) return `barcode:${item.barcode}`
  return `name:${item.name.trim().toLowerCase()}|${(item.brand ?? '').trim().toLowerCase()}`
}

export interface MergedSearchResults<L, G, O> {
  local: L[]
  global: G[]
  off: O[]
}

/**
 * Keeps every local result, then drops global/OFF results that duplicate something already
 * shown, in priority order local > global > OFF (matched by barcode, falling back to name+brand).
 */
export function mergeSearchResults<L extends SearchableFood, G extends SearchableFood, O extends SearchableFood>(
  local: L[],
  global: G[],
  off: O[],
): MergedSearchResults<L, G, O> {
  const seen = new Set(local.map(dedupeKey))

  const dedupedGlobal = global.filter((item) => {
    const key = dedupeKey(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const dedupedOff = off.filter(item => !seen.has(dedupeKey(item)))

  return { local, global: dedupedGlobal, off: dedupedOff }
}

// ─── API call ───────────────────────────────────────────────────────────────

export function useGlobalFoodSearch() {
  async function searchGlobalFoods(query: string): Promise<GlobalFoodResult[]> {
    const authStore = useAuthStore()
    if (!authStore.isAuthenticated || !query.trim()) return []

    try {
      const { get } = useApi()
      const response = await get<{ data: GlobalFoodResult[] }>('/global-foods', { q: query })
      return (response.data ?? []).filter(item => item.calories_per_100g > 0)
    } catch {
      return []
    }
  }

  return { searchGlobalFoods }
}
