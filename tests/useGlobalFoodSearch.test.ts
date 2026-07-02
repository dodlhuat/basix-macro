import { describe, it, expect } from 'vitest'
import { mapGlobalFoodToFoodItem, mergeSearchResults } from '../app/composables/useGlobalFoodSearch'
import type { GlobalFoodResult } from '../app/composables/useGlobalFoodSearch'

function makeGlobalResult(overrides: Partial<GlobalFoodResult> = {}): GlobalFoodResult {
  return {
    id: 'g1',
    name: 'Apfel',
    brand: 'Bio',
    barcode: '1234567890123',
    calories_per_100g: 52,
    protein_per_100g: 0.3,
    carbs_per_100g: 14,
    fat_per_100g: 0.2,
    fiber_per_100g: 2.4,
    sugar_per_100g: 10.4,
    ...overrides,
  }
}

describe('mapGlobalFoodToFoodItem', () => {
  it('maps all nutrition fields and marks the source as global', () => {
    const result = mapGlobalFoodToFoodItem(makeGlobalResult())
    expect(result).toEqual({
      name: 'Apfel',
      brand: 'Bio',
      barcode: '1234567890123',
      calories_per_100g: 52,
      protein_per_100g: 0.3,
      carbs_per_100g: 14,
      fat_per_100g: 0.2,
      fiber_per_100g: 2.4,
      sugar_per_100g: 10.4,
      source: 'global',
      is_favorite: false,
    })
  })

  it('converts null optional fields to undefined', () => {
    const result = mapGlobalFoodToFoodItem(makeGlobalResult({ brand: null, barcode: null, fiber_per_100g: null, sugar_per_100g: null }))
    expect(result.brand).toBeUndefined()
    expect(result.barcode).toBeUndefined()
    expect(result.fiber_per_100g).toBeUndefined()
    expect(result.sugar_per_100g).toBeUndefined()
  })
})

describe('mergeSearchResults', () => {
  it('keeps all local results untouched', () => {
    const local = [{ name: 'Apfel', barcode: '111' }]
    const { local: mergedLocal } = mergeSearchResults(local, [], [])
    expect(mergedLocal).toBe(local)
  })

  it('drops a global result that duplicates a local item by barcode', () => {
    const local = [{ name: 'Apfel', barcode: '111' }]
    const global = [{ name: 'Apfel (Bio)', barcode: '111' }, { name: 'Banane', barcode: '222' }]
    const { global: mergedGlobal } = mergeSearchResults(local, global, [])
    expect(mergedGlobal.map(i => i.name)).toEqual(['Banane'])
  })

  it('drops a global result that duplicates a local item by name+brand when no barcode is present', () => {
    const local = [{ name: 'Apfel', brand: 'Bio' }]
    const global = [{ name: 'apfel', brand: 'BIO' }, { name: 'Apfel', brand: 'Andere Marke' }]
    const { global: mergedGlobal } = mergeSearchResults(local, global, [])
    expect(mergedGlobal.map(i => i.name)).toEqual(['Apfel'])
  })

  it('drops OFF results that duplicate either a local or a global item', () => {
    const local = [{ name: 'Apfel', barcode: '111' }]
    const global = [{ name: 'Banane', barcode: '222' }]
    const off = [
      { name: 'Apfel Bio', barcode: '111' },
      { name: 'Banane Bio', barcode: '222' },
      { name: 'Kirsche', barcode: '333' },
    ]
    const { off: mergedOff } = mergeSearchResults(local, global, off)
    expect(mergedOff.map(i => i.name)).toEqual(['Kirsche'])
  })

  it('returns everything unchanged when there is nothing to dedupe', () => {
    const local = [{ name: 'Apfel', barcode: '111' }]
    const global = [{ name: 'Banane', barcode: '222' }]
    const off = [{ name: 'Kirsche', barcode: '333' }]
    const result = mergeSearchResults(local, global, off)
    expect(result.local).toHaveLength(1)
    expect(result.global).toHaveLength(1)
    expect(result.off).toHaveLength(1)
  })
})
