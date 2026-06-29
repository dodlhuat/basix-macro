export interface OFFProduct {
  code: string
  product_name: string
  brands?: string
  serving_quantity?: number   // grams per serving (e.g. 30 for a 30g portion)
  serving_size?: string       // human label (e.g. "30 g")
  nutriments: {
    'energy-kcal_100g'?: number
    'energy-kcal_serving'?: number
    proteins_100g?: number
    proteins_serving?: number
    carbohydrates_100g?: number
    carbohydrates_serving?: number
    fat_100g?: number
    fat_serving?: number
    fiber_100g?: number
    fiber_serving?: number
    sugars_100g?: number
    sugars_serving?: number
  }
}

export interface OFFResult {
  found: boolean
  product?: OFFProduct
  error?: string
}

export function useOpenFoodFacts() {
  async function lookupBarcode(barcode: string): Promise<OFFResult> {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=code,product_name,brands,serving_quantity,serving_size,nutriments`,
      )

      if (!response.ok) {
        return { found: false, error: 'Netzwerkfehler' }
      }

      const data = await response.json()

      if (data.status !== 1 || !data.product) {
        return { found: false }
      }

      return { found: true, product: data.product as OFFProduct }
    }
    catch {
      return { found: false, error: 'Verbindung fehlgeschlagen' }
    }
  }

  function mapToFoodItem(product: OFFProduct) {
    const n = product.nutriments
    const sq = product.serving_quantity   // g per serving, used for fallback

    // Prefer _100g values; if missing, normalize _serving → per 100g using serving_quantity
    function per100g(v100g: number | undefined, vServing: number | undefined): number {
      if (v100g != null) return v100g
      if (vServing != null && sq && sq > 0) return (vServing / sq) * 100
      return 0
    }

    const cal   = per100g(n['energy-kcal_100g'], n['energy-kcal_serving'])
    const prot  = per100g(n.proteins_100g,       n.proteins_serving)
    const carbs = per100g(n.carbohydrates_100g,  n.carbohydrates_serving)
    const fat   = per100g(n.fat_100g,            n.fat_serving)
    const fiber = n.fiber_100g != null
      ? n.fiber_100g
      : (n.fiber_serving != null && sq && sq > 0 ? (n.fiber_serving / sq) * 100 : undefined)
    const sugar = n.sugars_100g != null
      ? n.sugars_100g
      : (n.sugars_serving != null && sq && sq > 0 ? (n.sugars_serving / sq) * 100 : undefined)

    return {
      name: product.product_name?.trim() || '',
      brand: product.brands?.split(',')[0]?.trim() || undefined,
      barcode: product.code,
      calories_per_100g: Math.round(cal),
      protein_per_100g:  Math.round(prot  * 10) / 10,
      carbs_per_100g:    Math.round(carbs * 10) / 10,
      fat_per_100g:      Math.round(fat   * 10) / 10,
      fiber_per_100g:    fiber != null ? Math.round(fiber * 10) / 10 : undefined,
      sugar_per_100g:    sugar != null ? Math.round(sugar * 10) / 10 : undefined,
      source: 'openfoodfacts' as const,
      is_favorite: false,
    }
  }

  return { lookupBarcode, mapToFoodItem }
}
