import { defineStore } from 'pinia'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
}

const STORAGE_KEY = 'basixmacro.auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<AuthUser | null>(null)

  const isAuthenticated = computed(() => token.value !== null)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function persist() {
    if (!import.meta.client) return
    if (token.value && user.value) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: token.value, user: user.value }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  function hydrate() {
    if (!import.meta.client) return
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as { token: string, user: AuthUser }
      token.value = parsed.token
      user.value = parsed.user
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  /** Clears the local session without calling the backend (e.g. after a 401). */
  function clearSession() {
    token.value = null
    user.value = null
    persist()
  }

  async function login(email: string, password: string): Promise<void> {
    const { post } = useApi()
    const response = await post<{ token: string, user: AuthUser }>('/auth/login', { email, password })
    token.value = response.token
    user.value = response.user
    persist()

    // Upload/merge whatever this device already has locally, then pull the rest of the account's data.
    const syncStore = useSyncStore()
    void syncStore.syncNow({ full: true })
  }

  async function logout(): Promise<void> {
    const { post } = useApi()
    try {
      await post('/auth/logout')
    } catch {
      // Session is cleared locally regardless of whether the backend call succeeds.
    }
    clearSession()
  }

  return { token, user, isAuthenticated, isAdmin, hydrate, login, logout, clearSession }
})
