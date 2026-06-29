import { defineStore } from 'pinia'
import type { FoodItem } from '../../db'

export const useFoodStore = defineStore('food', () => {
  const items = ref<FoodItem[]>([])
  const searchQuery = ref('')
  const activeFilter = ref<'all' | 'favorites' | 'recent'>('all')

  // ─── Load actions ─────────────────────────────────────────────────────────────

  async function loadAll() {
    const { db } = await import('../../db')
    items.value = await db.food_items.orderBy('name').toArray()
  }

  async function loadFavorites(): Promise<void> {
    const { db } = await import('../../db')
    const all = await db.food_items.toArray()
    items.value = all
      .filter(f => f.is_favorite)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  async function loadRecent(): Promise<void> {
    const { db } = await import('../../db')
    items.value = await db.food_items
      .orderBy('last_used_at')
      .reverse()
      .limit(30)
      .toArray()
  }

  // ─── Search ───────────────────────────────────────────────────────────────────

  async function search(query: string) {
    const { db } = await import('../../db')
    searchQuery.value = query
    if (!query.trim()) {
      // Revert to current filter on clear
      if (activeFilter.value === 'favorites') {
        await loadFavorites()
      } else if (activeFilter.value === 'recent') {
        await loadRecent()
      } else {
        items.value = await db.food_items.orderBy('name').toArray()
      }
      return
    }
    const lower = query.toLowerCase()
    items.value = await db.food_items
      .filter(
        f =>
          f.name.toLowerCase().includes(lower) ||
          (f.brand ?? '').toLowerCase().includes(lower),
      )
      .toArray()
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  async function addItem(
    data: Omit<FoodItem, 'id' | 'created_at' | 'updated_at' | 'sync_status'>,
  ): Promise<string> {
    const { db } = await import('../../db')
    const now = new Date().toISOString()
    const id = crypto.randomUUID()
    await db.food_items.add({
      ...data,
      id,
      created_at: now,
      updated_at: now,
      sync_status: 'local',
    })
    return id
  }

  async function updateItem(id: string, data: Partial<FoodItem>): Promise<void> {
    const { db } = await import('../../db')
    const now = new Date().toISOString()
    await db.food_items.update(id, { ...data, updated_at: now, sync_status: 'dirty' })
    const idx = items.value.findIndex(f => f.id === id)
    if (idx !== -1) {
      items.value[idx] = {
        ...items.value[idx],
        ...data,
        updated_at: now,
        sync_status: 'dirty',
      } as FoodItem
    }
  }

  async function deleteItem(id: string): Promise<void> {
    const { db } = await import('../../db')
    await db.food_items.delete(id)
    items.value = items.value.filter(f => f.id !== id)
  }

  async function findByBarcode(barcode: string): Promise<FoodItem | undefined> {
    const { db } = await import('../../db')
    return db.food_items.where('barcode').equals(barcode).first()
  }

  async function toggleFavorite(id: string): Promise<void> {
    const { db } = await import('../../db')
    const food = await db.food_items.get(id)
    if (!food) return
    const now = new Date().toISOString()
    const newFav = !food.is_favorite
    await db.food_items.update(id, {
      is_favorite: newFav,
      updated_at: now,
      sync_status: 'dirty',
    })
    const idx = items.value.findIndex(f => f.id === id)
    if (idx !== -1) {
      items.value[idx] = {
        ...items.value[idx],
        is_favorite: newFav,
        updated_at: now,
        sync_status: 'dirty',
      } as FoodItem
    }
  }

  return {
    items,
    searchQuery,
    activeFilter,
    loadAll,
    loadFavorites,
    loadRecent,
    search,
    addItem,
    updateItem,
    deleteItem,
    findByBarcode,
    toggleFavorite,
  }
})
