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

  async function updateLocale(locale: 'de' | 'en'): Promise<void> {
    await updateSetting('locale', locale)
  }

  /** Marks the local profile as successfully pushed, without changing its data. */
  async function markSynced(): Promise<void> {
    if (!user.value) return
    const { db } = await import('../../db')
    await db.users.update(user.value.id, { sync_status: 'synced' })
    user.value = { ...user.value, sync_status: 'synced' }
  }

  /**
   * Overwrites the local profile with a server-provided version (sync pull / conflict
   * resolution). Also handles the no-local-profile-yet case — logging in on a fresh
   * device before ever completing onboarding there — by adopting the remote row as-is.
   * The backend doesn't send `created_at` for the profile, so it falls back to
   * `updated_at`, matching the same convention used for every other synced table.
   */
  async function applyRemote(remote: Record<string, unknown>): Promise<void> {
    const { db } = await import('../../db')
    const merged: User = user.value
      ? { ...user.value, ...remote, id: user.value.id, sync_status: 'synced' }
      : {
          ...(remote as unknown as Omit<User, 'created_at' | 'sync_status'>),
          created_at: remote.updated_at as string,
          sync_status: 'synced',
        }
    await db.users.put(merged)
    user.value = merged
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
      db.body_fat_entries.clear(),
      db.activity_entries.clear(),
    ])
    user.value = null
  }

  return { user, isOnboarded, loadUser, saveUser, updateSetting, updateLocale, markSynced, applyRemote, resetAllData }
})
