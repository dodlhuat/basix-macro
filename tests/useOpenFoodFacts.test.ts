import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useOpenFoodFacts } from '../app/composables/useOpenFoodFacts'

const { lookupBarcode, mapToFoodItem } = useOpenFoodFacts()

// ─── mapToFoodItem ────────────────────────────────────────────────────────────

describe('mapToFoodItem', () => {
  const baseProduct = {
    code: '4000521006029',
    product_name: '  Chicken Breast  ',
    brands: 'Rewe, Bio',
    nutriments: {
      'energy-kcal_100g': 110,
      proteins_100g: 23.5,
      carbohydrates_100g: 0,
      fat_100g: 1.2,
      fiber_100g: 0,
      sugars_100g: 0,
    },
  }

  it('maps product name (trimmed)', () => {
    expect(mapToFoodItem(baseProduct).name).toBe('Chicken Breast')
  })

  it('takes only first brand', () => {
    expect(mapToFoodItem(baseProduct).brand).toBe('Rewe')
  })

  it('passes barcode through', () => {
    expect(mapToFoodItem(baseProduct).barcode).toBe('4000521006029')
  })

  it('rounds calories to integer', () => {
    const p = { ...baseProduct, nutriments: { ...baseProduct.nutriments, 'energy-kcal_100g': 110.7 } }
    expect(mapToFoodItem(p).calories_per_100g).toBe(111)
  })

  it('rounds macros to 1 decimal place', () => {
    const p = { ...baseProduct, nutriments: { ...baseProduct.nutriments, proteins_100g: 23.567 } }
    expect(mapToFoodItem(p).protein_per_100g).toBe(23.6)
  })

  it('sets source to openfoodfacts', () => {
    expect(mapToFoodItem(baseProduct).source).toBe('openfoodfacts')
  })

  it('sets is_favorite to false', () => {
    expect(mapToFoodItem(baseProduct).is_favorite).toBe(false)
  })

  it('omits fiber when undefined in nutriments', () => {
    const p = { ...baseProduct, nutriments: { 'energy-kcal_100g': 100, proteins_100g: 10, carbohydrates_100g: 10, fat_100g: 5 } }
    expect(mapToFoodItem(p).fiber_per_100g).toBeUndefined()
  })

  it('omits brand when not present', () => {
    const p = { ...baseProduct, brands: undefined }
    expect(mapToFoodItem(p).brand).toBeUndefined()
  })

  it('defaults missing calories to 0', () => {
    const p = { ...baseProduct, nutriments: {} }
    expect(mapToFoodItem(p).calories_per_100g).toBe(0)
  })

  it('falls back to _serving values when _100g is missing', () => {
    // 350 kcal per 35g serving → 1000 kcal per 100g
    const p = {
      code: '123',
      product_name: 'Chips',
      serving_quantity: 35,
      nutriments: {
        'energy-kcal_serving': 350,
        proteins_serving: 3.5,
        carbohydrates_serving: 42,
        fat_serving: 17.5,
      },
    }
    const result = mapToFoodItem(p)
    expect(result.calories_per_100g).toBe(1000)
    expect(result.protein_per_100g).toBe(10)
    expect(result.carbs_per_100g).toBe(120)
    expect(result.fat_per_100g).toBe(50)
  })

  it('prefers _100g over _serving when both exist', () => {
    const p = {
      ...baseProduct,
      serving_quantity: 30,
      nutriments: {
        'energy-kcal_100g': 110,
        'energy-kcal_serving': 999,
        proteins_100g: 23.5,
        carbohydrates_100g: 0,
        fat_100g: 1.2,
      },
    }
    expect(mapToFoodItem(p).calories_per_100g).toBe(110)
  })

  it('returns 0 for _serving without serving_quantity', () => {
    const p = {
      code: '456',
      product_name: 'Unknown',
      nutriments: { 'energy-kcal_serving': 200 },
    }
    expect(mapToFoodItem(p).calories_per_100g).toBe(0)
  })
})

// ─── lookupBarcode ────────────────────────────────────────────────────────────

describe('lookupBarcode', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns found=true with product on status 1', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 1,
        product: { code: '123', product_name: 'Test', nutriments: {} },
      }),
    }))

    const result = await lookupBarcode('123')
    expect(result.found).toBe(true)
    expect(result.product?.product_name).toBe('Test')
  })

  it('returns found=false when status is 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 0 }),
    }))

    const result = await lookupBarcode('000')
    expect(result.found).toBe(false)
  })

  it('returns found=false with error on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))

    const result = await lookupBarcode('999')
    expect(result.found).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('returns found=false with error on fetch exception', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))

    const result = await lookupBarcode('111')
    expect(result.found).toBe(false)
    expect(result.error).toBeTruthy()
  })
})
