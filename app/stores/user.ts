import { defineStore } from 'pinia'
import type { User } from '../../db'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isOnboarded = computed(() => user.value !== null)

  async function loadUser() {
    const { db } = await import('../../db')
    const users = await db.users.toArray()
    user.value = users[0] ?? null
  }

  async function saveUser(data: User) {
    const { db } = await import('../../db')
    await db.users.put(data)
    user.value = data
  }

  async function updateSetting<K extends keyof User>(key: K, value: User[K]): Promise<void> {
    if (!user.value) return
    const { db } = await import('../../db')
    const now = new Date().toISOString()
    await db.users.update(user.value.id, { [key]: value, updated_at: now, sync_status: 'dirty' } as Partial<User>)
    user.value = { ...user.value, [key]: value, updated_at: now, sync_status: 'dirty' }
  }

  async function resetAllData(): Promise<void> {
    const { db } = await import('../../db')
    await Promise.all([
      db.users.clear(),
      db.food_items.clear(),
      db.diary_entries.clear(),
      db.water_entries.clear(),
      db.weight_entries.clear(),
      db.recipes.clear(),
      db.recipe_ingredients.clear(),
      db.sync_queue.clear(),
    ])
    user.value = null
  }

  return { user, isOnboarded, loadUser, saveUser, updateSetting, resetAllData }
})
